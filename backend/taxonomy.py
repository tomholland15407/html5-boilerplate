"""Category grouping and spec-feature extraction rules.

The catalog has 119 raw categories and 1,295 distinct spec keys, with no schema
shared between them — a laptop has 'Tốc độ CPU', a watch has 'Đường kính mặt'.
Two mappings tame that:

  CATEGORY_RULES  119 raw categories -> ~35 coarse groups, so slang can be
                  scoped ("pin trâu" means one thing for a phone and nothing
                  at all for a rice cooker).

  FEATURE_RULES   free-text spec rows -> canonical numeric columns, so range
                  filters are possible at all.
"""

from __future__ import annotations

# --------------------------------------------------------------------------
# Raw category -> coarse group. First substring hit wins, so order matters:
# longer / more specific patterns are listed above their generic counterparts.
# --------------------------------------------------------------------------
CATEGORY_RULES: list[tuple[str, str]] = [
    # --- accessories and parts, FIRST ------------------------------------
    # These name the product they attach to, so they must be claimed before it.
    # "Phụ kiện điện thoại khác" contains "điện thoại"; left later in the list
    # it lands in `phone`, and a shopper asking for a phone is offered a
    # battery or an AirPods pouch. Likewise "Miếng dán Camera" -> camera,
    # "Khung treo Tivi" -> tv, "Giá đỡ máy giặt" -> washer.
    ("may anh va phu kien", "camera"),      # genuinely cameras, not parts
    ("tui dung phu kien", "bag"),
    ("phu kien nha bep", "kitchenware"),
    ("phu kien op lung", "case"),
    ("thiet bi dinh vi", "smarthome"),
    ("phu kien", "accessory"),
    ("mieng dan", "case"),
    ("op lung", "case"),
    ("khung treo", "accessory"),
    ("gia treo", "accessory"),
    ("gia do", "accessory"),
    ("dieu khien", "accessory"),
    ("day dong ho", "accessory"),
    ("kiem tra - dat lich thay loi", "service"),
    ("dich vu", "service"),
    # --- products ---------------------------------------------------------
    ("dien thoai", "phone"),
    ("may tinh bang", "tablet"),
    ("laptop", "laptop"),
    ("pc, may in", "pc"),
    ("tivi", "tv"),
    ("tu lanh", "fridge"),
    ("tu dong", "freezer"),
    ("tu tru ruou", "freezer"),
    ("may lam da", "freezer"),
    ("may lanh", "ac"),
    ("may giat", "washer"),
    ("may say quan ao", "dryer"),
    ("tu say quan ao", "dryer"),
    ("may say giay", "dryer"),
    ("quat", "fan"),
    ("thiet bi khong khi", "aircare"),
    ("thiet bi suoi", "heater"),
    ("dong ho thong minh", "smartwatch"),
    ("dong ho thoi trang", "watch"),
    ("loa, tai nghe", "audio"),
    ("loa", "audio"),
    ("micro", "audio"),
    ("may anh", "camera"),
    ("ong kinh", "camera"),
    ("flycam", "camera"),
    ("chuong cua camera", "camera"),
    ("camera", "camera"),
    ("noi com dien", "cooking"),
    ("bep", "cooking"),
    ("lo vi song", "cooking"),
    ("noi ap suat", "cooking"),
    ("lau dien", "cooking"),
    ("noi nau cham", "cooking"),
    ("thiet bi lam banh", "cooking"),
    ("may lam sua chua", "cooking"),
    ("sieu sac thuoc", "cooking"),
    ("thiet bi lam bep khac", "cooking"),
    ("may xay", "foodprep"),
    ("may ep", "foodprep"),
    ("may vat cam", "foodprep"),
    ("may nhoi bot", "foodprep"),
    ("may rua chen", "dishwasher"),
    ("may hut mui", "hood"),
    ("may hut bui", "vacuum"),
    ("may nuoc nong", "waterheater"),
    ("loc nuoc", "water"),
    ("loc tong dau nguon", "water"),
    ("cay nuoc nong lanh", "water"),
    ("bon nuoc", "water"),
    ("sac du phong", "powerbank"),
    ("sac, cap", "charger"),
    ("hub, cap ket noi", "charger"),
    ("pin sac", "charger"),
    ("thiet bi mang", "network"),
    ("chuot, ban phim", "peripheral"),
    ("bang ve", "peripheral"),
    ("ban ui", "iron"),
    ("binh dun sieu toc", "kettle"),
    ("binh thuy dien", "kettle"),
    ("lam dep", "beauty"),
    ("cham soc me va be", "beauty"),
    ("ghe massage", "massage"),
    ("may choi game", "gaming"),
    ("binh dung nuoc", "kitchenware"),
    ("balo", "bag"),
    ("tui dung", "bag"),
    ("vali", "bag"),
    ("the nho", "storage"),
    ("usb", "storage"),
    ("o cung", "storage"),
    ("phan mem", "software"),
    ("den", "light"),
    ("bong den", "light"),
    ("o cam", "light"),
    ("mat kinh", "eyewear"),
    ("xe dap", "bike"),
    ("may doc sach", "ereader"),
    ("thiet bi nha thong minh", "smarthome"),
    ("o khoa", "smarthome"),
    ("bo luu dien", "power"),
    ("thiet bi chong giat", "power"),
    ("on ap", "power"),
    ("vot muoi", "household"),
    ("dung cu", "household"),
    ("ban chai", "household"),
    ("co quet son", "household"),
    ("tui dung rac", "household"),
    ("hop dung do", "household"),
    ("may cua", "tools"),
]

