#!/usr/bin/env python3
"""Update GameTora support-card metadata, preserving the existing Korean UI.

Source: https://gametora.com/data/manifests/umamusume.json
No card illustrations or event assets are downloaded or redistributed.
"""
import argparse
import json
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

BASE = "https://gametora.com"
DB_PATH = Path("data/support_cards.json")
TYPES = {"speed": "스피드", "stamina": "스태미나", "power": "파워",
         "guts": "근성", "intelligence": "지능", "friend": "친구", "group": "그룹"}
RARITY = {1: "R", 2: "SR", 3: "SSR"}
TITLE_RE = re.compile(r"^\[[^\]]*\]")
HEADERS = {"User-Agent": "UmaSupportTrackerUpdater/1.0", "Accept": "application/json"}


def fetch_json(url):
    with urlopen(Request(url, headers=HEADERS), timeout=45) as response:
        return json.load(response)


def text(value):
    return str(value).strip() if value is not None else ""


def update(raw, previous):
    if not isinstance(raw, list) or len(raw) < 500:
        raise ValueError("Source must contain at least 500 support cards")
    if len(raw) < len(previous):
        raise ValueError("Source card count shrank; old database will be preserved")
    old_by_id = {int(c["id"]): c for c in previous}
    ko_names = {
        TITLE_RE.sub("", text(c.get("nameJa"))): text(c.get("characterKo"))
        for c in previous if c.get("nameJa") and c.get("characterKo")
    }
    result, seen = [], set()
    untrans = 0
    for src in raw:
        if not isinstance(src, dict):
            raise ValueError("Unexpected record format")
        ident = int(src.get("support_id") or src.get("id") or 0)
        if ident <= 0 or ident in seen:
            raise ValueError(f"Invalid/duplicate card ID: {ident}")
        seen.add(ident)
        old = old_by_id.get(ident, {})
        type_raw = text(src.get("type")).lower()
        rarity_raw = src.get("rarity")
        rarity = RARITY.get(int(rarity_raw)) if str(rarity_raw).isdigit() else text(rarity_raw)
        if type_raw not in TYPES or rarity not in RARITY.values():
            raise ValueError(f"Unrecognized type or rarity for ID {ident}")
        title_ja = text(src.get("title_ja")) or text(old.get("titleJa"))
        char_ja = text(src.get("name_jp")) or text(src.get("jpname"))
        if not title_ja or not char_ja:
            raise ValueError(f"Missing Japanese title or character for ID {ident}")
        title_ko = text(src.get("title_ko")) or text(old.get("titleKo")) or title_ja
        char_ko = (text(src.get("name_ko")) or text(old.get("characterKo"))
                   or ko_names.get(char_ja) or char_ja)
        if title_ko == title_ja or char_ko == char_ja:
            untrans += 1
        result.append({
            "id": ident,
            "nameKo": title_ko + char_ko,
            "nameJa": title_ja + char_ja,
            "characterKo": char_ko,
            "titleKo": title_ko,
            "titleJa": title_ja,
            "rarity": rarity,
            "type": TYPES[type_raw],
            "typeRaw": type_raw,
            "urlName": text(src.get("url_name")) or text(old.get("urlName")),
            "release": text(src.get("release")) or text(old.get("release")),
            "releaseKo": text(src.get("release_ko")) or text(old.get("releaseKo")) or None,
            "imageUrl": old.get("imageUrl"),
            "chainEvents": old.get("chainEvents"),
            "randomEvents": old.get("randomEvents")
        })
    if not set(old_by_id).issubset(seen):
        raise ValueError("Existing card IDs missing from source; refusing update")
    result.sort(key=lambda c: c["id"])
    print(f"cards: {len(result)}, newly added: {len(seen-set(old_by_id))}, "
          f"needs Korean title review: {untrans}")
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", type=Path, default=DB_PATH)
    ap.add_argument("--source-file", type=Path, help="Offline test source JSON")
    args = ap.parse_args()
    previous = json.loads(args.db.read_text(encoding="utf-8-sig"))
    if not isinstance(previous, list):
        raise ValueError("Existing support DB is not a list")
    if args.source_file:
        raw = json.loads(args.source_file.read_text(encoding="utf-8-sig"))
    else:
        manifest = fetch_json(BASE + "/data/manifests/umamusume.json")
        digest = manifest.get("support-cards")
        if not isinstance(digest, str) or not re.fullmatch(r"[A-Za-z0-9_-]{6,64}", digest):
            raise ValueError("GameTora manifest does not contain a valid support-cards hash")
        url = f"{BASE}/data/umamusume/support-cards.{digest}.json"
        print("Source:", url)
        raw = fetch_json(url)
    refreshed = update(raw, previous)
    if refreshed == previous:
        print("No changes")
        return
    args.db.write_text(json.dumps(refreshed, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("Database updated")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
