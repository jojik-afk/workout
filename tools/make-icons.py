#!/usr/bin/env python3
"""Generate the app icons (countdown ring + six-pack) into assets/icons/.

Usage (from the repo root):  python3 -I tools/make-icons.py   (needs Pillow)
"""
import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'icons'
BG = (11, 13, 16, 255)
ACCENT = (255, 90, 31, 255)
S = 1024  # draw large, downscale for anti-aliasing


def draw(scale, rounded):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, S, S], fill=BG)
    c = S / 2
    k = scale * S  # content scale

    # Countdown ring: 300° arc with round caps, starting at 12 o'clock.
    r = 0.36 * k
    w = 0.085 * k
    box = [c - r, c - r, c + r, c + r]
    start, end = -90, 210
    d.arc(box, start, end, fill=ACCENT, width=int(w))
    import math
    for a in (start, end):
        rr = r - w / 2
        x = c + rr * math.cos(math.radians(a))
        y = c + rr * math.sin(math.radians(a))
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=ACCENT)

    # Six-pack: 2 × 3 rounded blocks.
    bw, bh, gap = 0.115 * k, 0.085 * k, 0.03 * k
    total_h = 3 * bh + 2 * gap
    for row in range(3):
        for col in range(2):
            x0 = c - gap / 2 - bw if col == 0 else c + gap / 2
            y0 = c - total_h / 2 + row * (bh + gap)
            d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=int(bh * 0.35), fill=ACCENT)
    return im


def save(im, name, size):
    im.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
    print(name)


OUT.mkdir(parents=True, exist_ok=True)
any_icon = draw(1.0, rounded=True)
maskable = draw(0.78, rounded=False)  # keep content inside the 80 % safe zone
save(any_icon, 'icon-192.png', 192)
save(any_icon, 'icon-512.png', 512)
save(maskable, 'maskable-192.png', 192)
save(maskable, 'maskable-512.png', 512)
save(maskable, 'apple-touch-icon.png', 180)