# Human-facing names, used when the bot has to ask "what are you shopping for".
GROUP_LABELS: dict[str, str] = {
    "phone": "điện thoại", "tablet": "máy tính bảng", "laptop": "laptop",
    "pc": "PC / máy in", "tv": "tivi", "fridge": "tủ lạnh",
    "freezer": "tủ đông / tủ mát", "ac": "máy lạnh", "washer": "máy giặt",
    "dryer": "máy sấy quần áo", "fan": "quạt", "aircare": "máy lọc không khí",
    "heater": "thiết bị sưởi", "smartwatch": "đồng hồ thông minh",
    "watch": "đồng hồ thời trang", "audio": "loa / tai nghe",
    "camera": "camera / máy ảnh", "cooking": "đồ bếp nấu nướng",
    "foodprep": "máy xay / ép", "dishwasher": "máy rửa chén",
    "hood": "máy hút mùi", "vacuum": "máy hút bụi",
    "waterheater": "máy nước nóng", "water": "máy lọc nước",
    "powerbank": "sạc dự phòng", "charger": "sạc / cáp", "case": "ốp lưng / dán",
    "network": "thiết bị mạng", "peripheral": "chuột / bàn phím",
    "iron": "bàn ủi", "kettle": "bình đun siêu tốc",
    "beauty": "làm đẹp / chăm sóc cá nhân", "massage": "ghế massage",
    "gaming": "máy chơi game", "kitchenware": "phụ kiện nhà bếp",
    "bag": "balo / túi", "storage": "thẻ nhớ / ổ cứng", "software": "phần mềm",
    "light": "đèn", "eyewear": "mắt kính", "bike": "xe đạp",
    "ereader": "máy đọc sách", "smarthome": "nhà thông minh",
    "power": "ổn áp / lưu điện", "household": "đồ gia dụng",
    "tools": "dụng cụ", "accessory": "phụ kiện", "service": "dịch vụ",
    "other": "sản phẩm",
}


def category_group(category_name_folded: str) -> str:
    for pattern, group in CATEGORY_RULES:
        if pattern in category_name_folded:
            return group
    return "other"


