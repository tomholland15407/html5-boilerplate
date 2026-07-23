"""Intent routing and query understanding.

No model runs on this path. Routing is pattern matching over folded text and
understanding is the lexicon plus the money parser, which together take about a
millisecond. That is what makes "xin chào" come back instantly instead of after
a four-second round trip through a 7B — and it means the slang behaviour is
inspectable and reproducible rather than a sampling outcome.

The model is reserved for the one thing it is actually better at: writing the
final sentence.
"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass, field
from enum import Enum

from catalog import Query
from lexicon import detect_group, infer_groups, match_rules, resolve
from vntext import (PriceConstraint, fold, homograph_ok, normalize,
                    parse_price)


class Intent(str, Enum):
    GREETING = "greeting"
    THANKS = "thanks"
    BYE = "bye"
    ABOUT_BOT = "about_bot"
    OFF_TOPIC = "off_topic"
    ACCEPT_ANY = "accept_any"   # "tuỳ bạn" — stop asking, just recommend
    PRODUCT = "product"
    UNCLEAR = "unclear"


# Whole-phrase patterns, matched against normalised text.
_PATTERNS: list[tuple[Intent, tuple[str, ...]]] = [
    (Intent.GREETING, ("xin chao", "chao ban", "chao shop", "chao em", "chao anh",
                       "hello", "hi", "helo", "alo", "chao", "hey", "good morning")),
    (Intent.THANKS, ("cam on", "thanks", "thank you", "cam on ban", "cam on nhe",
                     "ok cam on", "tuyet voi", "hay qua", "gioi qua")),
    (Intent.BYE, ("tam biet", "bye", "goodbye", "chao tam biet", "hen gap lai",
                  "thoi nhe", "di day")),
    (Intent.ABOUT_BOT, ("ban la ai", "ban ten gi", "ban lam duoc gi", "ban khoe khong",
                        "how are you", "who are you", "ban co phai la nguoi",
                        "ban la robot", "ban la bot", "ai tao ra ban",
                        "ban giup duoc gi", "ban biet gi")),
    (Intent.ACCEPT_ANY, ("tuy ban", "tuy shop", "tuy em", "gi cung duoc",
                         "sao cung duoc", "nao cung duoc", "ban chon giup",
                         "shop chon giup", "chon giup minh", "khong biet nua",
                         "the nao cung duoc", "tuy", "gi cung dc", "cai nao cung duoc")),
]

# Topics that are plainly not shopping. Everything else that lacks a product
# signal falls through to UNCLEAR and gets asked a question rather than refused —
# "cần mua gì đó cho mẹ" is vague, not off-topic.
# Both of these route to ACCEPT_ANY, but they do not mean the same thing.
# "Tuỳ bạn" clicked under "what is your budget?" says the shopper has no budget
# in mind — it answers that question and nothing else. These say stop asking
# altogether and recommend something, whatever is still unknown.
_DECIDE_FOR_ME = ("ban chon giup", "shop chon giup", "chon giup minh",
                  "chon giup em", "chon ho minh", "ban quyet dinh",
                  "ban chon di", "shop chon di", "goi y dai gi cung duoc")

_OFF_TOPIC = (
    "thoi tiet", "bong da", "chinh tri", "bau cu", "chung khoan", "bitcoin",
    "ke chuyen", "chuyen cuoi", "lam tho", "bai tho", "dich giup", "viet code",
    "python", "javascript", "giai toan", "bai tap", "tinh gium", "tin tuc",
    "covid", "suc khoe", "benh", "thuoc", "tinh yeu", "nau an cong thuc",
)

# Words that mean "I am shopping" even with no category named.
_SHOPPING_CUES = (
    "mua", "can", "tim", "muon", "goi y", "tu van", "gia", "bao nhieu", "co khong",
    "ban", "san pham", "hang", "loai nao", "nao tot", "nen mua", "chon", "so sanh",
    "khuyen mai", "giam gia", "con nao", "cai nao", "may nao", "dong nao",
)


@dataclass
class Understanding:
    intent: Intent
    text: str
    group: str | None = None
    groups_seen: list[str] = field(default_factory=list)
    inferred_groups: list[str] = field(default_factory=list)
    price: PriceConstraint = field(default_factory=PriceConstraint)
    brands: list[str] = field(default_factory=list)
    slang_labels: list[str] = field(default_factory=list)
    feature_filters: list[tuple[str, str, float]] = field(default_factory=list)
    text_terms: list[tuple[str, ...]] = field(default_factory=list)
    boosts: dict[str, float] = field(default_factory=dict)
    dropped: list[str] = field(default_factory=list)

    def has_signal(self) -> bool:
        return bool(self.group or self.brands or self.slang_labels
                    or not self.price.is_empty())


# Words that pad a pleasantry without asking for anything: forms of address,
# sentence particles, and the assistant's own vocabulary for the customer. Used
# only to decide whether a greeting is *nothing but* a greeting.
#
# Deliberately free of nouns. A request needs something to name — "đồ nhẹ" is a
# request and "đồ" belongs here about as much as "laptop" does — so anything a
# shopper could be asking *for* is left out, and a remainder made only of these
# cannot be a request no matter how it is spelled.
_FILLER = frozenset((
    "a", "ah", "ak", "oi", "o", "u", "shop", "em", "anh", "chi", "ban",
    "minh", "toi", "ad", "admin", "nhe", "nha", "nhi", "the", "vay", "ne",
    "voi", "day", "di", "duoc", "khong", "co", "la", "cho", "hoi",
))


def _match_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", text)
               for p in phrases)


def wants_us_to_choose(text: str) -> bool:
    """Did the shopper ask us to stop asking and just pick?

    Distinct from answering one question with "no preference", which leaves the
    remaining questions perfectly worth asking.
    """
    return _match_any(normalize(text), _DECIDE_FOR_ME)


def _matched(text: str, phrases: tuple[str, ...]) -> list[str]:
    return [p for p in phrases
            if re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", text)]


def _asks_for_something(text: str, matched: list[str]) -> bool:
    """Is there a request left once the pleasantry itself is taken out?

    Folding is what makes this necessary. "xin chào" contains "chao", which is
    also chảo, a frying pan; "chào bạn" contains "ban", which is also bán, to
    sell. A greeting was therefore supplying its own evidence that it was a
    shopping request, and saying hello came back with three saucepans.

    Longest phrases go first so removing "chao" from "xin chao" cannot strand a
    bare "xin" — itself the folded form of "xịn", premium.
    """
    rest = text
    for p in sorted(matched, key=len, reverse=True):
        rest = re.sub(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", " ", rest)
    return any(tok not in _FILLER for tok in re.split(r"[^a-z0-9]+", rest) if tok)


class Understander:
    """Turns raw text into an Intent plus a catalog Query."""

    def __init__(self, con: sqlite3.Connection):
        self.con = con
        # Brand names straight from the catalog, so "laptop Dell" and
        # "tủ lạnh Casper" resolve without a hand-maintained list. Very short
        # names are skipped: a two-letter brand matches inside ordinary words.
        self.brands: dict[str, str] = {}
        for (brand,) in con.execute(
            "SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL"
        ):
            f = fold(brand)
            if len(f) >= 3:
                self.brands[f] = brand
        self._brand_re = re.compile(
            r"(?<![a-z0-9])(" + "|".join(
                re.escape(b) for b in sorted(self.brands, key=len, reverse=True)
            ) + r")(?![a-z0-9])")

    # -- routing -----------------------------------------------------------

    def route(self, text: str, *, has_context: bool) -> Intent:
        t = normalize(text)
        if not t.strip():
            return Intent.UNCLEAR

        for intent, phrases in _PATTERNS:
            hits = _matched(t, phrases)
            if hits:
                # A greeting carrying a real request ("chào shop, cần laptop")
                # is a product query with a polite opening, not small talk.
                if intent in (Intent.GREETING, Intent.THANKS, Intent.BYE):
                    # The request has to be somewhere other than the pleasantry
                    # itself, or the greeting is only overriding itself. Only a
                    # *strong* signal overrides it: passing has_context here
                    # would let the short-fragment refinement heuristic fire,
                    # and "cảm ơn nhé" mid-chat — three words, plainly a
                    # thank-you — would run a search.
                    if (_asks_for_something(t, hits)
                            and self._product_signal(text, has_context=False)):
                        return Intent.PRODUCT
                return intent

        if _match_any(t, _OFF_TOPIC):
            return Intent.OFF_TOPIC
        if self._product_signal(text, has_context):
            return Intent.PRODUCT
        return Intent.UNCLEAR

    def _product_signal(self, raw: str, has_context: bool) -> bool:
        """Does this look like shopping?

        Takes the *raw* text, not a folded copy: the homograph guard needs the
        diacritics to tell "xin chào" from a request for a chảo, and folding
        before this point throws away the only evidence that distinguishes them.
        """
        folded = normalize(raw)
        if detect_group(raw)[0]:
            return True
        if not parse_price(raw).is_empty():
            return True
        if match_rules(raw, None):
            return True
        if self._brand_re.search(folded):
            return True
        # The loosest signal in the router, so the most in need of the
        # homograph guard the other three already use: without it "bạn" reads
        # as "bán" and every sentence addressed to the customer looks like a
        # request to buy something.
        if any(homograph_ok(c, raw)
               and re.search(rf"(?<![a-z0-9]){re.escape(c)}(?![a-z0-9])", folded)
               for c in _SHOPPING_CUES):
            return True
        # Mid-conversation, a bare fragment ("cái thứ 2", "rẻ hơn nữa") is a
        # refinement of the search already in progress.
        return has_context and len(folded.split()) <= 6

    # -- understanding -----------------------------------------------------

    def understand(self, text: str, *, prior_group: str | None = None,
                   has_context: bool = False,
                   keep_group: str | None = None) -> Understanding:
        intent = self.route(text, has_context=has_context)
        u = Understanding(intent=intent, text=text)

        group, seen = detect_group(text)
        if keep_group:
            # The category is already settled and this turn answers a question
            # about it. A category cue inside the answer describes what the
            # shopper wants, not a different aisle: "camera đẹp" replying to
            # "what matters most in a phone?" is not a request for cameras.
            group = keep_group
        u.group = group or prior_group
        u.groups_seen = seen
        u.price = parse_price(text)

        t = normalize(text)
        u.brands = [self.brands[m.group(1)] for m in self._brand_re.finditer(t)]

        rules = match_rules(text, u.group)

        # No category named, but the slang may pin it down anyway.
        if not u.group:
            inferred = infer_groups(rules)
            u.inferred_groups = inferred
            if len(inferred) == 1:
                u.group = inferred[0]
                # Re-match now that the category is known: rules scoped to it
                # can fire, and percentile thresholds become resolvable.
                rules = match_rules(text, u.group)

        res = resolve(rules, u.group, self.con)
        u.slang_labels = res.labels
        u.feature_filters = res.feature_filters
        u.text_terms = res.text_terms
        u.boosts = res.boosts
        u.dropped = res.dropped
        return u

    # -- query assembly ----------------------------------------------------

    @staticmethod
    def to_query(u: Understanding, *, keywords: str | None = None) -> Query:
        return Query(
            group=u.group,
            price=u.price,
            feature_filters=list(u.feature_filters),
            text_terms=list(u.text_terms),
            keywords=keywords if keywords is not None else u.text,
            brands=list(u.brands),
            boosts=dict(u.boosts),
        )


def _merge_price(prev: PriceConstraint, new: PriceConstraint) -> PriceConstraint:
    """A stated range wins outright; a bare preference refines the one given.

    "Giá rẻ" carries a tier and no numbers, and a tier alone is enough to make
    is_empty() false — so answering the budget question with "4–16 triệu" and
    then picking "Giá rẻ" replaced the range with nothing at all and the
    shopper's own figures were gone. Cheap is a preference *within* a budget,
    not a budget, so it layers on instead.
    """
    if new.min is not None or new.max is not None:
        return new                       # explicit figures replace outright
    if new.is_empty() and not new.prefer_value:
        return prev                      # this turn said nothing about price
    if prev.min is None and prev.max is None:
        return new                       # nothing to refine
    return PriceConstraint(
        min=prev.min, max=prev.max,
        tier=new.tier or prev.tier,
        prefer_value=new.prefer_value or prev.prefer_value,
        raw=prev.raw)


def merge(prev: Understanding | None, new: Understanding) -> Understanding:
    """Carry forward what the shopper already told us.

    Each turn answers one question; the constraints from earlier turns must
    survive it. Figures the new turn states explicitly win, so "thôi dưới 5
    triệu" replaces the budget instead of stacking a second one on top, while a
    bare preference like "rẻ hơn" refines the budget already given. Naming a
    different category replaces everything.
    """
    if prev is None:
        return new
    if prev.group and new.group and new.group != prev.group:
        # A different category is a different shopping task, and nothing the
        # shopper said about the last one carries over. Keeping it meant "laptop
        # dưới 15 triệu" followed by "tủ lạnh" searched fridges under 15 triệu —
        # a budget never stated for fridges, which also made the request look
        # specific enough to answer without asking anything. Worse, the specs
        # came too: "điện thoại pin trâu" then "tủ lạnh" put a 6.000mAh battery
        # filter on a fridge.
        return new
    merged = Understanding(
        intent=new.intent,
        text=new.text,
        group=new.group or prev.group,
        groups_seen=new.groups_seen or prev.groups_seen,
        inferred_groups=new.inferred_groups or prev.inferred_groups,
        price=_merge_price(prev.price, new.price),
        brands=new.brands or prev.brands,
    )
    # Feature and text constraints accumulate — "pin trâu" then "camera xịn"
    # means both, not just the latest.
    seen_feats = set()
    for feat, op, val in [*prev.feature_filters, *new.feature_filters]:
        if (feat, op) in seen_feats:
            continue
        seen_feats.add((feat, op))
        merged.feature_filters.append((feat, op, val))
    merged.text_terms = list({tuple(t) for t in [*prev.text_terms, *new.text_terms]})
    merged.slang_labels = list(dict.fromkeys([*prev.slang_labels, *new.slang_labels]))
    merged.boosts = {**prev.boosts, **new.boosts}
    merged.dropped = new.dropped
    return merged
