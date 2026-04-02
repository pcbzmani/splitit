"""
generate_store_assets.py
Generates Play Store assets for SplitIt:
  - feature_graphic.png    (1024×500)
  - screenshot_1_sheets.png  (1080×1920)
  - screenshot_2_groups.png  (1080×1920)
  - screenshot_3_expenses.png(1080×1920)
  - screenshot_4_balances.png(1080×1920)
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "store_assets")
os.makedirs(OUT, exist_ok=True)

# ── Palette ──────────────────────────────────────────────────────────────────
BG       = (13,  15,  20)
SURFACE  = (22,  26,  35)
SURFACE2 = (30,  35,  48)
ACCENT   = (52,  211, 153)
ACCENT2  = (59,  130, 246)
TEXT     = (240, 244, 255)
MUTED    = (100, 112, 135)
BORDER   = (40,  48,  65)
DANGER   = (239, 68,  68)
WARN     = (251, 191, 36)

FONTS = {}
def F(size, bold=False):
    key = (size, bold)
    if key not in FONTS:
        name = "arialbd.ttf" if bold else "arial.ttf"
        try:
            FONTS[key] = ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
        except:
            FONTS[key] = ImageFont.load_default()
    return FONTS[key]

def rr(d, xy, r=18, fill=None, outline=None, width=1):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)

def TW(d, text, fnt):
    return int(d.textlength(text, font=fnt))

def centered(d, text, fnt, cx, y, fill=TEXT):
    w = TW(d, text, fnt)
    d.text((cx - w // 2, y), text, font=fnt, fill=fill)

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE GRAPHIC  1024 × 500
# ─────────────────────────────────────────────────────────────────────────────
def make_feature():
    W, H = 1024, 500
    img = Image.new('RGB', (W, H), BG)

    # Soft glow blobs
    glow = Image.new('RGB', (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([560, -80, 1060, 420], fill=(18, 42, 32))
    gd.ellipse([780, 280, 1100, 560], fill=(14, 28, 52))
    img = Image.blend(img, glow, 0.55)
    d = ImageDraw.Draw(img)

    # ── Branding (left) ──────────────────────────────────────────────────────
    f_logo = F(90, bold=True)
    sw = TW(d, "Split", f_logo)
    d.text((72, 108), "Split", font=f_logo, fill=TEXT)
    d.text((72 + sw, 108), "It", font=f_logo, fill=ACCENT)

    d.text((75, 222), "Split group expenses. Stay fair.", font=F(26), fill=MUTED)
    d.text((75, 260), "No sign-up  ·  Works offline  ·  Google Sheets sync",
           font=F(19), fill=(58, 68, 90))

    # Feature pills
    pills = ["💸 Track Expenses", "⚖️ Settle Balances", "📊 Google Sheets", "🔌 Works Offline"]
    px, py = 75, 318
    for pill in pills:
        pw = TW(d, pill, F(19)) + 30
        rr(d, [px, py, px + pw, py + 40], r=20, fill=SURFACE2, outline=BORDER, width=1)
        d.text((px + 15, py + 10), pill, font=F(19), fill=TEXT)
        px += pw + 10
        if px > 660:
            px = 75; py += 52

    # ── Mini phone mockup (right) ─────────────────────────────────────────────
    mx, my, mw, mh = 672, 24, 320, 452
    rr(d, [mx, my, mx + mw, my + mh], r=30, fill=SURFACE, outline=BORDER, width=2)
    rr(d, [mx + mw//2 - 32, my - 3, mx + mw//2 + 32, my + 16], r=8, fill=BG)

    d.text((mx + 18, my + 22), "YOUR SHEETS", font=F(13), fill=MUTED)
    d.line([mx + 14, my + 46, mx + mw - 14, my + 46], fill=BORDER, width=1)

    cards = [
        ("🔒", "Personal",  "Local",     BORDER, MUTED,  "1 group · 0 expenses"),
        ("📋", "Capsone",   "● Synced",  ACCENT, ACCENT, "1 group · 4 expenses"),
    ]
    cy = my + 56
    for emoji, name, badge, bc, tc, meta in cards:
        rr(d, [mx + 12, cy, mx + mw - 12, cy + 76], r=14, fill=SURFACE2, outline=BORDER, width=1)
        d.text((mx + 22, cy + 8),  emoji, font=F(28), fill=TEXT)
        d.text((mx + 64, cy + 10), name,  font=F(18, True), fill=TEXT)
        d.text((mx + 64, cy + 38), meta,  font=F(12), fill=MUTED)
        bw = TW(d, badge, F(12)) + 18
        rr(d, [mx + mw - 22 - bw, cy + 24, mx + mw - 22, cy + 50],
           r=12, fill=SURFACE, outline=bc, width=1)
        d.text((mx + mw - 22 - bw + 9, cy + 30), badge, font=F(12), fill=tc)
        cy += 86

    rr(d, [mx + 12, cy + 6, mx + mw - 12, cy + 50], r=12, fill=SURFACE, outline=BORDER, width=1)
    ns = "+ New Sheet"
    centered(d, ns, F(15), mx + mw//2, cy + 17, fill=MUTED)

    img.save(f"{OUT}/feature_graphic.png")
    print("✓ feature_graphic.png (1024×500)")


# ─────────────────────────────────────────────────────────────────────────────
# PHONE SCREENSHOT base  1080 × 1920
# ─────────────────────────────────────────────────────────────────────────────
SW, SH, P = 1080, 1920, 52

def new_phone():
    img = Image.new('RGB', (SW, SH), BG)
    d = ImageDraw.Draw(img)
    d.text((P, 38), "9:41", font=F(34, True), fill=TEXT)
    d.text((SW - P - 180, 38), "WiFi 🔋 100%", font=F(28), fill=MUTED)
    return img, d

def sheet_chip(d, x, y, text, color, bg=SURFACE):
    w = TW(d, text, F(26)) + 36
    rr(d, [x, y, x + w, y + 52], r=26, fill=bg, outline=color, width=2)
    d.text((x + 18, y + 12), text, font=F(26), fill=color)
    return w

def group_card(d, x, y, w, h):
    rr(d, [x, y, x + w, y + h], r=24, fill=SURFACE, outline=BORDER, width=1)

def stat_card(d, x, y, w, h, label, value, vcolor=ACCENT):
    rr(d, [x, y, x + w, y + h], r=20, fill=SURFACE, outline=BORDER, width=1)
    d.text((x + 24, y + 22), label, font=F(22), fill=MUTED)
    d.text((x + 24, y + 60), value, font=F(36, True), fill=vcolor)


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot 1 — Sheets screen
# ─────────────────────────────────────────────────────────────────────────────
def ss_sheets():
    img, d = new_phone()

    # Logo
    sw2 = TW(d, "Split", F(78, True))
    d.text((P, 110), "Split", font=F(78, True), fill=TEXT)
    d.text((P + sw2, 110), "It", font=F(78, True), fill=ACCENT)
    d.text((P, 205), "Choose a workspace to track expenses.", font=F(30), fill=MUTED)

    d.text((P, 304), "YOUR SHEETS", font=F(27), fill=MUTED)

    # Personal card
    group_card(d, P, 348, SW - P*2, 148)
    rr(d, [P+24, 370, P+106, 452], r=20, fill=SURFACE2, outline=BORDER, width=1)
    d.text((P+36, 382), "🔒", font=F(52), fill=TEXT)
    d.text((P+130, 374), "Personal", font=F(40, True), fill=TEXT)
    d.text((P+130, 428), "1 group · 0 expenses", font=F(27), fill=MUTED)
    sheet_chip(d, SW - P - 148, 392, "Local", BORDER, SURFACE2)
    d.text((SW - P - 14, 404), "›", font=F(46), fill=MUTED)

    # Capsone card
    group_card(d, P, 518, SW - P*2, 148)
    rr(d, [P+24, 540, P+106, 622], r=20, fill=SURFACE2, outline=BORDER, width=1)
    d.text((P+30, 546), "📋", font=F(52), fill=TEXT)
    d.text((P+130, 542), "Capsone", font=F(40, True), fill=TEXT)
    d.text((P+130, 596), "1 group · 4 expenses", font=F(27), fill=MUTED)
    sheet_chip(d, SW - P - 200, 558, "● Synced", ACCENT, SURFACE2)
    d.text((SW - P - 14, 570), "›", font=F(46), fill=MUTED)

    # New Sheet
    rr(d, [P, 696, SW-P, 804], r=24, fill=SURFACE, outline=BORDER, width=2)
    centered(d, "+ New Sheet", F(36), SW//2, 736, fill=MUTED)

    # Connect
    rr(d, [P, 824, SW-P, 932], r=24, fill=SURFACE2, outline=ACCENT2, width=2)
    centered(d, "🔗  Connect Shared Sheet", F(36), SW//2, 864, fill=ACCENT2)

    img.save(f"{OUT}/screenshot_1_sheets.png")
    print("✓ screenshot_1_sheets.png")


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot 2 — Groups screen
# ─────────────────────────────────────────────────────────────────────────────
def ss_groups():
    img, d = new_phone()

    # Header bar
    rr(d, [P, 108, P+260, 170], r=22, fill=SURFACE, outline=BORDER, width=1)
    d.text((P+20, 120), "← Sheets", font=F(32), fill=TEXT)
    d.text((P+340, 118), "📋  Capsone", font=F(38, True), fill=TEXT)

    # Action buttons
    for i, (lbl, col) in enumerate([("⎘ Share", ACCENT2), ("↻ Pull", ACCENT2), ("⚙", MUTED)]):
        bx = SW - P - 380 + i * 130
        rr(d, [bx, 108, bx+118, 170], r=22, fill=SURFACE, outline=BORDER, width=1)
        centered(d, lbl, F(28), bx+59, 126, fill=col)

    d.text((P, 220), "GROUPS", font=F(27), fill=MUTED)

    # Home group card
    rr(d, [P, 268, SW-P, 468], r=26, fill=SURFACE, outline=BORDER, width=1)
    rr(d, [P+24, 292, P+148, 416], r=22, fill=SURFACE2, outline=BORDER, width=1)
    d.text((P+40, 312), "🏠", font=F(72), fill=TEXT)
    d.text((P+172, 296), "Home", font=F(46, True), fill=TEXT)
    d.text((P+172, 356), "4 members · 2 expenses · QAR", font=F(27), fill=MUTED)
    val = "ر.ق 0.00"
    d.text((SW-P-TW(d,val,F(38,True))-36, 308), val, font=F(38, True), fill=ACCENT)
    d.text((SW-P-TW(d,"QAR",F(26))-36, 362), "QAR", font=F(26), fill=MUTED)
    d.text((SW-P-14, 356), "›", font=F(52), fill=MUTED)

    # Create group
    rr(d, [P, 500, SW-P, 606], r=24, fill=SURFACE, outline=BORDER, width=2)
    centered(d, "+ Create New Group", F(36), SW//2, 540, fill=MUTED)

    img.save(f"{OUT}/screenshot_2_groups.png")
    print("✓ screenshot_2_groups.png")


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot 3 — Expenses tab
# ─────────────────────────────────────────────────────────────────────────────
EXPENSES = [
    ("🛒", "Groceries",       "Apr 01", "ر.ق 45.00", "Paid by You",   ACCENT,  "Food"),
    ("🚕", "Taxi to Mall",    "Apr 01", "ر.ق 18.00", "Paid by Shyam", ACCENT2, "Transport"),
    ("🍕", "Dinner",          "Mar 30", "ر.ق 92.50", "Paid by You",   ACCENT,  "Food"),
    ("⚡", "Electricity Bill","Mar 29", "ر.ق 210.00","Paid by Ahmed",  WARN,    "Utilities"),
]
def ss_expenses():
    img, d = new_phone()

    # Header
    rr(d, [P, 108, P+240, 170], r=22, fill=SURFACE, outline=BORDER, width=1)
    d.text((P+16, 120), "← Groups", font=F(32), fill=TEXT)
    d.text((P+310, 116), "🏠  Home", font=F(38, True), fill=TEXT)
    sheet_chip(d, SW-P-230, 110, "QAR", BORDER, SURFACE)
    sheet_chip(d, SW-P-400, 110, "● Sheet Connected", ACCENT, SURFACE2)

    # Stat cards
    stats = [
        ("TOTAL EXPENSES", "ر.ق 365.50", ACCENT),
        ("YOU ARE OWED",   "ر.ق 68.75",  ACCENT),
        ("YOU OWE",        "ر.ق 0.00",   DANGER),
        ("EXPENSES",       "4",           TEXT),
    ]
    cw = (SW - P*2 - 16) // 2
    ch = 130
    for i, (lbl, val, vc) in enumerate(stats):
        cx = P + (i % 2) * (cw + 16)
        cy = 202 + (i // 2) * (ch + 16)
        stat_card(d, cx, cy, cw, ch, lbl, val, vc)

    # Tabs
    tabs = ["💸 Expenses", "⚖️ Balances", "👥 Members"]
    tw_each = (SW - P*2 - 32) // 3
    for i, tab in enumerate(tabs):
        tx = P + i * (tw_each + 16)
        active = i == 0
        rr(d, [tx, 506, tx+tw_each, 562], r=22,
           fill=ACCENT if active else SURFACE, outline=BORDER if not active else ACCENT, width=1)
        centered(d, tab, F(26, bold=active), tx+tw_each//2, 520,
                 fill=BG if active else MUTED)

    # Filter chips
    chips = ["All", "Food", "Transport", "Utilities"]
    cx2 = P
    for i, chip in enumerate(chips):
        cw2 = TW(d, chip, F(24)) + 30
        active = i == 0
        rr(d, [cx2, 580, cx2+cw2, 630], r=22,
           fill=ACCENT if active else SURFACE, outline=ACCENT if active else BORDER, width=1)
        d.text((cx2+15, 592), chip, font=F(24), fill=BG if active else MUTED)
        cx2 += cw2 + 12

    # Expense list
    ey = 652
    for emoji, desc, date, amount, paid_by, ac, cat in EXPENSES:
        rr(d, [P, ey, SW-P, ey+128], r=22, fill=SURFACE, outline=BORDER, width=1)
        rr(d, [P+18, ey+18, P+90, ey+110], r=18, fill=SURFACE2, outline=BORDER, width=1)
        d.text((P+26, ey+28), emoji, font=F(46), fill=TEXT)
        d.text((P+110, ey+18), desc, font=F(34, True), fill=TEXT)
        d.text((P+110, ey+66), f"{date}  ·  {cat}  ·  {paid_by}", font=F(24), fill=MUTED)
        aw = TW(d, amount, F(34, True))
        d.text((SW-P-aw-14, ey+38), amount, font=F(34, True), fill=ac)
        ey += 144

    img.save(f"{OUT}/screenshot_3_expenses.png")
    print("✓ screenshot_3_expenses.png")


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot 4 — Balances tab
# ─────────────────────────────────────────────────────────────────────────────
def ss_balances():
    img, d = new_phone()

    # Header (same as expenses)
    rr(d, [P, 108, P+240, 170], r=22, fill=SURFACE, outline=BORDER, width=1)
    d.text((P+16, 120), "← Groups", font=F(32), fill=TEXT)
    d.text((P+310, 116), "🏠  Home", font=F(38, True), fill=TEXT)
    sheet_chip(d, SW-P-230, 110, "QAR", BORDER, SURFACE)

    # Stat cards (same)
    stats = [
        ("TOTAL EXPENSES", "ر.ق 365.50", ACCENT),
        ("YOU ARE OWED",   "ر.ق 68.75",  ACCENT),
        ("YOU OWE",        "ر.ق 0.00",   DANGER),
        ("EXPENSES",       "4",           TEXT),
    ]
    cw = (SW - P*2 - 16) // 2
    ch = 130
    for i, (lbl, val, vc) in enumerate(stats):
        cx2 = P + (i % 2) * (cw + 16)
        cy2 = 202 + (i // 2) * (ch + 16)
        stat_card(d, cx2, cy2, cw, ch, lbl, val, vc)

    # Tabs — Balances active
    tabs = ["💸 Expenses", "⚖️ Balances", "👥 Members"]
    tw_each = (SW - P*2 - 32) // 3
    for i, tab in enumerate(tabs):
        tx = P + i * (tw_each + 16)
        active = i == 1
        rr(d, [tx, 506, tx+tw_each, 562], r=22,
           fill=ACCENT if active else SURFACE, outline=BORDER if not active else ACCENT, width=1)
        centered(d, tab, F(26, bold=active), tx+tw_each//2, 520,
                 fill=BG if active else MUTED)

    # Member balances
    d.text((P, 590), "MEMBER BALANCES", font=F(27), fill=MUTED)
    members = [
        ("You",   "+ر.ق 68.75", ACCENT,  "Is Owed"),
        ("Shyam", "-ر.ق 23.50", DANGER,  "Owes"),
        ("Ahmed", "+ر.ق 105.00",ACCENT,  "Is Owed"),
        ("Sara",  "-ر.ق 150.25",DANGER,  "Owes"),
    ]
    initials_colors = [ACCENT, ACCENT2, (255,180,50), (220,100,180)]
    my = 640
    for i, (name, bal, col, status) in enumerate(members):
        rr(d, [P, my, SW-P, my+110], r=22, fill=SURFACE, outline=BORDER, width=1)
        rr(d, [P+18, my+18, P+90, my+92], r=44, fill=initials_colors[i % len(initials_colors)])
        centered(d, name[0], F(38, True), P+54, my+30, fill=BG)
        d.text((P+108, my+16), name, font=F(36, True), fill=TEXT)
        d.text((P+108, my+64), status, font=F(26), fill=MUTED)
        bw = TW(d, bal, F(36, True))
        d.text((SW-P-bw-14, my+30), bal, font=F(36, True), fill=col)
        my += 126

    # Settlements
    d.text((P, my+12), "SUGGESTED SETTLEMENTS", font=F(27), fill=MUTED)
    settlements = [
        ("S", "Shyam", "→", "Y", "You",   "ر.ق 23.50"),
        ("Sa","Sara",  "→", "A", "Ahmed", "ر.ق 45.25"),
    ]
    sy = my + 58
    for init1, name1, arrow, init2, name2, amt in settlements:
        rr(d, [P, sy, SW-P, sy+100], r=22, fill=SURFACE2, outline=BORDER, width=1)
        rr(d, [P+18, sy+16, P+76, sy+84], r=30, fill=DANGER)
        centered(d, init1, F(28, True), P+47, sy+26, fill=TEXT)
        d.text((P+90, sy+24), name1, font=F(30, True), fill=TEXT)
        d.text((P+90, sy+62), "pays", font=F(24), fill=MUTED)
        centered(d, "→", F(36), SW//2, sy+30, fill=MUTED)
        rr(d, [SW-P-240, sy+16, SW-P-18, sy+84], r=30, fill=ACCENT)
        centered(d, init2, F(28, True), SW-P-129, sy+26, fill=BG)
        d.text((SW-P-210, sy+24), name2, font=F(30, True), fill=TEXT)
        aw = TW(d, amt, F(30, True))
        d.text((SW//2 - aw//2, sy+58), amt, font=F(30, True), fill=ACCENT)
        sy += 116

    img.save(f"{OUT}/screenshot_4_balances.png")
    print("✓ screenshot_4_balances.png")


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    make_feature()
    ss_sheets()
    ss_groups()
    ss_expenses()
    ss_balances()
    print(f"\nAll assets saved to: {OUT}")