# --------------------------------------------------------------------------
# Spec key -> canonical numeric feature.
#
# (key pattern, feature, required unit, match mode)
#
#   mode 'in'     substring of the folded key; read the value's leading number
#   mode 'eq'     the folded key must equal the pattern exactly
#   mode 'search' substring key match, but hunt the value for a number carrying
#                 the required unit rather than reading the leading one
#
# Rules are checked in order; the first that fits wins. Order matters — the
# 'khoi luong giat' rule must precede the generic 'khoi luong'.
# --------------------------------------------------------------------------
FEATURE_RULES: list[tuple[str, str, str | None, str]] = [
    ("dung luong pin", "battery_mah", "mah", "in"),
    ("dung luong pin", "battery_wh", "wh", "in"),
    ("thoi gian su dung pin", "battery_hours", "gio", "in"),
    ("thoi luong pin", "battery_hours", "gio", "in"),
    ("thoi gian su dung", "battery_hours", "gio", "in"),
    # Exact match only. As a substring, 'ram' also hits "Hỗ trợ RAM tối đa"
    # (max *supported* RAM, up to 128GB) and "Tốc độ Bus RAM", which inflated
    # every laptop's RAM to its motherboard ceiling.
    ("ram", "ram_gb", "gb", "eq"),
    ("bo nho trong", "storage_gb", "gb", "in"),
    ("o cung", "storage_gb", "gb", "in"),
    ("dung luong luu tru", "storage_gb", "gb", "in"),
    ("toc do cpu", "cpu_ghz", "ghz", "in"),
    # 'so nhan' only. A looser 'so luong' rule also swallowed "Số lượng loa"
    # (speaker count) and "Số lượng kết nối dàn lạnh" (indoor-unit count),
    # giving air-conditioners a CPU core count.
    ("so nhan", "cpu_cores", None, "in"),
    ("kich thuoc man hinh", "screen_inch", "inch", "in"),
    ("kich co man hinh", "screen_inch", "inch", "in"),   # how TVs spell it
    ("man hinh rong", "screen_inch", "inch", "in"),
    ("tan so quet", "refresh_hz", "hz", "in"),
    ("do phan giai camera", "camera_mp", "mp", "in"),
    ("camera sau", "camera_mp", "mp", "in"),
    ("camera truoc", "front_camera_mp", "mp", "in"),
    ("dung tich", "capacity_l", "lit", "in"),
    ("cong suat lam lanh", "cooling_hp", "hp", "in"),
    ("cong suat", "power_w", "w", "in"),
    ("khoi luong giat", "wash_kg", "kg", "in"),
    ("khoi luong say", "dry_kg", "kg", "in"),
    ("khoi luong", "weight_kg", "kg", "in"),
    ("trong luong", "weight_kg", "kg", "in"),
    # Laptops and phones bury mass in a combined dimension string:
    # 'Dài 314 mm - Rộng 223.75 mm - Dày 17.9 mm - 1.54 kg'. Reading the leading
    # number yields the length, so search for the figure marked in kg.
    ("kich thuoc", "weight_kg", "kg", "search"),
    # Named _cm because the value parser normalises mm to cm: a "41 mm" watch
    # face is stored as 4.1. Callers convert; the name must not lie about it.
    ("duong kinh mat", "case_cm", "cm", "in"),
    ("do day mat", "thickness_cm", "cm", "in"),
    ("do rong day", "strap_cm", "cm", "in"),
    ("khang nuoc", "water_atm", "atm", "in"),
    ("dien tich lam lanh", "room_m2", "m2", "in"),
    ("dien tich", "room_m2", "m2", "in"),
    ("so nguoi", "serves", "nguoi", "in"),
    ("luu luong", "flow_lph", None, "in"),
    ("toc do vong quay", "rpm", None, "in"),
]


def extract_features(spec_key_folded: str, spec_value: str | None,
                     num: float | None, unit: str | None) -> tuple[str, float] | None:
    """Map one spec row onto a canonical feature, if any rule fits."""
    from vntext import find_unit_value

    for pattern, feat, want_unit, mode in FEATURE_RULES:
        if mode == "eq":
            if spec_key_folded != pattern:
                continue
        elif pattern not in spec_key_folded:
            continue

        if mode == "search":
            if want_unit is None:
                continue
            found = find_unit_value(spec_value, want_unit)
            if found is not None:
                return feat, found
            continue

        if num is None:
            continue
        if want_unit is not None and unit != want_unit:
            continue
        return feat, num
    return None
