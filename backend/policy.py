"""Ask-or-answer policy.

The brief allows two or three questions before recommending. Left to a prompt, a
model asks six or none. So the decision is code: keep asking only while the
candidate set is genuinely ambiguous, cap it hard at three, and when a question
is warranted, ask the one that splits the remaining candidates most.

Information gain is measured as the entropy of the partition a question would
induce over the *current* candidates — so "which brand?" is only asked when the
brands actually differ, and "what's your budget?" only when the prices are
spread. A question that would not narrow anything is never asked.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from catalog import Catalog, Query
from taxonomy import GROUP_LABELS
from vntext import format_vnd

MAX_QUESTIONS = 3
# Three products is all a reply ever shows, so at or below this there is nothing
# left for a question to narrow and asking one is just delay.
NOTHING_LEFT_TO_NARROW = 3
# A question must promise at least this much entropy to be worth a turn.
MIN_GAIN = 0.45
# Once the shopper has volunteered this many discriminating constraints they
# have told us what they want; asking more reads as an interrogation. "Điện
# thoại pin trâu dưới 8 củ" is slang + budget — answer it, do not ask brand.
ENOUGH_CONSTRAINTS = 2

# Entropy alone over-rewards questions with many possible answers: brand always
# has more distinct values than budget, so it always won on raw information
# gain. These priors encode which answer actually changes the recommendation.
#
# Brand's is low enough to look like a thumb on the scale, and it is. Six brands
# carry ~1.8 nats where any three- or four-option question caps near 1.1, so a
# mild prior still left brand winning every time — which is how "tủ lạnh, dưới
# 12 triệu" came to be asked about brands rather than about how many people it
# has to feed. Capacity is a requirement; a brand is a preference, and it should
# only be asked once the requirements are known.
SLOT_PRIORITY = {"budget": 1.6, "usage": 1.3, "brand": 0.45}


@dataclass
class Question:
    slot: str
    text: str
    chips: list[str] = field(default_factory=list)
    gain: float = 0.0


@dataclass
class Decision:
    action: str                       # 'ask' | 'answer'
    question: Question | None = None
    candidate_count: int = 0
    reason: str = ""


def _entropy(counts: list[int]) -> float:
    total = sum(counts)
    if total <= 0:
        return 0.0
    h = 0.0
    for c in counts:
        if c > 0:
            p = c / total
            h -= p * math.log(p)
    return h


def _budget_question(cat: Catalog, q: Query) -> Question | None:
    """Ask about budget only if price actually separates the candidates."""
    lo, hi = cat.price_span(q)
    if lo <= 0 or hi <= 0 or hi <= lo:
        return None
    spread = hi / max(lo, 1)
    if spread < 2.5:
        return None      # everything costs about the same; the answer is noise

    # Offer bands drawn from the real distribution rather than round numbers
    # that might contain nothing.
    row = cat.con.execute(
        "SELECT p25, p50, p75 FROM category_stats WHERE cat_group = ?",
        (q.group,)).fetchone() if q.group else None
    if row:
        b1, b2 = int(row["p25"]), int(row["p75"])
    else:
        b1, b2 = int(lo + (hi - lo) / 3), int(lo + 2 * (hi - lo) / 3)

    chips = [f"Dưới {format_vnd(b1)}", f"{format_vnd(b1)} – {format_vnd(b2)}",
             f"Trên {format_vnd(b2)}", "Tuỳ bạn"]
    # Three bands, roughly even by construction -> gain approaches ln(3).
    gain = min(math.log(3), math.log(spread))
    return Question("budget", "Ngân sách của bạn khoảng bao nhiêu ạ?", chips, gain)


def _brand_question(cat: Catalog, q: Query) -> Question | None:
    facets = cat.facet(q, "brand", limit=6)
    if len(facets) < 3:
        return None
    counts = [c for _, c in facets]
    gain = _entropy(counts)
    chips = [b for b, _ in facets[:4]] + ["Hãng nào cũng được"]
    return Question("brand", "Bạn có ưu tiên hãng nào không ạ?", chips, gain)


def _group_question(cat: Catalog, q: Query,
                    inferred: list[str] | None = None) -> Question:
    if inferred:
        # The slang already narrowed it: ask between the two or three plausible
        # categories rather than offering the whole catalog.
        chips = [GROUP_LABELS.get(g, g) for g in inferred[:4]]
        return Question("group", "Bạn đang tìm loại nào ạ?", chips, gain=10.0)
    facets = cat.facet(Query(), "cat_group", limit=6)
    chips = [GROUP_LABELS.get(g, g) for g, _ in facets[:5]]
    # Nothing narrows a 13k-row catalog like knowing what the shopper wants.
    return Question("group", "Bạn đang muốn tìm sản phẩm gì ạ?", chips, gain=10.0)


# Category-specific follow-ups. These map onto slang the lexicon already knows,
# so the answer feeds straight back into the same pipeline.
_USAGE_QUESTIONS: dict[str, tuple[str, list[str]]] = {
    "laptop": ("Bạn dùng laptop chủ yếu để làm gì ạ?",
               ["Học tập, văn phòng", "Chơi game", "Đồ hoạ, dựng phim",
                "Nhẹ để mang đi"]),
    "phone": ("Bạn quan tâm điều gì nhất ở điện thoại ạ?",
              ["Pin trâu", "Camera đẹp", "Chơi game mượt", "Giá rẻ"]),
    "ac": ("Phòng bạn rộng khoảng bao nhiêu ạ?",
           ["Dưới 15m²", "15–25m²", "Trên 25m²", "Không rõ"]),
    "fridge": ("Nhà bạn mấy người dùng ạ?",
               ["1–2 người", "3–4 người", "Trên 5 người", "Tuỳ bạn"]),
    "washer": ("Nhà bạn thường giặt nhiều không ạ?",
               ["Ít, 1–2 người", "Vừa, 3–4 người", "Nhiều, trên 5 người"]),
    "tv": ("Bạn muốn tivi cỡ bao nhiêu inch ạ?",
           ["Dưới 50 inch", "55–65 inch", "Trên 70 inch", "Tuỳ bạn"]),
    "audio": ("Bạn dùng để nghe gì là chính ạ?",
              ["Nghe nhạc", "Xem phim", "Chơi game", "Gọi điện, họp"]),
}


def _usage_question(q: Query, asked: set[str]) -> Question | None:
    if not q.group or "usage" in asked:
        return None
    spec = _USAGE_QUESTIONS.get(q.group)
    if not spec:
        return None
    text, chips = spec
    return Question("usage", text, chips, gain=0.85)


def count_constraints(q: Query) -> int:
    """How much the shopper has actually pinned down.

    The category is deliberately *not* counted. Knowing "tủ lạnh" makes ranking
    possible — it takes 13,754 rows down to 251 — but it does not make it good:
    every fridge in the catalog still qualifies, and the three that come back
    are chosen by popularity alone. Counting it meant a bare category plus one
    answered question already looked like a fully specified request, so the
    assistant asked exactly one question and never the two or three the brief
    calls for.

    What counts is what discriminates *within* a category: a budget, a stated
    need, a brand.
    """
    return sum((
        not q.price.is_empty(),
        bool(q.feature_filters or q.text_terms),
        bool(q.brands),
    ))


def decide(cat: Catalog, q: Query, *, asked: set[str], accept_any: bool = False,
           inferred_groups: list[str] | None = None) -> Decision:
    """Ask another question, or stop and recommend.

    Questions exist to resolve genuine ambiguity, not to fill a quota, so the
    number asked falls out of how much the shopper has already said rather than
    a counter: keep asking while fewer than ENOUGH_CONSTRAINTS discriminating
    facts are known, stop at MAX_QUESTIONS regardless. A bare "tủ lạnh" earns
    two or three; "điện thoại pin trâu dưới 8 củ" earns none.
    """
    n = cat.count(q)

    if accept_any:
        return Decision("answer", None, n, "khách để mình tự chọn")
    if len(asked) >= MAX_QUESTIONS:
        return Decision("answer", None, n, "đã hỏi đủ số câu")
    if n == 0:
        # Nothing matches. Another question cannot help; relax and show the
        # closest things instead.
        return Decision("answer", None, 0, "không có kết quả, sẽ nới điều kiện")
    if not q.group:
        # Without a category there is nothing to rank; this is always worth asking.
        return Decision("ask", _group_question(cat, q, inferred_groups), n,
                        "chưa biết loại sản phẩm")

    given = count_constraints(q)
    if given >= ENOUGH_CONSTRAINTS:
        return Decision("answer", None, n, f"khách đã nêu {given} tiêu chí, trả lời luôn")
    if n <= NOTHING_LEFT_TO_NARROW:
        # Every match already fits on screen, so no answer could change which
        # products come back. This is the one place a thin request is allowed
        # through, because asking would be theatre.
        return Decision("answer", None, n, f"chỉ còn {n} lựa chọn, không cần hỏi thêm")

    candidates: list[Question] = []
    if "budget" not in asked and q.price.is_empty():
        bq = _budget_question(cat, q)
        if bq:
            candidates.append(bq)
    if "usage" not in asked:
        uq = _usage_question(q, asked)
        if uq:
            candidates.append(uq)
    if "brand" not in asked and not q.brands:
        brq = _brand_question(cat, q)
        if brq:
            candidates.append(brq)

    candidates = [c for c in candidates if c.gain >= MIN_GAIN]
    if not candidates:
        return Decision("answer", None, n, "không câu hỏi nào thu hẹp thêm được")

    best = max(candidates, key=lambda c: c.gain * SLOT_PRIORITY.get(c.slot, 1.0))
    return Decision("ask", best, n, f"còn {n} lựa chọn, hỏi thêm '{best.slot}'")


# Sizing answers, per category: the shopper replies in square metres, household
# size or inches, and each has to become a filter on a spec.
#
# This does not belong in the lexicon, which maps slang and deliberately deals
# in no units at all; it is a sizing rule, so it lives next to the question that
# asked for it. Each band is (quantity ceiling, feature min, feature max), and
# the bands are checked in order. Thresholds are the ordinary Vietnamese retail
# rules of thumb, checked against this catalog so that no band is empty.
_SIZING: dict[str, tuple[str, tuple[tuple[float, float | None, float | None], ...]]] = {
    # người in the house -> litres of fridge (32 / 82 / 154 products)
    "fridge": ("capacity_l", ((2, None, 250), (4, 250, 450), (99, 400, None))),
    # người -> kilos per wash (27 / 123 / 113)
    "washer": ("wash_kg", ((2, None, 9), (4, 9, 12), (99, 11, None))),
    # m² of room -> horsepower, the standard ~15m² per HP (129 / 129 / 99)
    "ac": ("cooling_hp", ((15, None, 1.5), (25, 1.5, 2.5), (999, 2.0, None))),
    # inches -> inches; the answer is already in the feature's own unit (55/142/110)
    "tv": ("screen_inch", ((50, None, 50), (65, 55, 65), (999, 70, None))),
}


# The unit has to be on the page before a bare number can be read as a size:
# "tủ lạnh 15 triệu" is a budget, not a household of fifteen.
_SIZING_UNITS = {"fridge": r"nguoi", "washer": r"nguoi",
                 "ac": r"m2|m²", "tv": r"inch"}


def _sizing_band(group: str | None, lo: float | None,
                 hi: float | None) -> list[tuple[str, str, float]]:
    """Turn a quantity into filters on the category's sizing spec."""
    spec = _SIZING.get(group or "")
    if not spec or (lo is None and hi is None):
        return []                      # "không rõ" — no number to size from
    feat, bands = spec

    # An upper bound picks the band it falls in; a bare "trên 5 người" has to
    # land in the band *above* five, not the one that ends there.
    if hi is not None:
        band = next((b for b in bands if hi <= b[0]), bands[-1])
    else:
        band = next((b for b in bands if lo < b[0]), bands[-1])

    _, fmin, fmax = band
    out: list[tuple[str, str, float]] = []
    if fmin is not None:
        out.append((feat, ">=", float(fmin)))
    if fmax is not None:
        out.append((feat, "<=", float(fmax)))
    return out


