"""Regression tests for the parts that must not break silently.

Run:  ../.venv/bin/python -m pytest test_guards.py -q     (or just run the file)

These cover the bugs that actually bit during development: Vietnamese money
forms, the diacritic-folding homograph collisions, and the two hallucination
guards. They are the checks worth having if the lexicon grows.
"""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import Catalog, Product, Query                     # noqa: E402
from chat import (ChatEngine, check_brands, check_numbers,      # noqa: E402
                  trim_to_sentence)
from lexicon import detect_group, infer_groups, match_rules     # noqa: E402
from policy import (MAX_QUESTIONS, _sizing_filters,             # noqa: E402
                    count_constraints, stated_sizing)
from vntext import (fold, has_diacritics, homograph_ok,         # noqa: E402
                    normalize, parse_price, parse_quantity,
                    parse_sold_count, parse_spec_value)

M = 1_000_000
FAILURES: list[str] = []


def check(name: str, got, want) -> None:
    if got != want:
        FAILURES.append(f"{name}: got {got!r}, want {want!r}")


# -- folding ---------------------------------------------------------------
check("fold đ", fold("Điện thoại"), "dien thoai")
check("fold marks", fold("MÀN HÌNH ĐẸP"), "man hinh dep")
check("teencode", normalize("dt nao pin trau ko"), "dien thoai nao pin trau khong")
check("has_diacritics yes", has_diacritics("chào"), True)
check("has_diacritics no", has_diacritics("chao ban"), False)

# -- money -----------------------------------------------------------------
check("dưới 20 củ", parse_price("laptop dưới 20 củ").max, 20 * M)
check("no-diacritic", parse_price("laptop duoi 20 cu").max, 20 * M)
# "tủ lạnh" folds to "tu lanh"; "tu" is a min-cue and must not win over "tầm".
check("tầm not poisoned by category", parse_price("tủ lạnh tầm 15 triệu").min, int(15 * M * .75))
# The first number in a range borrows the second's unit.
check("range shared unit lo", parse_price("máy lạnh từ 8 đến 12 triệu").min, 8 * M)
check("range shared unit hi", parse_price("máy lạnh từ 8 đến 12 triệu").max, 12 * M)
check("hyphen range", parse_price("máy giặt 10-15 củ").min, 10 * M)
check("không quá", parse_price("nồi cơm không quá 1,5 triệu").max, 1_500_000)
check("trên", parse_price("tivi trên 20 triệu").min, 20 * M)
# "4k" is a resolution, not four thousand đồng.
check("4k is not money", parse_price("tivi 4k").is_empty(), True)
check("2k is not money", parse_price("màn hình 2k").is_empty(), True)
check("500k is money", parse_price("tai nghe khoảng 500k").max, 625_000)
check("tier budget", parse_price("quạt giá rẻ").tier, "budget")
# "tiết kiệm điện" is a spec, not a budget signal.
check("tiết kiệm điện not budget", parse_price("máy lạnh tiết kiệm điện").tier, None)

# Our own budget chips come back with a currency mark between the two amounts,
# which used to stop the range from being recognised: the whole thing collapsed
# to "about 9.37 triệu" and the shopper's upper band was silently invented.
check("formatted range chip lo", parse_price("9.370.000₫ – 21.940.000₫").min, 9_370_000)
check("formatted range chip hi", parse_price("9.370.000₫ – 21.940.000₫").max, 21_940_000)

# -- quantities (not money) ------------------------------------------------
check("quantity range", parse_quantity("15–25m²"), (15.0, 25.0))
check("quantity lower bound", parse_quantity("Trên 5 người"), (5.0, None))
check("quantity upper bound", parse_quantity("Dưới 50 inch"), (None, 50.0))
check("quantity from prose", parse_quantity("nhà mình 4 người"), (4.0, 4.0))
check("no quantity to read", parse_quantity("Không rõ"), (None, None))

# -- spec values -----------------------------------------------------------
check("mAh", parse_spec_value("5000 mAh"), (5000.0, "mah"))
check("TB->GB", parse_spec_value("1 TB SSD"), (1024.0, "gb"))
check("vn decimal", parse_spec_value("6,7 inch"), (6.7, "inch"))
check("sold count", parse_sold_count("14,5k"), 14500)

