"""Conversation orchestration.

Holds the turn loop together: understand -> decide -> retrieve -> speak.

Two things here matter more than the plumbing:

  The model is handed three already-chosen rows and asked only to write about
  them. It never picks products and never sees the catalog, so it cannot offer
  something that does not exist.

  Every number it writes is checked against those rows before the reply is
  accepted. A shop assistant that invents a price is worse than no assistant, so
  a reply that fails the check is replaced with a templated one built from the
  same data.
"""

from __future__ import annotations

import random
import re
import time
import uuid
from dataclasses import dataclass, field

from catalog import Catalog, Product, Query, SearchResult
from lexicon import detect_group, match_rules
from llm import LLM
from nlu import Intent, Understander, Understanding, merge
from policy import Decision, Question, apply_answer, decide, stated_sizing
from taxonomy import GROUP_LABELS
from vntext import format_vnd

# Stable across every request so Ollama's prompt cache keeps hitting; the
# measured prefill on a cache hit is effectively zero.
SYSTEM_PROMPT = (
    "Bạn là trợ lý tư vấn mua sắm của Điện Máy Xanh.\n"
    "QUY TẮC BẮT BUỘC:\n"
    "- CHỈ nói về những sản phẩm có trong danh sách được cung cấp.\n"
    "- TUYỆT ĐỐI không bịa tên sản phẩm, giá tiền, hay thông số.\n"
    "- Không nhắc lại đầy đủ danh sách: khách đã nhìn thấy thẻ sản phẩm rồi.\n"
    "- Nhiệm vụ của bạn là nêu ĐIỂM KHÁC BIỆT để khách dễ chọn.\n"
    # Guards catch invented numbers and brands, but not invented events. A model
    # left to itself will helpfully suggest waiting for a December sale that
    # does not exist anywhere in the data.
    "- KHÔNG nói về thời điểm nên mua, chương trình sắp diễn ra, hay bất kỳ "
    "thông tin nào không có trong danh sách trên.\n"
    "- Tối đa 3 câu. Không dùng markdown, không gạch đầu dòng.\n"
    "- Giọng thân thiện, tự nhiên. Xưng 'mình', gọi khách là 'bạn'."
)

SMALLTALK = {
    Intent.GREETING: [
        "Chào bạn! Mình là trợ lý mua sắm của Điện Máy Xanh. "
        "Bạn đang cần tìm sản phẩm gì ạ?",
        "Xin chào bạn! Bạn muốn mình tư vấn sản phẩm nào hôm nay ạ?",
    ],
    Intent.THANKS: [
        "Dạ không có gì ạ! Bạn cần tư vấn thêm gì cứ nhắn mình nhé.",
        "Rất vui được giúp bạn! Cần tìm thêm gì bạn cứ nói nha.",
    ],
    Intent.BYE: [
        "Cảm ơn bạn đã ghé Điện Máy Xanh, hẹn gặp lại bạn nhé!",
        "Tạm biệt bạn, chúc bạn mua sắm vui vẻ ạ!",
    ],
    Intent.ABOUT_BOT: [
        "Mình là trợ lý tư vấn của Điện Máy Xanh. Mình giúp bạn tìm sản phẩm "
        "phù hợp nhất trong hơn 13.000 mặt hàng — bạn cứ nói nhu cầu và ngân "
        "sách, mình gợi ý ngay ạ.",
    ],
    Intent.OFF_TOPIC: [
        "Cái này thì mình chịu rồi ạ! Mình chỉ rành về đồ điện máy thôi. "
        "Bạn đang cần tìm sản phẩm gì để mình tư vấn nha?",
    ],
    Intent.UNCLEAR: [
        "Bạn muốn tìm sản phẩm gì ạ? Cứ nói nhu cầu và tầm giá, mình gợi ý cho bạn.",
    ],
}

STARTER_CHIPS = ["Điện thoại pin trâu dưới 8 triệu", "Laptop sinh viên nhẹ",
                 "Máy lạnh tiết kiệm điện", "Tủ lạnh cho gia đình 4 người"]


@dataclass
class Session:
    id: str
    understanding: Understanding | None = None
    asked: set[str] = field(default_factory=set)
    pending_slot: str | None = None
    last_products: list[Product] = field(default_factory=list)
    turns: int = 0
    # Set for the one turn on which the subject changed: where the previous
    # conversation was parked, so the browser can keep pointing its old chat
    # at it. Cleared at the start of every turn.
    archived_id: str | None = None


@dataclass
class Reply:
    kind: str                                   # 'smalltalk' | 'question' | 'recommend'
    text: str = ""
    chips: list[str] = field(default_factory=list)
    products: list[dict] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    debug: dict = field(default_factory=dict)


