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

from catalog import Product                                    # noqa: E402
from chat import check_brands, check_numbers, trim_to_sentence  # noqa: E402
from lexicon import detect_group, infer_groups, match_rules     # noqa: E402
from vntext import (fold, has_diacritics, normalize,            # noqa: E402
                    parse_price, parse_sold_count, parse_spec_value)

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

# -- category inference ----------------------------------------------------
check("infer phone/tablet",
      infer_groups(match_rules("màn hình đẹp pin trâu", None)), ["phone", "tablet"])

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

if FAILURES:
    print(f"FAILED {len(FAILURES)}:")
    for f in FAILURES:
        print("  -", f)
    raise SystemExit(1)
print("all guard tests passed")
