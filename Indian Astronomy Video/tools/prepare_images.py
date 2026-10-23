"""Resize/crop downloaded source imagery into render-ready files in public/img.

Sources live in assets-src/raw (see docs/ASSET_MANIFEST.md for provenance). Nothing is
retouched beyond resizing, cropping and format conversion.
Run: python -I tools/prepare_images.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / "assets-src" / "raw", ROOT / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)


def save(im, name, q=90):
    im.convert("RGB").save(OUT / name, quality=q, optimize=True, progressive=True)
    print(name, im.size)


def fit_width(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


# Jantar Mantar: wide Samrat Yantra (CC0) kept wide for a lateral move; quadrant close-up (CC BY-SA 4.0).
save(fit_width(Image.open(RAW / "jm-samrat-wide.jpg"), 3400), "jm-samrat-wide.jpg")
save(fit_width(Image.open(RAW / "jm-quadrant.jpg"), 2880), "jm-quadrant.jpg")
# Aryabhata statue at IUCAA, Pune (artistic representation).
save(Image.open(RAW / "aryabhata-statue-iucaa.jpg"), "aryabhata-statue-iucaa.jpg", 92)
# Chandrayaan-3 (ISRO, GODL-India): native resolution, format conversion only.
for src, dst in [("c3-vikram-navcam-1104.webp", "c3-vikram-navcam-1104.jpg"),
                 ("c3-vikram-navcam-0735.jpg", "c3-vikram-navcam-0735.jpg"),
                 ("c3-pragyan-ramp.webp", "c3-pragyan-ramp.jpg")]:
    save(Image.open(RAW / src), dst, 94)
# NASA SVS CGI Moon Kit colour map (equirectangular) for the globe visualisation.
moon = Image.open(RAW / "nasa" / "lroc_color_poles_4k.tif")
save(moon.resize((2048, 1024), Image.LANCZOS), "moon-lroc-2k.jpg", 92)
