#!/usr/bin/env python3
"""Fill Anvil option rule text from hidden BSData <rule> descriptions."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "engine" / "data"
BSDATA = "https://raw.githubusercontent.com/BSData/age-of-sigmar-4th/main"


def local(tag: str) -> str:
    return tag.split("}")[-1]


def child(el: ET.Element, tag: str) -> ET.Element | None:
    for item in el:
        if local(item.tag) == tag:
            return item
    return None


def children(el: ET.Element, tag: str) -> list[ET.Element]:
    return [item for item in el if local(item.tag) == tag]


def named(el: ET.Element) -> str:
    return (el.attrib.get("name") or "").strip()


def clean_rules_text(value: str) -> str:
    text = " ".join(value.split())
    text = re.sub(r"\*\*\^\^([^*]+)\^\^\*\*", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\^\^([^^]+)\^\^", r"\1", text)
    return text.strip()


def option_rule_abilities(entry: ET.Element) -> list[dict]:
    rules_el = child(entry, "rules")
    if rules_el is None:
        return []
    abilities: list[dict] = []
    seen: set[str] = set()
    for rule in children(rules_el, "rule"):
        name = named(rule)
        desc_el = child(rule, "description")
        text = (
            clean_rules_text("".join(desc_el.itertext()))
            if desc_el is not None
            else ""
        )
        if not name or not text or name in seen:
            continue
        seen.add(name)
        abilities.append(
            {
                "name": name,
                "kind": "Passive",
                "timing": "",
                "declare": "",
                "effect": text,
                "keywords": "",
                "castingValue": "",
                "chantingValue": "",
                "cost": "",
            }
        )
    return abilities


def fetch_library(faction_name: str) -> ET.Element | None:
    file_name = f"{faction_name} - Library.cat"
    url = f"{BSDATA}/{urllib.parse.quote(file_name)}"
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return ET.fromstring(response.read())
    except Exception as error:
        print(f"skip {faction_name}: {error}")
        return None


def index_entries(root: ET.Element) -> dict[str, ET.Element]:
    by_id: dict[str, ET.Element] = {}
    for el in root.iter():
        if local(el.tag) != "selectionEntry":
            continue
        oid = el.attrib.get("id")
        if oid and oid not in by_id:
            by_id[oid] = el
    return by_id


def fill_faction(path: Path) -> int:
    payload = json.loads(path.read_text())
    if not isinstance(payload, dict):
        return 0
    units = [
        unit
        for unit in payload.get("units", [])
        if unit.get("anvilForge")
    ]
    if not units:
        return 0
    root = fetch_library(payload["name"])
    if root is None:
        return 0
    by_id = index_entries(root)
    added = 0
    for unit in units:
        for group in unit.get("anvilForge") or []:
            for option in group.get("options") or []:
                entry = by_id.get(option.get("id") or "")
                if entry is None:
                    continue
                extras = option_rule_abilities(entry)
                if not extras:
                    continue
                abilities = option.get("abilities") or []
                seen = {item.get("name") for item in abilities}
                for extra in extras:
                    if extra["name"] in seen:
                        continue
                    abilities.append(extra)
                    seen.add(extra["name"])
                    added += 1
                option["abilities"] = abilities
    if added:
        path.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"{payload['name']}: +{added} option rules")
    return added


def main() -> None:
    total = 0
    for path in sorted(OUT_DIR.glob("*.json")):
        if path.stem == "regiments-of-renown":
            continue
        total += fill_faction(path)
    print(f"added {total} Anvil option rules")


if __name__ == "__main__":
    main()
