#!/usr/bin/env python3
"""Resolve external support-card thumbnail URLs. Does NOT download artwork."""
import json
import sys
import time
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

DB = Path("data/support_cards.json")
OUTPUT = Path("data/image_sources.json")
API_ENDPOINTS = ["https://umamusu.wiki/api.php", "https://umamusu.wiki/w/api.php"]
HEADERS = {"User-Agent": "UmaSupportTracker/1.0 (GitHub Pages fan utility; image URL metadata only)",
           "Accept": "application/json"}
BATCH = 40


def get_json(url):
    with urlopen(Request(url, headers=HEADERS), timeout=35) as response:
        return json.load(response)


def batch_api(endpoint, titles):
    args = {
        "action": "query", "prop": "imageinfo", "iiprop": "url",
        "iiurlwidth": "180", "format": "json", "formatversion": "2",
        "titles": "|".join(titles), "origin": "*"
    }
    data = get_json(endpoint + "?" + urlencode(args))
    if not isinstance(data, dict) or "query" not in data:
        raise ValueError("Unexpected MediaWiki API response")
    found = {}
    for page in data["query"].get("pages", []):
        if page.get("missing", False):
            continue
        title = str(page.get("title", ""))
        info = page.get("imageinfo") or []
        if not info:
            continue
        url = info[0].get("thumburl") or info[0].get("url")
        if not isinstance(url, str) or urlparse(url).scheme != "https":
            continue
        # Only the wiki's own API-generated image host is recorded.
        ident = title.rsplit("Support Card ", 1)[-1].split(".png", 1)[0]
        if ident.isdigit() and len(ident) == 5:
            found[ident] = url
    return found


def query(ids, suffix):
    last_error = None
    for endpoint in API_ENDPOINTS:
        try:
            result = {}
            for offset in range(0, len(ids), BATCH):
                batch = ids[offset:offset + BATCH]
                titles = [f"File:Support Card {i}{suffix}.png" for i in batch]
                result.update(batch_api(endpoint, titles))
                time.sleep(0.25)
            return result
        except Exception as exc:
            last_error = exc
            print(f"API endpoint failed: {endpoint}: {exc}", file=sys.stderr)
    raise RuntimeError(f"No MediaWiki endpoint accessible: {last_error}")


def main():
    cards = json.loads(DB.read_text(encoding="utf-8"))
    ids = sorted({str(c["id"]) for c in cards if c.get("id")})
    if not ids:
        raise ValueError("No cards in database")
    previous = {}
    if OUTPUT.exists():
        try:
            previous = json.loads(OUTPUT.read_text(encoding="utf-8")).get("images", {})
        except (ValueError, OSError):
            previous = {}
    found = query(ids, "")
    print(f"Full illustrations found: {len(found)}")
    # A smaller wiki card icon is an alternative if the full illustration is absent.
    missing = [i for i in ids if i not in found]
    if missing:
        fallback = query(missing, " Icon")
        found.update(fallback)
        print(f"Icon-only fallback found: {len(fallback)}")
    if len(found) < 20:
        raise ValueError("Too few valid image URLs returned; preserve previous manifest")
    # URLs are metadata only: image bytes are never committed to the repository.
    images = {i: found.get(i) or previous.get(i) for i in ids}
    images = {k: v for k, v in images.items() if v}
    output = {"source": "Umamusume Wiki / MediaWiki imageinfo",
              "imagePolicy": "external URLs only; no images hosted in GitHub",
              "images": images}
    content = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    if OUTPUT.exists() and OUTPUT.read_text(encoding="utf-8") == content:
        print("No changes")
        return
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Recorded external URLs for {len(images)} / {len(ids)} cards")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
