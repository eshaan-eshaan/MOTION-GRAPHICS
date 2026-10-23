"""Download Commons thumbnails listed in a metadata JSON and build a labelled contact sheet."""
import json, sys, os, urllib.request, io
from PIL import Image, ImageDraw

UA = "IndianAstronomyEdu/1.0 (educational video research; https://github.com/eshaan-eshaan/MOTION-GRAPHICS)"
meta = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
tiles = []
for i, (title, r) in enumerate(meta.items()):
    u = r.get("thumburl") or r.get("url")
    if not u or not r.get("mime", "").startswith("image"):
        continue
    try:
        data = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA})).read()
        im = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        print("fail", title, e); continue
    im.thumbnail((480, 360))
    tile = Image.new("RGB", (480, 390), (30, 30, 30))
    tile.paste(im, ((480 - im.width) // 2, (360 - im.height) // 2))
    ImageDraw.Draw(tile).text((6, 366), f"{len(tiles)}: {title[5:70]}", fill=(255, 255, 255))
    tiles.append(tile)
    print(len(tiles) - 1, title)
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 480, rows * 390), (0, 0, 0))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 480, (i // cols) * 390))
sheet.save(out, quality=85)
