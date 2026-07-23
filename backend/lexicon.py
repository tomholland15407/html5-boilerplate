"""Vietnamese shopping slang -> structured catalog constraints.

This is the part that has to understand "pin trâu", and it does so without
involving a model: matching is a dictionary lookup over folded text, so it costs
microseconds, is perfectly reproducible, and can be shown to a human and argued
with. The LLM never sees a slang term it has to guess at.

Two ideas carry most of the weight:

  Relative thresholds. "Pin trâu" is not ">= 5000 mAh", it is "top 40% battery
  for whatever category we are in" — which is 6,000 mAh for a phone and 10,000
  for a power bank, resolved from the catalog's own distribution. One rule, and
  it stays correct as the catalog changes.

  Category scoping. A rule declares which groups it applies to, so "pin trâu"
  cannot fire on a rice cooker and "tiết kiệm điện" cannot fire on a watch.
"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass, field

from vntext import homograph_ok, normalize

# --------------------------------------------------------------------------
# Constraint types
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class FeatPct:
    """Numeric feature in the top/bottom slice of its category distribution."""
    feat: str
    direction: str          # 'high' | 'low'
    pct: float              # percentile cut, e.g. .60 -> value >= p60
    fallback: float | None = None   # absolute cut when the group has no stats


@dataclass(frozen=True)
class FeatAbs:
    feat: str
    op: str                 # '>=' | '<='
    value: float


@dataclass(frozen=True)
class TextMatch:
    """Product name or any spec value must contain one of these folded terms."""
    terms: tuple[str, ...]


@dataclass(frozen=True)
class Boost:
    """Soft ranking preference — never removes candidates, only reorders."""
    field: str              # rating | n_sold | discount | promo | cheap | value
    weight: float = 1.0


@dataclass(frozen=True)
class Rule:
    label: str                              # shown to the user as the reason
    phrases: tuple[str, ...]                # folded trigger phrases
    constraints: tuple[object, ...]
    groups: tuple[str, ...] | None = None   # None -> applies to any category
    implies: tuple[str, ...] = ()           # category hints from the phrase


# --------------------------------------------------------------------------
# Category cues: what the shopper calls the thing -> coarse group.
#
# Regional variation is load-bearing here. "Điều hòa" (northern) and "máy lạnh"
# (southern) are the same appliance; a lexicon with only one of them misses half
# the country.
# --------------------------------------------------------------------------
GROUP_CUES: dict[str, tuple[str, ...]] = {
    "phone": ("dien thoai", "smartphone", "iphone", "galaxy", "may dt", "con dt"),
    "tablet": ("may tinh bang", "tablet", "ipad"),
    "laptop": ("laptop", "may tinh xach tay", "macbook", "notebook", "may tinh"),
    "pc": ("may in", "may tinh de ban", "pc", "case may tinh", "may quet"),
    "tv": ("tivi", "ti vi", "smart tv", "man hinh tivi", "android tivi"),
    "fridge": ("tu lanh", "tulanh"),
    "freezer": ("tu dong", "tu mat", "tu bao quan", "tu ruou", "may lam da"),
    "ac": ("may lanh", "dieu hoa", "may dieu hoa", "dieu hoa khong khi"),
    "washer": ("may giat", "maygiat", "giat quan ao"),
    "dryer": ("may say quan ao", "tu say", "may say do"),
    "fan": ("quat", "quat dien", "quat dung", "quat treo", "quat hoi nuoc"),
    "aircare": ("may loc khong khi", "loc khong khi", "may tao am", "hut am"),
    "smartwatch": ("dong ho thong minh", "smartwatch", "dong ho smart", "apple watch"),
    "watch": ("dong ho", "dong ho deo tay", "dong ho nam", "dong ho nu"),
    "audio": ("loa", "tai nghe", "headphone", "earbuds", "airpods", "micro",
              "loa bluetooth", "loa keo", "am thanh"),
    "camera": ("camera", "may anh", "camera an ninh", "webcam", "flycam", "ong kinh"),
    "cooking": ("noi com", "noi com dien", "bep", "bep tu", "bep ga", "bep hong ngoai",
                "lo vi song", "lo nuong", "noi chien", "noi ap suat", "noi lau",
                "may lam banh", "noi nau"),
    "foodprep": ("may xay", "may xay sinh to", "may ep", "may ep trai cay",
                 "may xay thit", "may vat cam"),
    "dishwasher": ("may rua chen", "may rua bat"),
    "hood": ("may hut mui", "hut mui"),
    "vacuum": ("may hut bui", "robot hut bui", "hut bui", "may lau nha"),
    "waterheater": ("may nuoc nong", "binh nong lanh", "nuoc nong"),
    "water": ("may loc nuoc", "loc nuoc", "cay nuoc", "nuoc nong lanh", "bon nuoc"),
    "powerbank": ("sac du phong", "pin du phong", "pin sac du phong"),
    "charger": ("cu sac", "cap sac", "day sac", "sac nhanh", "adapter", "hub"),
    "case": ("op lung", "mieng dan", "cuong luc", "bao da", "dan man hinh"),
    "network": ("router", "wifi", "modem", "bo phat wifi", "thiet bi mang"),
    "peripheral": ("chuot", "ban phim", "keyboard", "mouse", "chuot khong day"),
    "iron": ("ban ui", "ban la", "may ui"),
    "kettle": ("binh dun", "am dun", "sieu toc", "binh thuy"),
    "beauty": ("may say toc", "may cao rau", "may massage", "ban chai dien",
               "may lam dep", "may triet long"),
    "massage": ("ghe massage", "ghe mat xa"),
    "gaming": ("may choi game", "playstation", "nintendo", "xbox", "may game"),
    "kitchenware": ("noi", "chao", "dao", "hop dung thuc pham", "binh giu nhiet"),
    "bag": ("balo", "tui chong soc", "vali", "tui deo"),
    "storage": ("the nho", "usb", "o cung", "ssd", "the sd"),
    "light": ("den", "bong den", "den led", "den ban", "den nang luong"),
    "ereader": ("may doc sach", "kindle"),
    "smarthome": ("nha thong minh", "o khoa", "khoa cua", "chuong cua"),
}


# --------------------------------------------------------------------------
# Slang rules
# --------------------------------------------------------------------------

_BATTERY_GROUPS = ("phone", "tablet", "powerbank", "smartwatch", "vacuum",
                   "audio", "camera", "ereader", "fan")
_COMPUTE_GROUPS = ("phone", "tablet", "laptop", "pc", "gaming")
_SCREEN_GROUPS = ("phone", "tablet", "laptop", "tv", "pc")
_APPLIANCE = ("fridge", "ac", "washer", "dryer", "tv", "fan", "waterheater",
              "cooking", "vacuum", "dishwasher", "freezer", "aircare", "hood")

SLANG_RULES: list[Rule] = [
    # ---------------- battery ----------------
    Rule("pin trâu", ("pin trau", "pin khoe", "pin lau", "pin tot", "pin khoe",
                      "pin ben", "trau pin", "dung lau het pin", "pin dung lau",
                      "lau het pin", "pin xin", "pin to"),
         (FeatPct("battery_mah", "high", .60, fallback=5000),), _BATTERY_GROUPS),
    Rule("dùng được lâu", ("dung duoc lau", "xai lau", "thoi luong pin cao",
                           "pin dung ca ngay", "ca ngay khong sac"),
         (FeatPct("battery_hours", "high", .60),),
         ("audio", "smartwatch", "laptop", "vacuum")),

    # ---------------- performance ----------------
    Rule("cấu hình mạnh", ("chip khoe", "cau hinh manh", "cau hinh cao", "manh me",
                           "chay muot", "muot ma", "khong lag", "khong giat",
                           "hieu nang cao", "may khoe", "chip manh", "muot"),
         (FeatPct("cpu_ghz", "high", .50), FeatPct("ram_gb", "high", .50),
          Boost("rating", .5)), _COMPUTE_GROUPS),
    # Discrete-GPU markers only. A bare "radeon" also matches the integrated
    # graphics in every AMD ultrabook, which let a Swift Go rank first for
    # "chiến game"; "radeon rx" and "arc a" are the dedicated parts.
    Rule("chiến game", ("chien game", "choi game", "gaming", "game nang",
                        "chien moi game", "cau hinh game", "chien tot"),
         (FeatPct("ram_gb", "high", .60), FeatPct("cpu_ghz", "high", .60),
          TextMatch(("rtx", "gtx", "geforce", "radeon rx", "arc a", "gaming"))),
         ("laptop", "pc", "phone")),
    Rule("nhiều RAM", ("nhieu ram", "ram cao", "ram lon", "ram khoe"),
         (FeatPct("ram_gb", "high", .60),), _COMPUTE_GROUPS),
    Rule("bộ nhớ lớn", ("bo nho lon", "nhieu bo nho", "dung luong lon",
                        "nhieu dung luong", "chua duoc nhieu"),
         (FeatPct("storage_gb", "high", .60),), _COMPUTE_GROUPS + ("storage",)),

    # ---------------- screen ----------------
    Rule("màn hình đẹp", ("man hinh dep", "man dep", "man hinh xin", "man xin",
                          "hien thi dep", "mau sac dep"),
         (TextMatch(("amoled", "oled", "retina", "qled", "super amoled",
                     "nano cell", "mini led", "4k", "2k")), Boost("rating", .5)),
         _SCREEN_GROUPS),
    Rule("màn hình lớn", ("man hinh to", "man to", "man lon", "man hinh lon",
                          "man hinh rong", "xem cho da"),
         (FeatPct("screen_inch", "high", .60),), _SCREEN_GROUPS),
    Rule("màn hình mượt", ("man hinh muot", "tan so quet cao", "120hz", "90hz",
                           "quet cao", "man muot"),
         (FeatPct("refresh_hz", "high", .60),), _SCREEN_GROUPS),

    # ---------------- camera ----------------
    Rule("camera đẹp", ("cam xin", "camera xin", "chup anh dep", "camera dep",
                        "chup hinh dep", "song ao", "chup choet", "cam ngon",
                        "quay phim dep", "chup dep"),
         (FeatPct("camera_mp", "high", .60), Boost("rating", .5)),
         ("phone", "tablet", "camera")),
    Rule("selfie đẹp", ("tu suong", "selfie", "cam truoc dep", "camera truoc xin"),
         (FeatPct("front_camera_mp", "high", .60),), ("phone", "tablet")),

    # ---------------- form factor ----------------
    Rule("nhẹ, dễ mang", ("nhe", "mong nhe", "gon nhe", "de mang", "de xach",
                          "sieu nhe", "mong", "nho gon", "cam theo nguoi"),
         (FeatPct("weight_kg", "low", .25),),
         ("laptop", "tablet", "phone", "audio", "powerbank", "fan", "vacuum")),
    Rule("nhỏ gọn", ("nho gon", "mini", "tiet kiem dien tich", "it chiem cho",
                     "cho phong nho", "nha nho", "phong tro"),
         (FeatPct("capacity_l", "low", .40),),
         ("fridge", "cooking", "kettle", "freezer", "washer")),
    Rule("dung tích lớn", ("dung tich lon", "to", "rong rai", "chua nhieu",
                           "gia dinh dong", "nha dong nguoi", "dung tich cao",
                           "loai to", "co lon"),
         (FeatPct("capacity_l", "high", .60),),
         ("fridge", "cooking", "kettle", "freezer", "water", "foodprep")),
    Rule("giặt được nhiều", ("giat duoc nhieu", "khoi luong giat lon",
                             "giat nhieu do", "may giat to"),
         (FeatPct("wash_kg", "high", .60),), ("washer", "dryer")),

    # ---------------- appliances ----------------
    Rule("tiết kiệm điện", ("tiet kiem dien", "it ton dien", "it hao dien",
                            "khong ton dien", "tiet kiem nang luong", "inverter",
                            "it dien", "ton it dien", "tiet kiem"),
         (TextMatch(("inverter", "tiet kiem dien", "tiet kiem nang luong",
                     "digital inverter", "dc inverter")),), _APPLIANCE),
    Rule("chạy êm", ("chay em", "khong on", "em ai", "it on", "khong tieng on",
                     "yen tinh", "em", "khong bi on"),
         (TextMatch(("em ai", "sieu em", "chong on", "giam on", "low noise",
                     "van hanh em", "yen tinh")),), _APPLIANCE),
    Rule("làm lạnh nhanh", ("lam lanh nhanh", "lanh nhanh", "lanh sau", "mat nhanh"),
         (TextMatch(("lam lanh nhanh", "turbo", "fast cooling", "powerful")),),
         ("ac", "fridge", "freezer")),
    # Two representations for one idea: watches quote ATM as a number, earbuds
    # and phones bury an IP rating in free text ("Chống nước IPX5"). Same
    # phrases, different mechanics, so the rule is split by category.
    Rule("kháng nước", ("chong nuoc", "khang nuoc", "chiu nuoc", "di mua",
                        "khong so nuoc", "chong tham"),
         (FeatPct("water_atm", "high", .40),), ("watch", "smartwatch")),
    Rule("kháng nước", ("chong nuoc", "khang nuoc", "chiu nuoc", "di mua",
                        "khong so nuoc", "chong tham", "di mua khong sao"),
         (TextMatch(("ipx", "ip5", "ip6", "ip7", "chong nuoc", "khang nuoc")),),
         ("audio", "phone", "tablet", "smarthome", "camera")),
    Rule("phòng rộng", ("phong rong", "phong lon", "phong to", "phong khach"),
         (FeatPct("cooling_hp", "high", .60),), ("ac",)),

    # ---------------- charging ----------------
    Rule("sạc nhanh", ("sac nhanh", "sac sieu nhanh", "sac nhanh nhat",
                       "sac day nhanh", "fast charge"),
         (TextMatch(("sac nhanh", "fast charge", "quick charge", "supervooc",
                     "warp charge", "turbo charge", "pd", "power delivery")),),
         ("phone", "tablet", "powerbank", "charger", "laptop")),

    # ---------------- commercial ----------------
    Rule("đang giảm giá", ("dang giam gia", "giam gia", "sale", "khuyen mai",
                           "dang sale", "co khuyen mai", "uu dai", "giam manh",
                           "hot deal", "deal ngon"),
         (Boost("discount", 2.0), Boost("promo", 1.0)), None),
    Rule("bán chạy", ("ban chay", "nhieu nguoi mua", "hot", "pho bien", "dat hang",
                      "duoc ua chuong", "top ban chay", "nhieu nguoi dung"),
         (Boost("n_sold", 2.0),), None),
    Rule("đánh giá cao", ("danh gia cao", "review tot", "duoc khen", "chat luong tot",
                          "uy tin", "danh gia tot", "nhieu sao"),
         (Boost("rating", 2.0),), None),
    Rule("bền", ("ben", "ben bi", "dung lau dai", "chac chan", "trau", "xai ben"),
         (Boost("rating", 1.0), TextMatch(("bao hanh", "chinh hang"))), None),
    Rule("chính hãng", ("chinh hang", "hang chinh hang", "co bao hanh", "auth"),
         (TextMatch(("chinh hang",)),), None),
]

# Longest phrases first so "pin trâu" is claimed before a bare "pin",
# and "màn hình đẹp" before "màn hình".
_PHRASE_INDEX: list[tuple[str, Rule]] = sorted(
    ((p, r) for r in SLANG_RULES for p in r.phrases),
    key=lambda pr: len(pr[0]), reverse=True,
)
_GROUP_INDEX: list[tuple[str, str]] = sorted(
    ((cue, g) for g, cues in GROUP_CUES.items() for cue in cues),
    key=lambda cg: len(cg[0]), reverse=True,
)


def detect_group(text: str) -> tuple[str | None, list[str]]:
    """Guess the category group from what the shopper called the product.

    Returns (best_group, all_matched_groups). Longer cues win, so "đồng hồ
    thông minh" resolves to smartwatch rather than watch.
    """
    t = normalize(text)
    hits: list[str] = []
    consumed: list[tuple[int, int]] = []
    for cue, group in _GROUP_INDEX:
        if not homograph_ok(cue, text):
            continue          # "xin chào" is not a request for a frying pan
        for m in re.finditer(rf"(?<![a-z0-9]){re.escape(cue)}(?![a-z0-9])", t):
            if any(m.start() < e and m.end() > s for s, e in consumed):
                continue
            consumed.append((m.start(), m.end()))
            if group not in hits:
                hits.append(group)
    return (hits[0] if hits else None), hits


def infer_groups(rules: list[Rule]) -> list[str]:
    """Narrow the category from what the slang itself implies.

    A shopper who says "màn hình đẹp pin trâu" never names a category, but the
    two phrases only overlap on phones and tablets — screens rule out power
    banks, batteries rule out monitors. Intersecting the scopes of the matched
    rules turns "what are you looking for?" over 119 categories into a two-way
    question, without asking a model anything.
    """
    scoped = [set(r.groups) for r in rules if r.groups]
    if not scoped:
        return []
    common = set.intersection(*scoped)
    return sorted(common) if common else []


def match_rules(text: str, group: str | None) -> list[Rule]:
    """Every slang rule triggered by the text and valid for the category."""
    t = normalize(text)
    out: list[Rule] = []
    consumed: list[tuple[int, int]] = []
    for phrase, rule in _PHRASE_INDEX:
        if rule in out:
            continue
        if rule.groups is not None and group is not None and group not in rule.groups:
            continue
        if not homograph_ok(phrase, text):
            continue          # "cảm ơn nhé" is not a request for something light
        m = re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", t)
        if not m:
            continue
        # A longer rule already claimed this span ("pin trâu" beats "pin tốt").
        if any(m.start() < e and m.end() > s for s, e in consumed):
            continue
        consumed.append((m.start(), m.end()))
        out.append(rule)
    return out


# --------------------------------------------------------------------------
# Resolution against the catalog's own distributions
# --------------------------------------------------------------------------

_PCT_COLUMN = {.10: "p10", .25: "p25", .40: "p40", .50: "p50",
               .60: "p60", .75: "p75", .90: "p90"}


@dataclass
class Resolved:
    """Slang turned into things the SQL layer can actually apply."""
    feature_filters: list[tuple[str, str, float]] = field(default_factory=list)
    text_terms: list[tuple[str, ...]] = field(default_factory=list)
    boosts: dict[str, float] = field(default_factory=dict)
    labels: list[str] = field(default_factory=list)
    dropped: list[str] = field(default_factory=list)

    def is_empty(self) -> bool:
        return not (self.feature_filters or self.text_terms or self.boosts)


def resolve(rules: list[Rule], group: str | None, con: sqlite3.Connection) -> Resolved:
    """Turn matched rules into concrete filters for a specific category.

    A percentile rule needs a distribution to sit on. When the group has too few
    values for one (or no category was resolved yet) the rule falls back to its
    absolute threshold, and if it has none it is dropped and recorded — a
    constraint that cannot be evaluated must never silently become a no-op that
    filters everything out.
    """
    res = Resolved()
    for rule in rules:
        applied = False
        for c in rule.constraints:
            if isinstance(c, FeatPct):
                cut = None
                if group:
                    row = con.execute(
                        f"SELECT {_PCT_COLUMN[c.pct]} FROM feature_stats "
                        "WHERE cat_group=? AND feat=?", (group, c.feat)).fetchone()
                    if row and row[0] is not None:
                        cut = float(row[0])
                if cut is None:
                    cut = c.fallback
                if cut is None:
                    res.dropped.append(f"{rule.label} ({c.feat}: no data)")
                    continue
                res.feature_filters.append(
                    (c.feat, ">=" if c.direction == "high" else "<=", cut))
                applied = True
            elif isinstance(c, FeatAbs):
                res.feature_filters.append((c.feat, c.op, c.value))
                applied = True
            elif isinstance(c, TextMatch):
                res.text_terms.append(c.terms)
                applied = True
            elif isinstance(c, Boost):
                res.boosts[c.field] = res.boosts.get(c.field, 0.0) + c.weight
                applied = True
        if applied:
            res.labels.append(rule.label)
    return res
