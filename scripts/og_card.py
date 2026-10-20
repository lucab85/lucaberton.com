"""Branded Open Graph cards for lucaberton.com (1200x630), with Luca's real photo.

    python3 scripts/og_card.py sample <slug> [<slug> ...]   # write to /tmp-style out dir (see --out)
    python3 scripts/og_card.py all                           # regenerate every /blog/thumbnails/ card

Fonts: Bricolage Grotesque (headings) and Inter (text), the site's own fonts,
as TTF in scripts/assets/fonts (SIL OFL). Photo: static/luca-hero.jpg, shown
whole in a round frame (no cut-out).
"""
import argparse
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "src/content/blog")
THUMBS = os.path.join(ROOT, "static/blog/thumbnails")
FONTS = os.path.join(ROOT, "scripts/assets/fonts")
PHOTO = os.path.join(ROOT, "static/luca-hero.jpg")

W, H = 1200, 630
BG = (7, 11, 20)
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)
TEAL = (45, 212, 191)
INDIGO = (99, 102, 241)
PAD = 72


def heading(size, weight="ExtraBold"):
    f = ImageFont.truetype(os.path.join(FONTS, "BricolageGrotesque-Variable.ttf"), size)
    f.set_variation_by_name(weight)
    return f


def text(size, weight="Regular"):
    f = ImageFont.truetype(os.path.join(FONTS, "Inter-Variable.ttf"), size)
    f.set_variation_by_name(weight)
    return f


def frontmatter(path):
    src = open(path, encoding="utf-8").read()
    fm = src.split("---", 2)[1] if src.startswith("---") else ""
    def field(name):
        m = re.search(rf'^{name}:\s*"?(.*?)"?\s*$', fm, re.M)
        return m.group(1).replace('\\"', '"') if m else ""
    image = re.search(r'^image:\s*\n\s*src:\s*"([^"]*)"', fm, re.M)
    return {"title": field("title"), "category": field("category"), "image": image.group(1) if image else ""}


_BG = None


def background():
    global _BG
    if _BG is None:
        _BG = _background()
    return _BG.copy()


def _background():
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse([W - 520, -380, W + 260, 360], fill=(13, 92, 99))
    g.ellipse([-320, H - 260, 380, H + 360], fill=(40, 38, 120))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(140)), 0.85)
    grid = ImageDraw.Draw(img, "RGBA")
    for x in range(0, W, 48):
        grid.line([(x, 0), (x, H)], fill=(255, 255, 255, 9))
    for y in range(0, H, 48):
        grid.line([(0, y), (W, y)], fill=(255, 255, 255, 9))
    return img


_AVATAR = {}


def avatar(size):
    if size not in _AVATAR:
        photo = Image.open(PHOTO).convert("RGB")
        face = photo.crop((115, 60, 715, 660)).resize((size * 4, size * 4), Image.LANCZOS)
        mask = Image.new("L", face.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, face.size[0] - 1, face.size[1] - 1], fill=255)
        ring = Image.new("RGBA", (size * 4 + 24, size * 4 + 24), (0, 0, 0, 0))
        ImageDraw.Draw(ring).ellipse([0, 0, ring.size[0] - 1, ring.size[1] - 1], fill=TEAL + (255,))
        ring.paste(face, (12, 12), mask)
        _AVATAR[size] = ring.resize((size + 6, size + 6), Image.LANCZOS)
    return _AVATAR[size]


def wrap(draw, words, fnt, max_w):
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_title(draw, title, max_w, max_lines=3):
    words = title.split()
    for size in (72, 66, 60, 54, 48, 44, 40):
        fnt = heading(size)
        lines = wrap(draw, words, fnt, max_w)
        if len(lines) <= max_lines:
            return fnt, lines, size
    fnt = heading(40)
    lines = wrap(draw, words, fnt, max_w)[:max_lines]
    lines[-1] = lines[-1].rstrip(".,:;") + "…"
    return fnt, lines, 40


