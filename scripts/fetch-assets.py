"""Download licensed Commons images and keep their provenance. Python stdlib only.
Existing files are retained. Use --refresh to redownload. No cropping or recolouring.
"""
import argparse
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images"
ASSETS = {
    "abai.jpg": "File:Abai Kunanbaev.jpg",
    "shokan.jpg": "File:Chokan Valikhanov portrait.jpg",
    "flag.svg": "File:Flag of Kazakhstan.svg",
    "emblem.svg": "File:Emblem of Kazakhstan latin.svg",
    "satpayev.jpg": "File:Kanysh Satpayev from Kazakhstanskaya Pravda 19 May 1949.jpg",
    "craft.jpg": "File:Казахская женщина ткёт.jpg",
    "yurt.jpg": "File:Казахская юрта.jpg",
    "dombra.jpg": "File:Dombra Player (5663178574) (2).jpg",
    "shahtinsk.png": "File:Шахтинск түн 2023.png",
    "dolinka.jpg": "File:Dolinka Museum 1.JPG",
    "karkaraly.jpg": "File:Shaitankol.jpg",
    "archive-oath.jpg": "File:Egemen Archive Nazarbayev Innaugration.jpg",
    "archive-cis.jpg": "File:Egemen Archive Nazarbayev and CIS leaders.jpg",
}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "UlyDalaMuseum/1.1 (https://github.com/UziSQL/VirtualExhibition)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--only", nargs="+", choices=ASSETS)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "credits.json"
    manifest = {item["file"]: item for item in json.loads(manifest_path.read_text(encoding="utf-8"))} if manifest_path.exists() else {}
    chosen = {name: title for name, title in ASSETS.items() if not args.only or name in args.only}
    needed = {name: title for name, title in chosen.items() if args.refresh or name not in manifest or not (OUT / name).exists()}
    if not needed:
        print("All assets already downloaded.")
        return
    params = {"action": "query", "format": "json", "titles": "|".join(needed.values()), "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": 960, "iiurlheight": 1440}
    data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    pages = {page["title"]: page for page in data["query"]["pages"].values()}
    for name, title in needed.items():
        info = pages[title]["imageinfo"][0]
        url = (info["url"] if name.endswith(".svg") else info.get("thumburl", info["url"])).split("?")[0]
        content = get(url)
        if not content:
            raise RuntimeError("Empty image: " + title)
        (OUT / name).write_bytes(content)
        manifest[name] = {"file": name, "page": info["descriptionurl"], "original": info["url"].split("?")[0], "download": url, "width": info.get("thumbwidth", info["width"]), "height": info.get("thumbheight", info["height"]), "changes": "Commons thumbnail; proportionally resized, not cropped" if url != info["url"].split("?")[0] else "Unmodified", "metadata": info["extmetadata"]}
        manifest_path.write_text(json.dumps(list(manifest.values()), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(name, len(content), info["extmetadata"].get("LicenseShortName", {}).get("value"), flush=True)
        time.sleep(1)

if __name__ == "__main__":
    main()
