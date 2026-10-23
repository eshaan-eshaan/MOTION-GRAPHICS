"""Query Wikimedia Commons for file metadata (license, author, size, URL)."""
import json, sys, urllib.parse, urllib.request

UA = "IndianAstronomyEdu/1.0 (educational video research; https://github.com/eshaan-eshaan/MOTION-GRAPHICS)"

def info(titles, thumb=None):
    params = {
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url|size|extmetadata|mime|mediatype",
        "titles": "|".join(titles),
    }
    if thumb:
        params["iiurlwidth"] = str(thumb)
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return json.load(urllib.request.urlopen(req))

if __name__ == "__main__":
    titles = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
    out = {}
    for i in range(0, len(titles), 20):
        d = info(titles[i:i+20], thumb=int(sys.argv[2]) if len(sys.argv) > 2 else None)
        for p in d["query"]["pages"].values():
            if "imageinfo" not in p:
                print("MISSING", p.get("title")); continue
            ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
            g = lambda k: (m.get(k, {}) or {}).get("value", "")
            rec = dict(title=p["title"], w=ii.get("width"), h=ii.get("height"), mime=ii.get("mime"),
                       duration=ii.get("duration"), url=ii.get("url"), thumburl=ii.get("thumburl"),
                       descurl=ii.get("descriptionurl"), license=g("LicenseShortName"), licenseurl=g("LicenseUrl"),
                       artist=g("Artist"), credit=g("Credit"), date=g("DateTimeOriginal"), desc=g("ImageDescription")[:400],
                       attribution_required=g("AttributionRequired"), usage=g("UsageTerms"))
            out[p["title"]] = rec
            print(json.dumps(rec, ensure_ascii=False)); print()
    json.dump(out, open(sys.argv[1] + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
