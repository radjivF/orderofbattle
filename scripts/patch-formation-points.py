#!/usr/bin/env python3
"""Patch formation points in faction JSON from BSData catalogues."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "engine" / "data"
BSDATA = "https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main"


def local(tag: str) -> str:
    return tag.split("}")[-1]


def entry_points(entry: ET.Element | None) -> int:
    if entry is None:
        return 0
    for el in entry:
        if local(el.tag) != "costs":
            continue
        for cost in el:
            if local(cost.tag) != "cost":
                continue
            if cost.attrib.get("name") != "pts":
                continue
            try:
                return int(float(cost.attrib.get("value") or "0"))
            except ValueError:
                return 0
    return 0


def index_entries(root: ET.Element) -> dict[str, ET.Element]:
    by_id: dict[str, ET.Element] = {}
    for el in root.iter():
        if local(el.tag) != "selectionEntry":
            continue
        el_id = el.attrib.get("id")
        if el_id:
            by_id[el_id] = el
    return by_id


def fetch_cat(
    faction_id: str,
    display_name: str,
    parent_ids: list[str] | None,
) -> ET.Element | None:
    if parent_ids:
        parent = parent_ids[0].replace("-", " ").title().replace(" Of ", " of ")
        cat_name = f"{parent} - {display_name}"
    else:
        cat_name = display_name
    url = f"{BSDATA}/{urllib.parse.quote(cat_name)}.cat"
    try:
        with urllib.request.urlopen(url, timeout=60) as resp:
            return ET.fromstring(resp.read())
    except Exception as exc:  # noqa: BLE001
        print(f"skip {faction_id}: {exc}")
        return None


def main() -> None:
    patched = 0
    for path in sorted(OUT_DIR.glob("*.json")):
        if path.stem in ("regiments-of-renown", "battle-tactics"):
            continue
        payload = json.loads(path.read_text())
        formations = payload.get("formations") or []
        if not formations:
            continue

        root = fetch_cat(
            payload["id"],
            payload.get("name") or payload["id"],
            payload.get("parentFactionIds"),
        )
        if root is None:
            continue
        by_id = index_entries(root)

        changed = False
        for formation in formations:
            entry = by_id.get(formation["id"])
            pts = entry_points(entry)
            if pts > 0:
                if formation.get("points") != pts:
                    formation["points"] = pts
                    changed = True
                    patched += 1
            elif "points" in formation:
                del formation["points"]
                changed = True

        if changed:
            path.write_text(json.dumps(payload, indent=2) + "\n")
            print(f"updated {path.name}")

    print(f"patched {patched} formations with points")


if __name__ == "__main__":
    main()