# --------------------------------------------------------------------------
# Number guard
# --------------------------------------------------------------------------

_DIGITS = re.compile(r"\d[\d.,]*")


def _numeric_tokens(s: str) -> set[str]:
    """Digit runs with separators stripped, so 7.730.000 == 7730000."""
    return {re.sub(r"[.,]", "", m.group(0)).lstrip("0") or "0"
            for m in _DIGITS.finditer(s or "")}


def allowed_numbers(products: list[Product], user_text: str = "") -> set[str]:
    """Every figure the model is permitted to write."""
    # Numbers the shopper themselves used ("phòng 20m²", "dưới 8 củ") are fair
    # to echo back — they are not claims about the catalog.
    ok: set[str] = _numeric_tokens(user_text)
    for p in products:
        for v in (p.price, p.price_list, p.n_sold):
            if v:
                ok |= _numeric_tokens(str(int(v)))
                # Shorthand forms a human would use: 7.730.000₫ -> "7,7 triệu".
                ok.add(str(int(v) // 1_000_000))
                ok.add(str(round(int(v) / 1_000_000, 1)).replace(".", ""))
                ok.add(str(int(v) // 1_000))
        if p.discount_pct:
            ok.add(str(int(round(p.discount_pct * 100))))
        if p.rating:
            ok |= _numeric_tokens(str(p.rating))
        for txt in (p.name, p.promotion, p.warranty):
            ok |= _numeric_tokens(txt or "")
        for val in p.features.values():
            ok |= _numeric_tokens(str(val))
            ok.add(str(int(val)))
    # Ordinals and small counts the assistant naturally uses.
    ok |= {str(i) for i in range(0, 11)}
    return ok


def check_numbers(reply: str, products: list[Product], user_text: str = "") -> list[str]:
    """Return any figure in the reply that is not backed by the product rows."""
    ok = allowed_numbers(products, user_text)
    return [tok for tok in _numeric_tokens(reply) if tok not in ok]


def check_brands(reply: str, products: list[Product], known_brands: set[str],
                 user_text: str = "") -> list[str]:
    """Catch a brand the model named that is not among the shown products.

    The number guard cannot see this failure: "tủ lạnh Sharp có thể là lựa chọn
    tốt" contains no figure at all, yet recommends something that was never
    retrieved. Any catalog brand appearing in the reply must be one of the three
    on screen — or one the shopper themselves brought up.
    """
    from vntext import normalize as _n

    shown = {_n(p.brand) for p in products if p.brand}
    # A brand word inside a shown product's name counts as shown too.
    for p in products:
        shown |= set(_n(p.name).split())
    asked = set(_n(user_text).split())

    text = _n(reply)
    bad: list[str] = []
    for b in known_brands:
        if len(b) < 4:
            continue                      # too short to match safely in prose
        if b in shown or b in asked:
            continue
        if re.search(rf"(?<![a-z0-9]){re.escape(b)}(?![a-z0-9])", text):
            bad.append(b)
    return bad


# --------------------------------------------------------------------------
# Prompt + fallback rendering
# --------------------------------------------------------------------------

_SPEC_LABELS = {
    "battery_mah": ("pin", "mAh"), "ram_gb": ("RAM", "GB"),
    "storage_gb": ("bộ nhớ", "GB"), "screen_inch": ("màn", "inch"),
    "capacity_l": ("dung tích", "lít"), "wash_kg": ("giặt", "kg"),
    "power_w": ("công suất", "W"), "weight_kg": ("nặng", "kg"),
    "cooling_hp": ("công suất", "HP"), "camera_mp": ("camera", "MP"),
    "refresh_hz": ("tần số", "Hz"), "battery_hours": ("pin", "giờ"),
    "cpu_ghz": ("CPU", "GHz"), "water_atm": ("kháng nước", "ATM"),
}


def _spec_line(p: Product, group: str | None) -> str:
    """A couple of headline specs, chosen for the category being shopped."""
    order = {
        "phone": ("battery_mah", "ram_gb", "storage_gb", "camera_mp"),
        "laptop": ("ram_gb", "storage_gb", "cpu_ghz", "weight_kg"),
        "tv": ("screen_inch", "refresh_hz"),
        "fridge": ("capacity_l",), "washer": ("wash_kg",), "ac": ("cooling_hp",),
        "audio": ("battery_hours", "battery_mah"), "powerbank": ("battery_mah",),
        "cooking": ("capacity_l", "power_w"), "watch": ("water_atm",),
    }.get(group or "", ("capacity_l", "power_w", "battery_mah"))

    bits = []
    for feat in order:
        if feat in p.features:
            label, unit = _SPEC_LABELS.get(feat, (feat, ""))
            val = p.features[feat]
            shown = int(val) if float(val).is_integer() else round(val, 1)
            bits.append(f"{label} {shown}{unit}")
        if len(bits) == 2:
            break
    return ", ".join(bits)


def build_prompt(u: Understanding, res: SearchResult) -> str:
    lines = [f'Khách hỏi: "{u.text}"']
    if u.slang_labels:
        lines.append(f"Yêu cầu đã hiểu: {', '.join(u.slang_labels)}")
    lines.append("\nSản phẩm đã chọn sẵn cho khách:")
    for i, p in enumerate(res.products, 1):
        parts = [f"{i}. {p.name}", format_vnd(p.price)]
        if p.discount_pct and p.discount_pct >= 0.05:
            parts.append(f"giảm {p.discount_pct * 100:.0f}%")
        spec = _spec_line(p, u.group)
        if spec:
            parts.append(spec)
        if p.rating:
            parts.append(f"{p.rating:g} sao")
        lines.append(" — ".join(parts[:1]) + " — " + ", ".join(parts[1:]))
    if res.relaxed:
        lines.append(f"\nLưu ý: không có sản phẩm khớp hết yêu cầu, đã {', '.join(res.relaxed)}.")
    lines.append("\nViết 2 câu ngắn gọn: nên chọn cái nào, khi nào. "
                 "Không liệt kê lại giá của cả ba.")
    return "\n".join(lines)


def trim_to_sentence(text: str) -> str:
    """Drop a trailing half-sentence left behind by the deadline.

    Hitting the time limit mid-clause reads as a bug; ending one sentence early
    reads as brevity. Only trims when there is a complete sentence to fall back
    to and the dangling remainder is long enough to look deliberate.
    """
    t = (text or "").strip()
    if not t or t[-1] in ".!?…":
        return t
    cut = max(t.rfind("."), t.rfind("!"), t.rfind("?"))
    # Keep the trim only if a usable sentence remains — better a short complete
    # answer than a dangling clause, but not better than nothing at all.
    if cut >= 15:
        return t[:cut + 1]
    return t


def render_fallback(u: Understanding, res: SearchResult) -> str:
    """Templated reply, used on timeout or when the number guard trips.

    Built from the same rows, so it is always factually correct — just less
    fluent than the model would have been.
    """
    if not res.products:
        return ("Mình chưa tìm được sản phẩm nào khớp yêu cầu này. "
                "Bạn thử nới ngân sách hoặc mô tả khác giúp mình nhé?")
    label = GROUP_LABELS.get(u.group or "", "sản phẩm")
    top = res.products[0]
    out = [f"Mình gợi ý cho bạn {len(res.products)} {label} phù hợp nhất."]
    out.append(f"Đáng chú ý nhất là {top.name}, giá {format_vnd(top.price)}"
               + (f", đang giảm {top.discount_pct * 100:.0f}%." if top.discount_pct
                  and top.discount_pct >= 0.05 else "."))
    if res.relaxed:
        out.append(f"Lưu ý: mình đã {', '.join(res.relaxed)} để có kết quả.")
    return " ".join(out)


# --------------------------------------------------------------------------
# Engine
# --------------------------------------------------------------------------

class ChatEngine:
    def __init__(self, catalog: Catalog, llm: LLM):
        self.cat = catalog
        self.llm = llm
        self.understander = Understander(catalog.con)
        self.sessions: dict[str, Session] = {}

    def session(self, sid: str) -> Session:
        s = self.sessions.get(sid)
        if s is None:
            s = Session(id=sid)
            self.sessions[sid] = s
        return s

    def reset(self, sid: str) -> None:
        self.sessions.pop(sid, None)

    def _archive(self, live: Session) -> Session:
        """Park the conversation so far elsewhere and clear the live session.

        The subject the shopper has just raised keeps the session id the client
        is already using, and it is the *previous* subject that moves. Doing it
        the other way round — handing the new subject a new id and hoping the
        client follows — stranded any client that did not: it went on answering
        the new subject's questions into the old subject's session, so asking
        about điều hòa and then naming a budget came back with refrigerators.
        A client that ignores the change now simply stays on the new subject.
        """
        parked = Session(
            id=uuid.uuid4().hex,
            understanding=live.understanding,
            asked=set(live.asked),
            pending_slot=live.pending_slot,
            last_products=list(live.last_products),
            turns=live.turns,
        )
        self.sessions[parked.id] = parked

        live.understanding = None
        live.asked = set()
        live.pending_slot = None
        live.last_products = []
        live.turns = 0
        live.archived_id = parked.id
        return parked

    def prepare(self, sid: str, text: str) -> tuple[Session, Understanding, Reply | None]:
        """Everything up to (but not including) generation.

        Returns an immediate Reply for the paths that need no model — small talk
        and questions — so the server can answer those in milliseconds.
        """
        s = self.session(sid)
        s.archived_id = None
        prior = s.understanding

        # While a question is open, a reply the current category can explain is
        # an answer to it, even when it happens to contain a category cue.
        keep = None
        if s.pending_slot and prior and prior.group:
            named, _ = detect_group(text)
            if named and named != prior.group and match_rules(text, prior.group):
                keep = prior.group

        u = self.understander.understand(
            text, prior_group=prior.group if prior else None,
            has_context=prior is not None, keep_group=keep)

        if u.intent in SMALLTALK and u.intent != Intent.UNCLEAR:
            # Answered before anything is allowed to touch the session. A
            # pleasantry is not an answer to the open question, and its stray
            # category cue is not a change of subject: folded, "xin chào" lands
            # on chảo and "bạn là ai" contains "ban la", a clothes iron. Left
            # any later, saying hello mid-conversation reset the questions
            # already asked and consumed the one still waiting.
            s.turns += 1
            s.understanding = prior          # small talk must not clear context
            return s, u, Reply(
                kind="smalltalk", text=random.choice(SMALLTALK[u.intent]),
                chips=STARTER_CHIPS if u.intent in
                (Intent.GREETING, Intent.OFF_TOPIC) else [])

        # A different product is a different conversation, so the one in
        # progress is parked rather than overwritten: it keeps its budget, its
        # history and its open question, and can be returned to. This turn
        # starts clean instead of half-inheriting the last, which is how
        # "laptop, dưới 15 triệu, tủ lạnh" came to answer the fridge with no
        # questions at all. The server passes both ids to the browser, which
        # opens a chat for the new subject and repoints the old chat at where
        # its conversation was parked.
        if prior and prior.group and u.group and u.group != prior.group:
            self._archive(s)
            prior = None

        s.turns += 1

        # A pending question is being answered: fold the answer in before
        # anything else, so "dưới 10 triệu" lands as a budget rather than a
        # fresh search.
        if s.pending_slot:
            q_prev = Understander.to_query(merge(prior, u))
            n_before = len(q_prev.feature_filters)
            apply_answer(s.pending_slot, text, q_prev, self.cat)
            if u.price.is_empty():
                u.price = q_prev.price
            if q_prev.brands and not u.brands:
                u.brands = q_prev.brands
            # apply_answer appends filters of its own for the sizing answers —
            # "3–4 người", "phòng 20m²" — which are numbers in a domain unit and
            # so invisible to the lexicon. Without this they were computed and
            # thrown away, and the question might as well not have been asked.
            u.feature_filters += q_prev.feature_filters[n_before:]
            s.asked.add(s.pending_slot)
            s.pending_slot = None

        # The same sizing, but volunteered rather than asked for: "tủ lạnh cho
        # gia đình 4 người" already answers the question about household size.
        known = {(f, op) for f, op, _ in u.feature_filters}
        for c in stated_sizing(u.group, text):
            if (c[0], c[1]) not in known:
                u.feature_filters.append(c)
                s.asked.add("usage")

        merged = merge(prior, u)
        s.understanding = merged

        if not merged.has_signal() and u.intent == Intent.UNCLEAR:
            return s, merged, Reply(kind="smalltalk",
                                    text=random.choice(SMALLTALK[Intent.UNCLEAR]),
                                    chips=STARTER_CHIPS)

        q = Understander.to_query(merged)
        d: Decision = decide(self.cat, q, asked=s.asked,
                             accept_any=(u.intent == Intent.ACCEPT_ANY),
                             inferred_groups=merged.inferred_groups)
        if d.action == "ask" and d.question:
            s.pending_slot = d.question.slot
            return s, merged, Reply(
                kind="question", text=d.question.text, chips=d.question.chips,
                debug={"candidates": d.candidate_count, "why": d.reason,
                       "gain": round(d.question.gain, 2)})

        return s, merged, None      # caller proceeds to retrieval + generation

    def retrieve(self, u: Understanding) -> SearchResult:
        q = Understander.to_query(u)
        return self.cat.search(q, limit=3, labels=u.slang_labels)

    def notes(self, u: Understanding, res: SearchResult) -> list[str]:
        out = []
        if u.slang_labels:
            out.append("Đã hiểu: " + ", ".join(u.slang_labels))
        if res.relaxed:
            out.append("Đã nới điều kiện: " + ", ".join(res.relaxed))
        if u.dropped:
            out.append("Không đủ dữ liệu để lọc: " + ", ".join(u.dropped))
        return out