# -- homographs ------------------------------------------------------------
# chào (hello) vs chảo (pan); nhé (particle) vs nhẹ (light); xin vs xịn.
check("chào is not chảo", detect_group("xin chào")[0], None)
check("chảo is a pan", detect_group("mua cái chảo chống dính")[0], "kitchenware")
check("nhé is not nhẹ", [r.label for r in match_rules("cảm ơn nhé", None)], [])
check("nhẹ is light", "nhẹ, dễ mang" in [r.label for r in match_rules("laptop nhẹ", "laptop")], True)
check("xin is not xịn", parse_price("xin chào").tier, None)
# Undiacriticised input keeps working on best effort.
check("no-mark chao still pan", detect_group("mua chao chong dinh")[0], "kitchenware")
# "bạn" is how this assistant addresses the customer in every reply, so the
# folded form turns up constantly; only "bán" means someone is selling.
check("bạn is not bán", homograph_ok("ban", "chào bạn"), False)
check("bán is bán", homograph_ok("ban", "shop có bán tủ lạnh không"), True)
check("no marks, best effort", homograph_ok("ban", "shop co ban khong"), True)
check("hàng and hãng are both shopping", homograph_ok("hang", "có hàng không"), True)

# -- category inference ----------------------------------------------------
check("infer phone/tablet",
      infer_groups(match_rules("màn hình đẹp pin trâu", None)), ["phone", "tablet"])

# -- ask-or-answer policy --------------------------------------------------
# The regression these exist for: naming a category counted as a constraint, so
# "tủ lạnh" plus one answered question already looked like a fully specified
# request and the assistant recommended after a single question — never the two
# or three the brief asks for.
check("category alone constrains nothing", count_constraints(Query(group="fridge")), 0)
check("a budget is one constraint",
      count_constraints(Query(group="fridge", price=parse_price("dưới 12 triệu"))), 1)
check("budget plus a spec is two",
      count_constraints(Query(group="fridge", price=parse_price("dưới 12 triệu"),
                              feature_filters=[("capacity_l", ">=", 250.0)])), 2)

# Sizing answers arrive as a quantity in a domain unit and have to become a
# filter on a spec, or the question was asked for nothing.
check("household size sizes a fridge", _sizing_filters("fridge", "3–4 người"),
      [("capacity_l", ">=", 250.0), ("capacity_l", "<=", 450.0)])
check("over five people wants the top band", _sizing_filters("fridge", "Trên 5 người"),
      [("capacity_l", ">=", 400.0)])
check("room size sizes an air conditioner", _sizing_filters("ac", "Trên 25m²"),
      [("cooling_hp", ">=", 2.0)])
check("inches are already the right unit", _sizing_filters("tv", "Dưới 50 inch"),
      [("screen_inch", "<=", 50.0)])
check("no number means no sizing", _sizing_filters("ac", "Không rõ"), [])
check("no sizing rule for this category", _sizing_filters("phone", "3–4 người"), [])

# Sizing stated up front counts the same, so it is not asked about again. The
# unit has to be there: a bare number next to a category is a budget, and "tủ
# lạnh" folds to "tu lanh", whose "tu" would otherwise read as an "at least".
check("volunteered household size", stated_sizing("fridge", "tủ lạnh cho gia đình 4 người"),
      [("capacity_l", ">=", 250.0), ("capacity_l", "<=", 450.0)])
check("volunteered room size", stated_sizing("ac", "máy lạnh cho phòng 20m²"),
      [("cooling_hp", ">=", 1.5), ("cooling_hp", "<=", 2.5)])
check("a price is not a household", stated_sizing("fridge", "tủ lạnh 15 triệu"), [])
check("a resolution is not a size", stated_sizing("tv", "tivi 4k"), [])

# -- guards ----------------------------------------------------------------
P = [Product(product_id="1", name="Điện thoại vivo Y31d 6GB/128GB", brand="vivo",
             category="Điện thoại", cat_group="phone", price=7_730_000,
             price_list=8_990_000, discount_pct=0.14, rating=4.9, n_sold=24200,
             promotion=None, warranty=None, url=None, image_url=None,
             features={"battery_mah": 7200.0})]

check("real price passes", check_numbers("Giá 7.730.000₫ rất tốt", P), [])
check("real battery passes", check_numbers("Pin 7200mAh dùng cả ngày", P), [])
check("invented price caught", check_numbers("Chỉ 13.000.000 đồng thôi", P), ["13000000"])
check("user's own number allowed",
      check_numbers("Phòng 20m² thì hợp", P, user_text="phòng 20m2"), [])

BRANDS = {"vivo", "samsung", "sharp", "panasonic", "toshiba"}
check("shown brand passes", check_brands("vivo Y31d rất tốt", P, BRANDS), [])
check("invented brand caught", check_brands("Sharp cũng là lựa chọn tốt", P, BRANDS), ["sharp"])
check("brand user raised is allowed",
      check_brands("Sharp thì bên mình chưa có", P, BRANDS, user_text="có Sharp không"), [])