def _sizing_filters(group: str | None, text: str) -> list[tuple[str, str, float]]:
    """Read a sizing answer ("3–4 người", "phòng 20m2") into feature filters."""
    from vntext import parse_quantity

    return _sizing_band(group, *parse_quantity(text))


def stated_sizing(group: str | None, text: str) -> list[tuple[str, str, float]]:
    """Sizing the shopper gave unprompted: "tủ lạnh cho gia đình 4 người".

    Asking "nhà bạn mấy người dùng ạ?" straight after they said four is the
    kind of question that makes an assistant look like it is not listening, so
    a size stated up front binds exactly as the answer to the question would.
    """
    import re

    from vntext import normalize, parse_quantity

    unit = _SIZING_UNITS.get(group or "")
    if not unit or not re.search(unit, normalize(text)):
        return []
    return _sizing_band(group, *parse_quantity(text, use_cues=False))


def apply_answer(slot: str, text: str, q: Query, cat: Catalog) -> None:
    """Fold a shopper's answer to a question back into the query in place."""
    from vntext import normalize, parse_price

    t = normalize(text)
    if slot == "budget":
        pc = parse_price(text)
        if not pc.is_empty():
            q.price = pc
    elif slot == "brand":
        if "cung duoc" not in t and "nao cung" not in t:
            for brand, _ in cat.facet(q, "brand", limit=40):
                if normalize(brand) in t:
                    q.brands = [brand]
                    break
    elif slot == "usage":
        # The phrase-shaped answers ("chơi game", "pin trâu") are slang and the
        # lexicon has already resolved them by the time we get here. Only the
        # ones written as a quantity are left for this to handle.
        seen = {(f, op) for f, op, _ in q.feature_filters}
        for feat, op, val in _sizing_filters(q.group, text):
            if (feat, op) not in seen:
                q.feature_filters.append((feat, op, val))
