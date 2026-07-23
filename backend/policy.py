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
# Below this many candidates, ranking is trustworthy enough to just answer.
ENOUGH_TO_ANSWER = 40
# A question must promise at least this much entropy to be worth a turn.
MIN_GAIN = 0.45
# Once the shopper has volunteered this many independent constraints they have
# told us what they want; asking more reads as an interrogation. "Điện thoại pin
# trâu dưới 8 củ" is category + slang + budget — answer it, do not ask brand.
ENOUGH_CONSTRAINTS = 2

# Entropy alone over-rewards questions with many possible answers: brand always
# has more distinct values than budget, so it always won on raw information
# gain. These priors encode which answer actually changes the recommendation.
SLOT_PRIORITY = {"budget": 1.6, "usage": 1.3, "brand": 0.7}


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
    """How much the shopper has actually pinned down."""
    return sum((
        bool(q.group),
        not q.price.is_empty(),
        bool(q.feature_filters or q.text_terms),
        bool(q.brands),
    ))


def decide(cat: Catalog, q: Query, *, asked: set[str], accept_any: bool = False,
           inferred_groups: list[str] | None = None) -> Decision:
    """Ask another question, or stop and recommend.

    Questions exist to resolve genuine ambiguity, not to fill a quota. A vague
    opening earns one or two; a specific request earns none.
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
    if n <= ENOUGH_TO_ANSWER:
        return Decision("answer", None, n, f"chỉ còn {n} lựa chọn")

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
