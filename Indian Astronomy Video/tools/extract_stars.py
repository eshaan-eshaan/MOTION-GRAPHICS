"""Extract the star subsets used by the sky charts from the Yale Bright Star Catalog (BSC5).

Writes src/data/stars.json:
  polar  : [ra_deg, dec_deg, vmag, hr] for dec > -45, V < 5.3   (opening polar chart)
  taurus : [ra_deg, dec_deg, vmag, hr] for the Taurus-Orion field (Observe chart)
Run: python -I tools/extract_stars.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
cat = json.loads((ROOT / "assets-src" / "raw" / "catalog" / "bsc5-short.json").read_text(encoding="utf-8"))


def ra_deg(s):
    h, m, sec = [float(x) for x in re.findall(r"[\d.]+", s)]
    return 15 * (h + m / 60 + sec / 3600)


def dec_deg(s):
    sign = -1 if s.strip().startswith("-") else 1
    d, m, sec = [float(x) for x in re.findall(r"[\d.]+", s)]
    return sign * (d + m / 60 + sec / 3600)


stars = []
for r in cat:
    try:
        stars.append([round(ra_deg(r["RA"]), 3), round(dec_deg(r["Dec"]), 3), float(r["V"]), int(r["HR"])])
    except (KeyError, ValueError):
        pass

polar = [s for s in stars if s[1] > -45 and s[2] < 5.3]
taurus = [s for s in stars if 44 <= s[0] <= 100 and -14 <= s[1] <= 34 and s[2] < 5.6]
out = {"_source": "Yale Bright Star Catalog, 5th rev. (Hoffleit & Warren), via github.com/brettonw/YaleBrightStarCatalog; J2000",
       "polar": polar, "taurus": taurus}
(ROOT / "src" / "data" / "stars.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
print("polar", len(polar), "taurus", len(taurus))
named = {1457: "Aldebaran", 2061: "Betelgeuse", 1713: "Rigel", 1790: "Bellatrix", 1903: "Alnilam", 1948: "Alnitak",
         1852: "Mintaka", 2004: "Saiph", 1879: "Meissa", 1165: "Alcyone", 1791: "Elnath", 1708: "Capella", 424: "Polaris"}
for s in stars:
    if s[3] in named:
        print(named[s[3]], s)
