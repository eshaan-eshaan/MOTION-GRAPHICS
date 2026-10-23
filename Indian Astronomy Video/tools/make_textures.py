"""Generate the film's procedural textures.

- public/img/paper-grain.png : warm paper fibre/grain overlay (RGBA, used at low opacity)
- public/img/moon-ink-2k.png : an "ink drawing" of the Moon derived from the NASA LRO colour
  map — maria outlines plus stippled shading — in the same equirectangular layout, so the
  drawn lunar diagram and the photoreal globe line up exactly on the sphere.
Run: python -I tools/make_textures.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "img"
rng = np.random.default_rng(23)


def norm(a):
    a = a - a.min()
    return a / max(a.max(), 1e-9)


def value_noise(h, w, cell):
    gh, gw = h // cell + 2, w // cell + 2
    g = rng.random((gh, gw))
    return np.array(Image.fromarray((g * 255).astype(np.uint8)).resize((w + cell, h + cell), Image.BICUBIC),
                    dtype=np.float32)[:h, :w] / 255.0


def paper(w=1920, h=1080):
    mottle = 0.5 * value_noise(h, w, 240) + 0.3 * value_noise(h, w, 90) + 0.2 * value_noise(h, w, 30)
    grain = ndi.gaussian_filter(rng.normal(0, 1, (h, w)).astype(np.float32), 0.6)
    fibres = np.zeros((h, w), np.float32)
    for _ in range(900):  # short, faint fibres
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        ang, length = rng.uniform(0, np.pi), rng.uniform(8, 40)
        for s in np.linspace(0, length, int(length)):
            xi, yi = int(x + s * np.cos(ang)), int(y + s * np.sin(ang))
            if 0 <= xi < w and 0 <= yi < h:
                fibres[yi, xi] += 1
    fibres = ndi.gaussian_filter(fibres, 0.5)
    density = 0.22 * norm(mottle) + 0.45 * norm(grain) + 0.7 * np.clip(fibres, 0, 1)
    alpha = np.clip((density - 0.3) * 0.42, 0, 1)
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 96, 66, 38  # warm umber
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT / "paper-grain.png", optimize=True)
    print("paper-grain.png", rgba.shape)


def moon_ink():
    src = Image.open(OUT / "moon-lroc-2k.jpg").convert("L")
    L = np.asarray(src, np.float32) / 255.0
    h, w = L.shape
    smooth = ndi.gaussian_filter(L, 2.2)
    maria = smooth < np.percentile(smooth, 22)
    maria = ndi.binary_opening(maria, iterations=2)
    maria = ndi.binary_closing(maria, iterations=2)
    edge = maria ^ ndi.binary_erosion(maria, iterations=2)
    # crater rims / rays: strong local brightness detail
    detail = L - ndi.gaussian_filter(L, 3.0)
    rims = detail > np.percentile(detail, 97.2)
    # stipple: darker ground -> more dots
    dark = np.clip((0.62 - smooth) / 0.3, 0, 1)
    stipple = rng.random((h, w)) < dark * 0.20
    ink = np.zeros((h, w), np.float32)
    ink = np.maximum(ink, edge * 1.0)
    ink = np.maximum(ink, rims * 0.55)
    ink = np.maximum(ink, stipple * 0.6)
    ink = ndi.gaussian_filter(ink, 0.45)
    img = (255 - np.clip(ink * 1.15, 0, 1) * 255).astype(np.uint8)  # 255 = paper, 0 = ink
    Image.fromarray(img, "L").save(OUT / "moon-ink-2k.png", optimize=True)
    print("moon-ink-2k.png", img.shape)


if __name__ == "__main__":
    paper()
    moon_ink()