def make_card(title, category):
    img = background()
    d = ImageDraw.Draw(img, "RGBA")

    # Top row: wordmark, category chip, domain
    d.text((PAD, 58), "LUCA BERTON", font=text(20, "Bold"), fill=TEAL)
    x = PAD + d.textlength("LUCA BERTON", font=text(20, "Bold")) + 22
    if category:
        label = category.upper()
        cf = text(17, "SemiBold")
        tw = d.textlength(label, font=cf)
        d.rounded_rectangle([x, 52, x + tw + 28, 86], radius=17, outline=(255, 255, 255, 60), width=2, fill=(255, 255, 255, 12))
        d.text((x + 14, 58), label, font=cf, fill=(226, 232, 240))
    dom = "lucaberton.com"
    df = text(20, "Medium")
    d.text((W - PAD - d.textlength(dom, font=df), 58), dom, font=df, fill=MUTED)

    # Title, vertically centred in the middle band
    fnt, lines, size = fit_title(d, title, W - 2 * PAD)
    lh = int(size * 1.08)
    block = lh * len(lines)
    top = 120 + max(0, (300 - block) // 2)
    for i, line in enumerate(lines):
        d.text((PAD, top + i * lh), line, font=fnt, fill=WHITE)
    bar_y = top + block + 18
    for i in range(160):  # teal-to-indigo accent bar
        t = i / 159
        col = tuple(int(a + (b - a) * t) for a, b in zip(TEAL, INDIGO))
        d.line([(PAD + i, bar_y), (PAD + i, bar_y + 5)], fill=col)

    # Author row
    av = avatar(88)
    ay = H - PAD - av.size[1] + 8
    img.paste(av, (PAD, ay), av)
    nx = PAD + av.size[0] + 22
    d.text((nx, ay + 12), "Luca Berton", font=text(28, "Bold"), fill=WHITE)
    d.text((nx, ay + 52), "AI Advisor & Architect · Docker Captain · KubeCon speaker", font=text(20, "Regular"), fill=MUTED)
    return img


def make_card_portrait(title, category):
    """Variant B: large portrait card on the right, title on the left."""
    img = background()
    d = ImageDraw.Draw(img, "RGBA")
    pw, ph = 380, 470
    px, py = W - PAD - pw, (H - ph) // 2 + 10
    photo = Image.open(PHOTO).convert("RGB")
    crop = photo.crop((40, 40, 760, 930)).resize((pw * 2, ph * 2), Image.LANCZOS)
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, crop.size[0] - 1, crop.size[1] - 1], radius=56, fill=255)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([px - 10, py - 10, px + pw + 10, py + ph + 10], radius=36, fill=TEAL + (110,))
    img.paste(glow.filter(ImageFilter.GaussianBlur(22)), (0, 0), glow.filter(ImageFilter.GaussianBlur(22)))
    card = crop.resize((pw, ph), Image.LANCZOS)
    img.paste(card, (px, py), mask.resize((pw, ph), Image.LANCZOS))
    d = ImageDraw.Draw(img, "RGBA")
    d.text((PAD, 58), "LUCA BERTON", font=text(20, "Bold"), fill=TEAL)
    if category:
        x = PAD + d.textlength("LUCA BERTON", font=text(20, "Bold")) + 22
        label, cf = category.upper(), text(17, "SemiBold")
        tw = d.textlength(label, font=cf)
        d.rounded_rectangle([x, 52, x + tw + 28, 86], radius=17, outline=(255, 255, 255, 60), width=2, fill=(255, 255, 255, 12))
        d.text((x + 14, 58), label, font=cf, fill=(226, 232, 240))
    max_w = px - PAD - 48
    words = title.split()
    for size in (64, 58, 52, 46, 42, 38):
        fnt = heading(size)
        lines = wrap(d, words, fnt, max_w)
        if len(lines) <= 4:
            break
    lines = lines[:4]
    lh = int(size * 1.08)
    top = 130 + max(0, (300 - lh * len(lines)) // 2)
    for i, line in enumerate(lines):
        d.text((PAD, top + i * lh), line, font=fnt, fill=WHITE)
    bar_y = top + lh * len(lines) + 18
    for i in range(140):
        t = i / 139
        d.line([(PAD + i, bar_y), (PAD + i, bar_y + 5)], fill=tuple(int(a + (b - a) * t) for a, b in zip(TEAL, INDIGO)))
    d.text((PAD, H - PAD - 44), "Luca Berton", font=text(26, "Bold"), fill=WHITE)
    d.text((PAD, H - PAD - 10), "AI Advisor & Architect · lucaberton.com", font=text(19, "Regular"), fill=MUTED)
    return img


def save(img, path):
    img.save(path, "JPEG", quality=86, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["sample", "all"])
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--out", default=THUMBS)
    args = ap.parse_args()
    if args.mode == "sample":
        os.makedirs(args.out, exist_ok=True)
        for slug in args.slugs:
            fm = frontmatter(os.path.join(BLOG, slug + ".mdx"))
            save(make_card(fm["title"], fm["category"]), os.path.join(args.out, slug + ".jpg"))
            print("wrote", os.path.join(args.out, slug + ".jpg"))
        return
    done = skipped = 0
    for name in sorted(os.listdir(BLOG)):
        if not name.endswith((".md", ".mdx")):
            continue
        fm = frontmatter(os.path.join(BLOG, name))
        if not fm["image"].startswith("/blog/thumbnails/"):
            skipped += 1  # custom photo or book cover: leave alone
            continue
        out = os.path.join(THUMBS, os.path.basename(fm["image"]))
        if not os.path.exists(out):
            skipped += 1
            continue
        save(make_card(fm["title"], fm["category"]), out)
        done += 1
    print(f"regenerated={done} skipped={skipped}")


if __name__ == "__main__":
    sys.exit(main())
