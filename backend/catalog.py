"""Retrieval and ranking.

No model runs here. Filtering is indexed SQL and ranking is an explicit weighted
sum, which buys three things the latency budget and the demo both need:

  * it finishes in milliseconds, leaving the whole time budget to generation;
  * every pick can be explained ("chip mạnh nhất trong tầm giá, đang giảm 21%");
  * the model is handed three real rows and can only ever talk about those, so
    it cannot invent a product or a price.

When a query is too strict to match anything, constraints are relaxed in a fixed
order and the relaxations are reported, so the assistant can say what it gave up
instead of silently returning something that does not fit.
"""

from __future__ import annotations

import math
import re
import sqlite3
from dataclasses import dataclass, field

from vntext import PriceConstraint, fold

# Ranking weights. Deliberately explicit and few — these are meant to be read,
# argued with and tuned, not learned.
W_RELEVANCE = 2.2
W_PRICE_FIT = 1.6
W_RATING = 1.1
W_POPULARITY = 1.0
W_DISCOUNT = 0.7
W_PROMO = 0.3
W_HEADROOM = 0.8

# Colour and capacity words that distinguish variants of one product rather than
# distinct products. Stripped when building the de-duplication key so three
# colours of one phone never occupy all three recommendation slots.
_VARIANT_NOISE = re.compile(
    r"\b(den|trang|xanh|do|hong|vang|bac|tim|xam|nau|kem|be|navy|"
    r"gold|silver|black|white|blue|red|pink|green|grey|gray|titan|"
    r"\d+gb|\d+tb|\d+ml|\d+l|\d+w|\d+inch|\d+\"|ban|phien|loai)\b")


@dataclass
class Query:
    """Everything needed to retrieve, assembled from slang + NLU + history."""
    group: str | None = None
    price: PriceConstraint = field(default_factory=PriceConstraint)
    feature_filters: list[tuple[str, str, float]] = field(default_factory=list)
    text_terms: list[tuple[str, ...]] = field(default_factory=list)
    keywords: str = ""
    brands: list[str] = field(default_factory=list)
    boosts: dict[str, float] = field(default_factory=dict)


@dataclass
class Product:
    product_id: str
    name: str
    brand: str | None
    category: str
    cat_group: str
    price: int
    price_list: int | None
    discount_pct: float | None
    rating: float | None
    n_sold: int | None
    promotion: str | None
    warranty: str | None
    url: str | None
    image_url: str | None
    score: float = 0.0
    reasons: list[str] = field(default_factory=list)
    features: dict[str, float] = field(default_factory=dict)

    def as_dict(self) -> dict:
        return {
            "id": self.product_id, "name": self.name, "brand": self.brand,
            "category": self.category, "price": self.price,
            "price_list": self.price_list, "discount_pct": self.discount_pct,
            "rating": self.rating, "n_sold": self.n_sold,
            "promotion": self.promotion, "warranty": self.warranty,
            "url": self.url, "image": self.image_url,
            "reasons": self.reasons, "features": self.features,
        }


@dataclass
class SearchResult:
    products: list[Product]
    total_matched: int
    relaxed: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# SQL assembly
# --------------------------------------------------------------------------

_ALLOWED_OPS = {">=", "<="}


def _fts_query(text: str) -> str:
    """Build a safe FTS5 MATCH expression from user text.

    Every token is quoted, which neutralises FTS operators a shopper could type
    by accident ('máy giặt - máy sấy' otherwise parses as a NOT).
    """
    toks = [t for t in re.split(r"[^a-z0-9]+", fold(text)) if len(t) > 1]
    return " OR ".join(f'"{t}"' for t in toks[:12])


def _build(q: Query, use_features: bool, use_text: bool,
           price: PriceConstraint | None) -> tuple[str, list]:
    where, params = ["p.price > 0"], []

    if q.group:
        where.append("p.cat_group = ?")
        params.append(q.group)

    if price:
        if price.min is not None:
            where.append("p.price >= ?")
            params.append(price.min)
        if price.max is not None:
            where.append("p.price <= ?")
            params.append(price.max)

    if q.brands:
        where.append("(" + " OR ".join(["p.brand_fold = ?"] * len(q.brands)) + ")")
        params.extend(fold(b) for b in q.brands)

    if use_features:
        for feat, op, val in q.feature_filters:
            if op not in _ALLOWED_OPS:
                continue
            where.append(
                "EXISTS (SELECT 1 FROM features f WHERE f.product_id = p.product_id "
                f"AND f.feat = ? AND f.value {op} ?)")
            params.extend([feat, val])

    if use_text:
        for terms in q.text_terms:
            # A term group is satisfied by any one of its spellings.
            expr = " OR ".join(f'"{fold(t)}"' for t in terms if t)
            if expr:
                where.append(
                    "p.product_id IN (SELECT product_id FROM products_fts "
                    "WHERE products_fts MATCH ?)")
                params.append(expr)

    return " AND ".join(where), params