# -- sentence trimming -----------------------------------------------------
check("trims dangling clause",
      trim_to_sentence("Máy này pin rất tốt. Còn máy kia thì rẻ hơn và phù hợp với"),
      "Máy này pin rất tốt.")
check("leaves complete text",
      trim_to_sentence("Máy này pin rất tốt."), "Máy này pin rất tốt.")

# -- retrieval sanity ------------------------------------------------------
DB = Path(__file__).resolve().parent.parent / "data" / "catalog.db"
if DB.exists():
    con = sqlite3.connect(DB)
    n_phone = con.execute(
        "SELECT COUNT(*) FROM products WHERE cat_group='phone'").fetchone()[0]
    # Accessories must not leak into the product group they attach to.
    check("phone group is clean", n_phone, 174)
    leak = con.execute(
        "SELECT COUNT(*) FROM products WHERE cat_group='phone' "
        "AND category != 'Điện thoại'").fetchone()[0]
    check("no accessory leak", leak, 0)
    # đ survives SQLite's remove_diacritics, so the index must store folded text.
    hits = con.execute("SELECT COUNT(*) FROM products_fts "
                       "WHERE products_fts MATCH 'dien thoai'").fetchone()[0]
    check("fts finds đ-words", hits > 0, True)
    con.close()

    # -- the conversation itself -------------------------------------------
    # Generation is never reached here: prepare() covers routing, understanding
    # and the ask-or-answer decision, which is all of the logic under test.
    engine = ChatEngine(Catalog(str(DB)), None)

    def walk(sid: str, opening: str, pick: int = 0, limit: int = 8):
        """Answer each question with one of its own chips until a recommendation.

        Returns (questions asked, the understanding the answer was built from).
        """
        engine.reset(sid)
        questions, text, u = [], opening, None
        for _ in range(limit):
            _, u, reply = engine.prepare(sid, text)
            if reply is None or reply.kind != "question":
                break
            questions.append(reply)
            text = reply.chips[min(pick, len(reply.chips) - 1)]
        return questions, u

    # -- routing: a pleasantry is not a shopping request --------------------
    # Folded, "xin chào" contains chảo (a pan) and "chào bạn" contains bán (to
    # sell), so a greeting used to supply its own evidence that it was a
    # product query: saying hello came back with three saucepans. The override
    # still applies, but only to a request made somewhere other than the
    # greeting itself.
    route = engine.understander.route
    for hello in ("xin chào", "xin chao", "chào bạn", "chao ban", "chào shop",
                  "chao ban oi", "chào shop ạ", "chào"):
        check(f"{hello!r} is a greeting", route(hello, has_context=False).value,
              "greeting")
    for ta in ("cảm ơn bạn", "cam on ban", "cảm ơn bạn nhé", "cam on ban nhe"):
        check(f"{ta!r} is thanks", route(ta, has_context=False).value, "thanks")
    check("'tam biet ban' is a farewell",
          route("tam biet ban", has_context=False).value, "bye")

    # A pleasantry in front of a real request is still a real request.
    for ask in ("chào shop, cần laptop", "chao shop, can laptop",
                "xin chào, mình muốn mua tủ lạnh",
                "chào bạn, shop có bán máy giặt không",
                "hi, iphone bao nhiêu tiền"):
        check(f"{ask!r} is a product query", route(ask, has_context=False).value,
              "product")
    # Including one that really is about a frying pan, or really is about
    # something lightweight — the words the greetings collide with.
    check("a pan asked for politely is still a pan",
          route("chào shop, mình cần cái chảo chống dính",
                has_context=False).value, "product")
    check("light asked for politely is still light",
          route("cảm ơn nhé, cho mình xem thêm đồ nhẹ",
                has_context=False).value, "product")
    check("selling is still selling",
          route("shop có bán tủ lạnh không", has_context=False).value, "product")
    check("goods in stock is still shopping",
          route("có hàng không shop", has_context=False).value, "product")
    # A request can be built almost entirely from small words. It still has to
    # name something, which is why no noun belongs in the filler list.
    check("a request of small words is still a request",
          route("chào shop, có đồ nhẹ không", has_context=False).value, "product")
    check("and unmarked too",
          route("chao shop co do nhe khong", has_context=False).value, "product")
    check("but a polite opener alone is not",
          route("chào bạn, cho mình hỏi", has_context=False).value, "greeting")

    # Small talk mid-conversation must not answer, reset or consume anything:
    # "bạn là ai" folds to "ban la ai", and "ban la" is a clothes iron.
    engine.reset("t-interrupt")
    engine.prepare("t-interrupt", "tủ lạnh")
    for chat in ("xin chao", "bạn là ai", "cảm ơn nhé"):
        _, _, reply = engine.prepare("t-interrupt", chat)
        check(f"{chat!r} mid-question is small talk", reply.kind, "smalltalk")
    sess = engine.session("t-interrupt")
    check("the open question survived it", sess.pending_slot, "budget")
    check("and nothing was marked answered", sess.asked, set())
    check("and the category is untouched", sess.understanding.group, "fridge")

    qs, u = walk("t-fridge", "tu lanh")
    check("a bare category earns two questions", len(qs), 2)
    check("and the second one is answered into a filter",
          [f for f, _, _ in u.feature_filters], ["capacity_l"])

    qs, _ = walk("t-ac", "may lanh")
    check("same for an air conditioner", len(qs), 2)

    qs, _ = walk("t-specific", "dien thoai pin trau duoi 8 cu")
    check("a request that says enough earns none", len(qs), 0)

    qs, _ = walk("t-partial", "dien thoai pin trau")
    check("one volunteered need earns one", len(qs), 1)

    qs, _ = walk("t-vague", "can mua gi do cho me")
    check("a vague opening is still capped", len(qs) <= MAX_QUESTIONS, True)
    check("a vague opening is asked at least twice", len(qs) >= 2, True)

    # Switching product is a new task: the previous one's answers must not
    # follow it. Carrying them made the new category look already specified,
    # which is the other way the assistant skipped its questions entirely.
    engine.reset("t-switch")
    engine.prepare("t-switch", "laptop")
    engine.prepare("t-switch", "dưới 15 triệu")
    _, u, reply = engine.prepare("t-switch", "tủ lạnh")
    check("a new category drops the old budget", u.price.is_empty(), True)
    check("a new category is asked about again",
          reply is not None and reply.kind, "question")

    engine.reset("t-switch2")
    engine.prepare("t-switch2", "điện thoại pin trâu dưới 8 củ")
    _, u, _ = engine.prepare("t-switch2", "tủ lạnh")
    check("phone specs do not follow to a fridge", u.feature_filters, [])

    # A new subject parks the conversation it interrupted and keeps the id the
    # client is already using. Which way round this goes is the whole point: a
    # client that ignores the change must stay on the subject just raised, not
    # be left answering its questions into the previous subject's session —
    # that is what made "điều hòa" then a budget come back with refrigerators.
    engine.reset("t-fork")
    engine.prepare("t-fork", "điện thoại")
    engine.prepare("t-fork", "dưới 8 triệu")
    live, _, reply = engine.prepare("t-fork", "laptop")
    check("the new subject keeps the client's id", live.id, "t-fork")
    check("the previous subject is parked", bool(live.archived_id), True)
    check("the live session starts with nothing asked", live.asked, set())
    check("and is about the new category", live.understanding.group, "laptop")
    check("and is asked its own first question", reply.kind, "question")
    parked_id = live.archived_id

    parked = engine.session(parked_id)
    check("the parked session keeps its category", parked.understanding.group, "phone")
    check("and its budget", parked.understanding.price.max, 8 * M)
    check("and what it had already asked", parked.asked, {"budget"})

    # The failure this guards: a client that never reads the change at all.
    _, u, _ = engine.prepare("t-fork", "dưới 20 triệu")
    check("ignoring the change stays on the new subject", u.group, "laptop")
    check("the flag is only set on the turn it changed", live.archived_id, None)

    # And the parked conversation still resumes correctly when returned to.
    _, u, _ = engine.prepare(parked_id, "Pin trâu")
    check("the parked chat resumes on its own subject", u.group, "phone")
    check("with its budget intact", u.price.max, 8 * M)

    # "Camera đẹp" answers "what matters most in a phone?" and contains a
    # category cue; it is phone slang, not a request to shop for cameras.
    engine.reset("t-cam")
    engine.prepare("t-cam", "điện thoại")
    engine.prepare("t-cam", "dưới 12 triệu")
    _, u, _ = engine.prepare("t-cam", "Camera đẹp")
    check("slang answer keeps the category", u.group, "phone")

    # Cheap is a preference inside a budget, not a replacement for one.
    engine.reset("t-cheap")
    engine.prepare("t-cheap", "điện thoại từ 4 đến 16 triệu")
    _, u, _ = engine.prepare("t-cheap", "Giá rẻ")
    check("cheap keeps the stated ceiling", u.price.max, 16 * M)
    check("cheap still registers", u.price.tier, "budget")

if FAILURES:
    print(f"FAILED {len(FAILURES)}:")
    for f in FAILURES:
        print("  -", f)
    raise SystemExit(1)
print("all guard tests passed")
