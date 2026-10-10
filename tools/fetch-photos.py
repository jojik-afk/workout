#!/usr/bin/env python3
"""Download the photos listed in js/data/photoMap.js from free-exercise-db,
resize them to 400 px wide WebP and store them in assets/photos/.

Usage (from the repo root):  python3 -I tools/fetch-photos.py
Needs Pillow (python-pillow). Downloads go to a temporary directory first.
"""
import io
import pathlib
import re
import sys
import tempfile
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAP = ROOT / 'js' / 'data' / 'photoMap.js'
OUT = ROOT / 'assets' / 'photos'
BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
WIDTH = 400

entry = re.compile(r"^\s*'?([a-z0-9-]+)'?\s*:\s*'([A-Za-z0-9_\-]+)',?\s*$", re.M)
block = MAP.read_text().split('export const SOURCES = {', 1)[1].split('};', 1)[0]
sources = dict(entry.findall(block))
if not sources:
    sys.exit('No entries found in photoMap.js')

OUT.mkdir(parents=True, exist_ok=True)
wanted = set()
with tempfile.TemporaryDirectory() as tmp:
    for ours, theirs in sources.items():
        for i in (0, 1):
            dest = OUT / f'{ours}-{i}.webp'
            wanted.add(dest.name)
            if dest.exists():
                continue
            url = f'{BASE}{theirs}/{i}.jpg'
            raw = pathlib.Path(tmp) / f'{ours}-{i}.jpg'
            with urllib.request.urlopen(url, timeout=30) as r:
                raw.write_bytes(r.read())
            with Image.open(raw) as im:
                im.verify()  # reject anything that is not a valid image
            with Image.open(raw) as im:
                im = im.convert('RGB')
                h = round(im.height * WIDTH / im.width)
                im.resize((WIDTH, h), Image.LANCZOS).save(dest, 'WEBP', quality=72, method=6)
            print(f'{dest.name}  ({dest.stat().st_size // 1024} kB)')

for f in OUT.glob('*.webp'):
    if f.name not in wanted:
        f.unlink()
        print(f'removed {f.name}')
print(f'{len(wanted)} photos in {OUT.relative_to(ROOT)}')
