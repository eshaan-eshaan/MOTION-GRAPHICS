"""Fetch a Commons file at a given thumbnail width into a directory (for review / production)."""
import json, sys, os, urllib.parse, urllib.request

UA = "IndianAstronomyEdu/1.0 (educational video research; https://github.com/eshaan-eshaan/MOTION-GRAPHICS)"

def fetch(title, width, dest):
    params = {"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|size", "titles": title}
    if width:
        params["iiurlwidth"] = str(width)
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})))
    ii = next(iter(d["query"]["pages"].values()))["imageinfo"][0]
    src = ii.get("thumburl") if width else ii["url"]
    data = urllib.request.urlopen(urllib.request.Request(src, headers={"User-Agent": UA})).read()
    open(dest, "wb").write(data)
    print(dest, len(data), "bytes from", src)

if __name__ == "__main__":
    fetch(sys.argv[1], int(sys.argv[2]) if sys.argv[2] != "0" else None, sys.argv[3])
