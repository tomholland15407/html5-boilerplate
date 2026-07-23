"""Vietnamese text normalisation.

Everything upstream of the models runs through here. Two jobs:

  1. Fold text so that "màn hình đẹp", "man hinh dep" and "MÀN HÌNH ĐẸP" are the
     same string. Vietnamese users type without diacritics far more often than
     with them, and a lexicon that only matches accented input is a lexicon that
     misses most of its traffic.

  2. Read Vietnamese money the way people actually write it: "20 củ", "5tr5",
     "dưới 3 triệu rưỡi", "1,5 tỷ", "500k".
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

# --------------------------------------------------------------------------
# Folding
# --------------------------------------------------------------------------

# đ/Đ carry no combining mark, so NFD leaves them intact — they need an explicit
# mapping or "điện thoại" folds to "'ien thoai" and never matches "dien thoai".
_D_STROKE = str.maketrans({"đ": "d", "Đ": "D"})


def fold(s: str | None) -> str:
    """Lowercase, strip diacritics, collapse whitespace.

    'Máy Lạnh Inverter' -> 'may lanh inverter'
    """
    if not s:
        return ""
    s = str(s).translate(_D_STROKE).lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = unicodedata.normalize("NFC", s)
    return re.sub(r"\s+", " ", s).strip()


# --------------------------------------------------------------------------
# Teencode / SMS shorthand
# --------------------------------------------------------------------------

# Applied on folded text, whole words only. Keep this conservative: expanding an
# ambiguous token wrongly is worse than leaving it alone.
_TEENCODE = {
    "ko": "khong", "k": "khong", "kh": "khong", "hok": "khong", "hong": "khong",
    "kg": "khong", "khg": "khong", "hem": "khong",
    "dc": "duoc", "đc": "duoc", "dk": "duoc", "vs": "voi", "vt": "viet",
    "j": "gi", "z": "vay", "v": "vay", "ntn": "nhu the nao", "nt": "nhan tin",
    "mn": "moi nguoi", "ae": "anh em", "mng": "moi nguoi",
    "bn": "bao nhieu", "bnhieu": "bao nhieu", "bao nhiu": "bao nhieu",
    "sp": "san pham", "gia ca": "gia",
    "dt": "dien thoai", "dthoai": "dien thoai", "đt": "dien thoai",
    "lt": "laptop", "tl": "tu lanh", "ml": "may lanh", "mg": "may giat",
    "tv": "tivi", "ti vi": "tivi",
    "cty": "cong ty", "km": "khuyen mai", "gr": "giam gia",
    "r": "roi", "rui": "roi", "ah": "a", "ak": "a",
    "cx": "cung", "cug": "cung", "nhiu": "nhieu", "iu": "yeu",
    "wa": "qua", "qa": "qua", "rẻ": "re",
    "mún": "muon", "mun": "muon", "muón": "muon",
    "tks": "cam on", "thanks": "cam on", "thank": "cam on", "tk": "cam on",
    "oke": "ok", "okie": "ok", "okla": "ok", "oki": "ok",
}

_WORD_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)


def expand_teencode(folded: str) -> str:
    """Expand SMS shorthand in already-folded text."""
    def sub(m: re.Match[str]) -> str:
        return _TEENCODE.get(m.group(0), m.group(0))

    return _WORD_RE.sub(sub, folded)


def normalize(s: str | None) -> str:
    """Fold + expand teencode. The canonical form used for all matching."""
    return expand_teencode(fold(s))


# Characters that only occur in Vietnamese once tone/quality marks are present.
_MARKED = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợ"
              "ùúủũụưừứửữựỳýỷỹỵđ")


def has_diacritics(s: str | None) -> bool:
    """True when the writer actually typed Vietnamese marks.

    Folding is what lets "man hinh dep" match "màn hình đẹp", but it also
    collapses genuinely different words: chào (hello) onto chảo (frying pan),
    nhé (a sentence particle) onto nhẹ (lightweight), xin (please) onto xịn
    (premium). When the marks are present they resolve the ambiguity exactly, so
    this decides whether a homograph may be matched loosely or must match the
    precise written form.
    """
    return any(c in _MARKED for c in (s or "").lower())


# Folded forms that mean different things depending on their marks, mapped to
# the spellings that carry the *shopping* sense. A homograph listed here is only
# accepted from diacriticised input when one of these exact forms appears.
AMBIGUOUS_FORMS: dict[str, tuple[str, ...]] = {
    "chao": ("chảo",),          # pan, not "chào" (hello)
    "noi": ("nồi",),            # pot, not "nói" (speak) or "nơi" (place)
    "nhe": ("nhẹ",),            # light, not "nhé" (particle)
    "xin": ("xịn",),            # premium, not "xin" (please)
    "ben": ("bền",),            # durable, not "bên" (side)
    "re": ("rẻ",),              # cheap, not "rê"/"rẽ"
    "to": ("to",),              # big
    "den": ("đèn",),            # lamp, not "đen" (black) or "đến" (arrive)
    "dao": ("dao",),            # knife, not "dạo"/"đảo"
    "ui": ("ủi",),              # to iron, not the interjection "ui"
    "cam": ("cam",),            # orange, not "cảm" (feel)
    "may": ("máy",),            # machine, not "mày"/"may"
    "hang": ("hãng",),          # brand, not "hàng"/"hạng"
    "sac": ("sạc",),            # charge, not "sắc"
    "loai": ("loại",),
    "tam": ("tầm",),            # around/approx, not "tạm" (temporary)
}


def homograph_ok(cue: str, raw_text: str) -> bool:
    """Whether a folded cue may be trusted against this particular input.

    Unambiguous cues always pass. Ambiguous ones pass only if the writer used no
    marks at all (nothing to disambiguate with, so accept on best effort) or
    actually wrote the shopping sense.
    """
    forms = AMBIGUOUS_FORMS.get(cue)
    if forms is None:
        return True
    if not has_diacritics(raw_text):
        return True
    low = raw_text.lower()
    return any(f in low for f in forms)


# --------------------------------------------------------------------------
# Numbers
# --------------------------------------------------------------------------

# Vietnamese convention is the inverse of English: '.' groups thousands and ','
# is the decimal point. "1.500.000" is one and a half million; "5,5" is 5.5.
# Both conventions show up in real user input, so disambiguate by shape.
def parse_decimal(tok: str) -> float | None:
    """Read a number written in either Vietnamese or English convention."""
    tok = tok.strip().replace(" ", "")
    if not tok:
        return None

    has_dot, has_comma = "." in tok, "," in tok

    if has_dot and has_comma:
        # Whichever separator comes last is the decimal point.
        if tok.rfind(",") > tok.rfind("."):
            tok = tok.replace(".", "").replace(",", ".")
        else:
            tok = tok.replace(",", "")
    elif has_comma:
        # A single comma with 1-2 trailing digits is a decimal ("5,5" -> 5.5).
        # Three trailing digits is a thousands group ("1,500" -> 1500).
        tail = tok.rsplit(",", 1)[1]
        tok = tok.replace(",", "." if len(tail) <= 2 else "")
    elif has_dot:
        # Groups of exactly 3 digits mean thousands separators ("1.500.000").
        parts = tok.split(".")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3):
            tok = tok.replace(".", "")

    try:
        return float(tok)
    except ValueError:
        return None


# Written-out numerals, enough to cover spoken-style budgets.
_WORD_NUM = {
    "mot": 1, "hai": 2, "ba": 3, "bon": 4, "tu": 4, "nam": 5, "lam": 5,
    "sau": 6, "bay": 7, "tam": 8, "chin": 9, "muoi": 10, "chuc": 10,
    "mot tram": 100, "hai tram": 200, "nua": 0.5,
}


# --------------------------------------------------------------------------
# Money
# --------------------------------------------------------------------------

# Slang multipliers. "củ", "chai" and "lít" all mean one million VND; "tỏi" is a
# billion. These are the terms the brief called out and they are extremely
# common in the wild — no model needs to be involved in reading them.
MONEY_UNITS: dict[str, int] = {
    "k": 1_000, "nghin": 1_000, "ngan": 1_000, "ng": 1_000,
    "tr": 1_000_000, "trieu": 1_000_000, "cu": 1_000_000,
    "chai": 1_000_000, "lit": 1_000_000, "m": 1_000_000,
    "ty": 1_000_000_000, "ti": 1_000_000_000, "toi": 1_000_000_000,
    "xi": 100_000,
}

_UNIT_ALT = "|".join(sorted(MONEY_UNITS, key=len, reverse=True))
_NUM = r"\d+(?:[.,]\d+)*"
_RANGE_SEP = r"(?:\s*(?:-|–|—|~)\s*|\s+(?:den|toi|a|->)\s+)"

# "tu 8 den 12 trieu" / "10-15 cu" — the first number carries no unit of its own
# and inherits it from the second. Extremely common and easy to get wrong: match
# this before anything else or the leading number is silently dropped.
_RANGE_RE = re.compile(rf"\b({_NUM}){_RANGE_SEP}({_NUM})\s*({_UNIT_ALT})\b")
# "5tr5" / "5 trieu 5" — trailing digit is tenths of the unit, so 5tr5 = 5.5tr.
_COMPOUND_RE = re.compile(rf"\b({_NUM})\s*({_UNIT_ALT})\s*(\d)\b(?!\s*\d)")
# "5tr" / "500k" / "20 cu" / "1,5 ty"
_SIMPLE_RE = re.compile(rf"\b({_NUM})\s*({_UNIT_ALT})\b")
# "1 trieu ruoi" -> 1.5 million
_HALF_RE = re.compile(rf"\b({_NUM})\s*({_UNIT_ALT})\s*(?:ruoi|ru?o?i)\b")
# A bare "1.500.000" with no unit word. Only trusted above a floor so that
# "iphone 15" and "55 inch" are never mistaken for prices.
_BARE_RE = re.compile(rf"(?<![\w.,])({_NUM})(?!\s*(?:{_UNIT_ALT})\b)(?![\w.,])")

# Floor for *any* amount, however it was written. The cheapest thing in the
# catalog is 10.000₫, so anything below that is not a price — which is what
# rescues "tivi 4k" and "màn 2k", where the k means resolution, not thousands.
_BARE_MIN_VND = 10_000

_MAX_CUES = (
    "duoi", "it hon", "khong qua", "khong den", "khong toi", "chua toi",
    "chua den", "toi da", "max", "re hon", "thap hon", "trong tam",
    "trong khoang", "tam gia", "khong vuot",
)
_MIN_CUES = ("tren", "hon", "tu", "it nhat", "toi thieu", "min", "cao hon", "dat hon")
_AROUND_CUES = ("tam", "khoang", "co", "xap xi", "chung", "do", "quanh", "~")

# Relative tiers — resolved against the category's own price distribution at
# query time, because "rẻ" for a TV and "rẻ" for a phone case are different
# numbers by three orders of magnitude.
PRICE_TIERS = {
    # "tiết kiệm" is deliberately absent: on this catalog it almost always
    # begins "tiết kiệm điện" (energy-saving), which is a spec, not a budget.
    "budget": ("re", "gia re", "gia mem", "binh dan", "gia tot", "gia thap",
               "re nhat", "sinh vien", "hat de", "vua tui tien", "pho thong"),
    "premium": ("cao cap", "xin", "flagship", "dat tien", "hang hieu", "sang",
                "cao nhat", "xin xo", "dinh cao", "premium", "top dau", "xin nhat"),
    "value": ("ngon bo re", "ngon re", "dang tien", "hop ly", "gia hop ly",
              "tot nhat trong tam gia", "worth", "dang dong tien"),
}


@dataclass
class PriceConstraint:
    """A budget expressed as a range, plus the phrase it came from."""

    min: int | None = None
    max: int | None = None
    tier: str | None = None
    prefer_value: bool = False
    raw: str = ""

    def is_empty(self) -> bool:
        return self.min is None and self.max is None and self.tier is None

    def as_dict(self) -> dict:
        return {"min": self.min, "max": self.max, "tier": self.tier,
                "prefer_value": self.prefer_value, "raw": self.raw}


def find_money(text: str) -> list[tuple[int, int, int]]:
    """Find every money amount. Returns (value_vnd, span_start, span_end)."""
    t = normalize(text)
    out: list[tuple[int, int, int]] = []
    claimed: list[tuple[int, int]] = []

    def overlaps(a: int, b: int) -> bool:
        return any(a < e and b > s for s, e in claimed)

    def take(value: float, s: int, e: int) -> None:
        # Claim the span either way: "4k" in "tivi 4k" is not money, but it is
        # also not free for a later, looser pattern to reinterpret.
        claimed.append((s, e))
        if value >= _BARE_MIN_VND:
            out.append((int(round(value)), s, e))

    # Most specific patterns first so "5tr5" is not consumed as plain "5tr" and
    # "10-15 cu" is not consumed as a lone "15 cu".
    for m in _RANGE_RE.finditer(t):
        lo, hi = parse_decimal(m.group(1)), parse_decimal(m.group(2))
        if lo is None or hi is None:
            continue
        mult = MONEY_UNITS[m.group(3)]
        take(lo * mult, m.start(1), m.end(1))
        take(hi * mult, m.start(2), m.end())

    for rx, kind in ((_HALF_RE, "half"), (_COMPOUND_RE, "compound"), (_SIMPLE_RE, "simple")):
        for m in rx.finditer(t):
            if overlaps(m.start(), m.end()):
                continue
            base = parse_decimal(m.group(1))
            if base is None:
                continue
            mult = MONEY_UNITS[m.group(2)]
            if kind == "half":
                base += 0.5
            elif kind == "compound":
                base += int(m.group(3)) / 10.0
            take(base * mult, m.start(), m.end())

    # Bare amounts ("1.500.000") only above a floor, so model numbers and
    # non-money specs ("iphone 15", "55 inch", "5000 mAh") are left alone.
    for m in _BARE_RE.finditer(t):
        if overlaps(m.start(), m.end()):
            continue
        v = parse_decimal(m.group(1))
        if v is not None:
            take(v, m.start(), m.end())

    out.sort(key=lambda x: x[1])
    return out


def _nearest_cue(prefix: str) -> str | None:
    """Classify the budget cue sitting closest to the amount.

    Scanning for *any* cue in a window misreads "tủ lạnh tầm 15 triệu": the
    category folds to "tu lanh" and "tu" ("from") is a min-cue, so the phrase
    reads as a floor instead of a midpoint. Take the cue nearest the number and
    require it to be adjacent, which keeps category words out of the decision.
    """
    best: tuple[int, str] | None = None
    for kind, cues in (("max", _MAX_CUES), ("min", _MIN_CUES), ("around", _AROUND_CUES)):
        for c in cues:
            for m in re.finditer(rf"(?:\b|^){re.escape(c)}\b", prefix):
                gap = len(prefix) - m.end()
                if gap > 3:  # not adjacent to the number — unrelated word
                    continue
                if best is None or m.end() > best[0]:
                    best = (m.end(), kind)
    return best[1] if best else None


def parse_price(text: str) -> PriceConstraint:
    """Read a budget out of free text.

    Handles explicit ranges, one-sided bounds, fuzzy 'around X', and the
    relative tiers ('rẻ', 'cao cấp') that only mean something next to a
    category's price distribution.
    """
    t = normalize(text)
    pc = PriceConstraint(raw=text)

    for tier, cues in PRICE_TIERS.items():
        if any(homograph_ok(c, text) and re.search(rf"\b{re.escape(c)}\b", t)
               for c in cues):
            if tier == "value":
                pc.prefer_value = True
            else:
                pc.tier = tier
            break

    # An explicit range wins outright — no cue interpretation needed.
    rng = _RANGE_RE.search(t)
    if rng:
        lo, hi = parse_decimal(rng.group(1)), parse_decimal(rng.group(2))
        if lo is not None and hi is not None:
            mult = MONEY_UNITS[rng.group(3)]
            a, b = sorted((int(lo * mult), int(hi * mult)))
            if b >= _BARE_MIN_VND:
                pc.min, pc.max = a, b
                return pc

    amounts = find_money(t)
    if not amounts:
        return pc

    # Two separate amounts joined by a connector: "tu 5 trieu den 10 trieu".
    if len(amounts) >= 2:
        lo, hi = amounts[0], amounts[1]
        if re.fullmatch(_RANGE_SEP, t[lo[2]:hi[1]]):
            pc.min, pc.max = sorted((lo[0], hi[0]))
            return pc

    value, start, _end = amounts[0]
    cue = _nearest_cue(t[max(0, start - 24):start])

    if cue == "max":
        pc.max = value
    elif cue == "min":
        pc.min = value
    elif cue == "around":
        # "tầm 10 củ" is a soft centre, not a hard ceiling — widen both ways.
        pc.min, pc.max = int(value * 0.75), int(value * 1.25)
    else:
        # A bare amount is nearly always a ceiling in shopping language:
        # "laptop 20 triệu" means at most 20, with a little headroom.
        pc.max = int(value * 1.10)
        pc.min = int(value * 0.45)

    return pc


# --------------------------------------------------------------------------
# Spec value parsing
# --------------------------------------------------------------------------

# Units seen in the spec sheet, mapped to a canonical scale so range filters
# can compare across differently-written values.
_UNIT_SCALE: dict[str, tuple[str, float]] = {
    "mah": ("mah", 1), "wh": ("wh", 1),
    "gb": ("gb", 1), "tb": ("gb", 1024), "mb": ("gb", 1 / 1024),
    "ghz": ("ghz", 1), "mhz": ("ghz", 1 / 1000),
    "inch": ("inch", 1), '"': ("inch", 1), "cm": ("cm", 1), "mm": ("cm", 0.1),
    "kg": ("kg", 1), "g": ("kg", 1 / 1000), "gram": ("kg", 1 / 1000),
    "lit": ("lit", 1), "l": ("lit", 1), "ml": ("lit", 1 / 1000),
    "w": ("w", 1), "kw": ("w", 1000),
    "hz": ("hz", 1), "khz": ("hz", 1000),
    "hp": ("hp", 1), "atm": ("atm", 1), "bar": ("atm", 1),
    "mp": ("mp", 1), "px": ("px", 1),
    "nguoi": ("nguoi", 1), "m2": ("m2", 1), "phut": ("phut", 1), "gio": ("gio", 1),
}

_SPEC_NUM_RE = re.compile(
    r"(\d+(?:[.,]\d+)*)\s*"
    r"(mah|wh|gb|tb|mb|ghz|mhz|inch|\"|cm|mm|kg|gram|g|lit|ml|l|kw|w|khz|hz|"
    r"hp|atm|bar|mp|px|nguoi|m2|phut|gio)?\b",
    re.IGNORECASE,
)


def parse_spec_value(value: str | None) -> tuple[float | None, str | None]:
    """Pull the leading (number, canonical_unit) out of a free-text spec value.

    '5000 mAh'   -> (5000.0, 'mah')
    '1 TB SSD'   -> (1024.0, 'gb')
    '6,7 inch'   -> (6.7, 'inch')
    'Không'      -> (None, None)
    """
    if not value:
        return None, None
    folded = fold(value)
    m = _SPEC_NUM_RE.search(folded)
    if not m:
        return None, None
    num = parse_decimal(m.group(1))
    if num is None:
        return None, None
    raw_unit = (m.group(2) or "").lower()
    if not raw_unit:
        return num, None
    canon, scale = _UNIT_SCALE.get(raw_unit, (raw_unit, 1))
    return num * scale, canon


_UNIT_ALIASES: dict[str, tuple[str, ...]] = {}
for _raw, (_canon, _scale) in _UNIT_SCALE.items():
    _UNIT_ALIASES.setdefault(_canon, ())
    _UNIT_ALIASES[_canon] += (_raw,)


def find_unit_value(value: str | None, canonical_unit: str) -> float | None:
    """Search anywhere in a value for a number carrying a specific unit.

    Several spec rows pack a whole dimension set into one string:
        'Dài 314 mm - Rộng 223.75 mm - Dày 17.9 mm - 1.54 kg'
    Reading the leading number gives the length, not the weight. This finds the
    figure attached to the unit actually asked for.
    """
    if not value:
        return None
    folded = fold(value)
    for alias in sorted(_UNIT_ALIASES.get(canonical_unit, ()), key=len, reverse=True):
        pat = re.escape(alias)
        # Require a boundary so 'g' does not match inside 'kg' or 'gb'.
        m = re.search(rf"(\d+(?:[.,]\d+)*)\s*{pat}(?![a-z0-9])", folded)
        if m:
            num = parse_decimal(m.group(1))
            if num is not None:
                return num * _UNIT_SCALE[alias][1]
    return None


def parse_sold_count(value: str | None) -> int | None:
    """'14,5k' -> 14500. The sheet stores these as display strings."""
    if value is None:
        return None
    s = fold(str(value)).replace(" ", "")
    if not s:
        return None
    m = re.match(r"^(\d+(?:[.,]\d+)*)(k|tr|trieu|m)?$", s)
    if not m:
        digits = re.sub(r"[^\d]", "", s)
        return int(digits) if digits else None
    num = parse_decimal(m.group(1))
    if num is None:
        return None
    return int(round(num * MONEY_UNITS.get(m.group(2) or "", 1)))


def format_vnd(amount: int | float | None) -> str:
    """15990000 -> '15.990.000₫' (Vietnamese thousands grouping)."""
    if amount is None:
        return "—"
    return f"{int(round(amount)):,}".replace(",", ".") + "₫"