def _dedupe_key(name: str, brand: str | None) -> str:
    """Collapse colour/capacity variants of the same model onto one key."""
    n = _VARIANT_NOISE.sub(" ", fold(name))
    toks = [t for t in n.split() if t][:5]
    return f"{fold(brand)}|{' '.join(toks)}"


# --------------------------------------------------------------------------
# Scoring
# --------------------------------------------------------------------------

def _price_fit(price: int, pc: PriceConstraint, prefer_cheap: bool) -> float:
    lo, hi = pc.min, pc.max
    if lo is None and hi is None:
        return 0.5
    if lo is not None and hi is not None and lo < hi:
        if lo <= price <= hi:
            pos = (price - lo) / (hi - lo)
            # Inside the budget, a shopper who said "dưới 20 triệu" generally
            # wants the best thing under 20, not the cheapest — unless they
            # asked for cheap or for value, where the preference inverts.
            return 1.0 - 0.25 * pos if prefer_cheap else 0.75 + 0.25 * pos
    if hi is not None and price > hi:
        return max(0.0, 1.0 - (price - hi) / max(hi, 1))
    if lo is not None and price < lo:
        return max(0.0, 1.0 - (lo - price) / max(lo, 1) * 0.5)
    return 0.8


def _score(p: Product, q: Query, rel: float, max_sold: int) -> float:
    prefer_cheap = q.price.tier == "budget" or q.price.prefer_value
    s = W_RELEVANCE * rel
    s += W_PRICE_FIT * _price_fit(p.price, q.price, prefer_cheap)
    s += W_RATING * (max(0.0, (p.rating or 0) - 3.0) / 2.0)
    s += W_POPULARITY * (math.log1p(p.n_sold or 0) / math.log1p(max(max_sold, 1)))
    s += W_DISCOUNT * min(1.0, (p.discount_pct or 0) * 2.5)
    s += W_PROMO * (1.0 if p.promotion else 0.0)

    for fieldname, weight in q.boosts.items():
        if fieldname == "rating":
            s += weight * (max(0.0, (p.rating or 0) - 3.0) / 2.0)
        elif fieldname == "n_sold":
            s += weight * (math.log1p(p.n_sold or 0) / math.log1p(max(max_sold, 1)))
        elif fieldname == "discount":
            s += weight * min(1.0, (p.discount_pct or 0) * 2.5)
        elif fieldname == "promo":
            s += weight * (1.0 if p.promotion else 0.0)
        elif fieldname == "cheap":
            s += weight * 0.0
    return s


def _reasons(p: Product, q: Query, labels: list[str]) -> list[str]:
    """Short, checkable justifications. Every one is read off the row."""
    out: list[str] = []
    if p.discount_pct and p.discount_pct >= 0.10:
        out.append(f"đang giảm {p.discount_pct * 100:.0f}%")
    if q.price.max and p.price <= q.price.max:
        out.append("nằm trong ngân sách")
    if p.rating and p.rating >= 4.5:
        out.append(f"đánh giá {p.rating:g}/5")
    if p.n_sold and p.n_sold >= 1000:
        out.append(f"đã bán {p.n_sold:,}".replace(",", ".") + " chiếc")
    if p.promotion:
        out.append("có khuyến mãi kèm")
    return out[:3]


# --------------------------------------------------------------------------
# Search
# --------------------------------------------------------------------------

