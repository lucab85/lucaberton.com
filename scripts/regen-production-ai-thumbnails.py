#!/usr/bin/env python3
"""Regenerate every per-post blog thumbnail (/blog/thumbnails/<slug>.jpg) as a
consistent 'Production AI' branded social card (1200x630).

Design (uniform across all posts):
  - Dark slate brand gradient background.
  - Top-left: 'Luca Berton' (white) + red accent bar + 'The Production AI Expert' (red).
  - Main: the post title (white, wrapped).
  - Footer: 'The AI demo is easy. Production is hard.' (slate) + 'lucaberton.com' (muted).
Only posts whose frontmatter image.src points at /blog/thumbnails/ are touched;
custom images (book covers, photos) are left alone.
"""
import os, re, glob, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = "/tmp/lucarepo"
BLOG = os.path.join(ROOT, "src/content/blog")
IMG_DIR = os.path.join(ROOT, "static/blog/thumbnails")
FD = "/usr/share/fonts/truetype/dejavu/"

W, H = 1200, 630
BG_TOP = (15, 23, 42)      # slate-950
BG_BOT = (30, 41, 59)      # slate-800
RED = (239, 68, 68)        # red-500
WHITE = (255, 255, 255)
SLATE = (203, 213, 225)    # slate-300
MUTE = (148, 163, 184)     # slate-400

def font(sz, bold=True):
    return ImageFont.truetype(FD + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"), sz)

def get_title(path):
    txt = open(path, encoding="utf-8").read()
    m = re.search(r'^title:\s*"([^"]*)"', txt, re.M)
    return m.group(1).strip() if m else os.path.basename(path).replace(".mdx", "")

def get_category(path):
    txt = open(path, encoding="utf-8").read()
    m = re.search(r'^category:\s*"([^"]*)"', txt, re.M)
    return m.group(1).strip() if m else ""

def gradient():
    base = Image.new("RGB", (W, H), BG_TOP)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOT[0]-BG_TOP[0])*t)
        g = int(BG_TOP[1] + (BG_BOT[1]-BG_TOP[1])*t)
        b = int(BG_TOP[2] + (BG_BOT[2]-BG_TOP[2])*t)
        ImageDraw.Draw(base).line([(0, y), (W, y)], fill=(r, g, b))
    # subtle decorative circles (brand glow)
    d = ImageDraw.Draw(base, "RGBA")
    d.ellipse([820, -120, 1180, 240], fill=(239, 68, 68, 18))
    d.ellipse([-120, 420, 260, 800], fill=(56, 189, 248, 12))
    return base

def wrap_title(title, fnt, max_w):
    words = title.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if fnt.getlength(test) <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines[:3]  # cap at 3 lines

def make_card(title, category):
    img = gradient()
    d = ImageDraw.Draw(img)
    x = 70
    # Brand mark
    d.text((x, 70), "Luca Berton", font=font(40), fill=WHITE)
    d.rectangle([x, 132, x+64, 140], fill=RED)
    d.text((x, 150), "The Production AI Expert", font=font(30), fill=RED)
    # Title (wrapped, sized to fit)
    fsz = 58 if len(title) < 45 else (48 if len(title) < 70 else 40)
    tf = font(fsz)
    lines = wrap_title(title, tf, W - 2*x - 40)
    ty = 250
    for ln in lines:
        d.text((x, ty), ln, font=tf, fill=WHITE)
        ty += fsz + 14
    # Footer
    d.text((x, H-120), "The AI demo is easy. Production is hard.", font=font(26, False), fill=SLATE)
    cat_label = (category or "Production AI").upper()
    d.text((x, H-78), cat_label, font=font(20, False), fill=MUTE)
    d.text((W-70, H-78), "lucaberton.com", font=font(20, False), fill=MUTE, anchor="ra")
    return img

def main():
    count = skip = fail = 0
    for mdx in glob.glob(os.path.join(BLOG, "*.mdx")):
        txt = open(mdx, encoding="utf-8").read()
        m = re.search(r'^image:\s*\n\s*src:\s*"([^"]*)"', txt, re.M)
        if not m:
            continue
        src = m.group(1)
        if not src.startswith("/blog/thumbnails/"):
            continue  # custom image (book/photo) — leave alone
        slug = os.path.basename(src).replace(".jpg", "")
        out = os.path.join(IMG_DIR, slug + ".jpg")
        if not os.path.exists(out):
            skip += 1
            continue
        try:
            card = make_card(get_title(mdx), get_category(mdx))
            card.save(out, "JPEG", quality=85)
            count += 1
        except Exception as e:
            print("FAIL", slug, e)
            fail += 1
    print(f"regenerated={count} skipped_missing={skip} failed={fail}")

if __name__ == "__main__":
    main()