class Catalog:
    def __init__(self, db_path: str):
        self.con = sqlite3.connect(db_path, check_same_thread=False)
        self.con.row_factory = sqlite3.Row
        self._max_sold = self.con.execute(
            "SELECT COALESCE(MAX(n_sold), 1) FROM products").fetchone()[0]

    # -- helpers used by the question policy --------------------------------

    def count(self, q: Query) -> int:
        where, params = _build(q, True, True, q.price)
        return self.con.execute(
            f"SELECT COUNT(*) FROM products p WHERE {where}", params).fetchone()[0]

    def price_span(self, q: Query) -> tuple[int, int]:
        where, params = _build(q, True, True, q.price)
        row = self.con.execute(
            f"SELECT MIN(price), MAX(price) FROM products p WHERE {where}",
            params).fetchone()
        return (row[0] or 0, row[1] or 0)

    def facet(self, q: Query, column: str, limit: int = 8) -> list[tuple[str, int]]:
        """Distinct values of a column among current candidates, most common first."""
        if column not in {"brand", "cat_group", "category"}:
            raise ValueError(f"unsupported facet column: {column}")
        where, params = _build(q, True, True, q.price)
        rows = self.con.execute(
            f"SELECT p.{column}, COUNT(*) c FROM products p WHERE {where} "
            f"AND p.{column} IS NOT NULL GROUP BY p.{column} "
            f"ORDER BY c DESC LIMIT ?", [*params, limit])
        return [(r[0], r[1]) for r in rows]

    def resolve_price_tier(self, group: str | None, tier: str | None
                           ) -> tuple[int | None, int | None]:
        """Turn 'rẻ' / 'cao cấp' into real numbers for this category."""
        if not tier or not group:
            return None, None
        row = self.con.execute(
            "SELECT p25, p75 FROM category_stats WHERE cat_group = ?",
            (group,)).fetchone()
        if not row:
            return None, None
        if tier == "budget":
            return None, int(row["p25"])
        if tier == "premium":
            return int(row["p75"]), None
        return None, None

    # -- main entry point ---------------------------------------------------

    def search(self, q: Query, limit: int = 3, labels: list[str] | None = None
               ) -> SearchResult:
        labels = labels or []

        # A relative tier only becomes a number once the category is known.
        price = q.price
        if price.tier and (price.min is None and price.max is None):
            lo, hi = self.resolve_price_tier(q.group, price.tier)
            price = PriceConstraint(min=lo, max=hi, tier=price.tier,
                                    prefer_value=price.prefer_value, raw=price.raw)

        # Relaxation ladder: give up the least informative constraint first and
        # never return an empty result to the user.
        widened = PriceConstraint(
            min=int(price.min * 0.7) if price.min else None,
            max=int(price.max * 1.3) if price.max else None,
            tier=price.tier, prefer_value=price.prefer_value, raw=price.raw)
        attempts = [
            (True, True, price, None),
            (True, False, price, "bỏ bớt yêu cầu mô tả"),
            (False, True, price, "bỏ bớt yêu cầu thông số"),
            (False, False, price, "chỉ giữ lại ngân sách"),
            (False, False, widened, "nới ngân sách ~30%"),
            (False, False, PriceConstraint(), "bỏ giới hạn ngân sách"),
        ]

        rows, relaxed, total = [], [], 0
        for use_feat, use_text, pc, note in attempts:
            where, params = _build(q, use_feat, use_text, pc)
            total = self.con.execute(
                f"SELECT COUNT(*) FROM products p WHERE {where}", params).fetchone()[0]
            if total:
                rows = self.con.execute(
                    f"SELECT p.* FROM products p WHERE {where} "
                    # Cheap pre-cut before scoring: popular, well-rated rows
                    # first, capped so scoring never touches the whole catalog.
                    "ORDER BY COALESCE(p.n_sold,0) DESC, COALESCE(p.rating,0) DESC "
                    "LIMIT 400", params).fetchall()
                if note:
                    relaxed.append(note)
                break
            if note:
                relaxed.append(note)

        if not rows:
            return SearchResult([], 0, relaxed)

        # Relevance from the full-text index, fetched once for the candidate set.
        rel_by_id: dict[str, float] = {}
        expr = _fts_query(q.keywords)
        if expr:
            ids = {r["product_id"] for r in rows}
            for pid, bm in self.con.execute(
                "SELECT product_id, bm25(products_fts) FROM products_fts "
                "WHERE products_fts MATCH ? ORDER BY bm25(products_fts) LIMIT 600",
                (expr,)
            ):
                if pid in ids:
                    rel_by_id[pid] = bm
        if rel_by_id:
            worst = max(rel_by_id.values())
            best = min(rel_by_id.values())
            span = (worst - best) or 1.0
            rel_by_id = {k: (worst - v) / span for k, v in rel_by_id.items()}

        products: list[Product] = []
        for r in rows:
            p = Product(
                product_id=r["product_id"], name=r["name"], brand=r["brand"],
                category=r["category"], cat_group=r["cat_group"], price=r["price"],
                price_list=r["price_list"], discount_pct=r["discount_pct"],
                rating=r["rating"], n_sold=r["n_sold"], promotion=r["promotion"],
                warranty=r["warranty"], url=r["url"], image_url=r["image_url"])
            p.score = _score(p, q, rel_by_id.get(p.product_id, 0.0), self._max_sold)
            products.append(p)

        products.sort(key=lambda x: x.score, reverse=True)

        # One entry per model: three colours of one phone is not three choices.
        picked: list[Product] = []
        seen: set[str] = set()
        for p in products:
            key = _dedupe_key(p.name, p.brand)
            if key in seen:
                continue
            seen.add(key)
            picked.append(p)
            if len(picked) >= limit:
                break

        for p in picked:
            p.features = {
                row["feat"]: row["value"] for row in self.con.execute(
                    "SELECT feat, value FROM features WHERE product_id = ?",
                    (p.product_id,))
            }
            p.reasons = _reasons(p, q, labels)

        return SearchResult(picked, total, relaxed)

    def close(self) -> None:
        self.con.close()
