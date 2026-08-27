#!/usr/bin/env python3
"""Extract Stormcast list-building data from BSData catalogues.

Attribute: https://github.com/BSData/age-of-sigmar-4th
Does not copy ability or rule text — names, costs, and categories only.
"""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path

NS_STRIP = True
REGIMENTAL_OPTION = "db3a-7199-c92e-f3cf"
REINFORCED_ID = "1b37-82b8-c062-eb82"

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "aos4"
OUT = ROOT / "src" / "engine" / "data" / "stormcast.json"


def local(tag: str) -> str:
    return tag.split("}")[-1]


def parse(path: Path) -> ET.Element:
    return ET.parse(path).getroot()


def index_names(*roots: ET.Element) -> dict[str, str]:
    names: dict[str, str] = {}
    for root in roots:
        for el in root.iter():
            el_id = el.attrib.get("id")
            name = el.attrib.get("name")
            if el_id and name:
                names[el_id] = name
    return names


def index_entry_targets(root: ET.Element) -> dict[str, str]:
    targets: dict[str, str] = {}
    for el in root.iter():
        if local(el.tag) == "entryLink" and el.attrib.get("id") and el.attrib.get(
            "targetId"
        ):
            targets[el.attrib["id"]] = el.attrib["targetId"]
    return targets


def child(el: ET.Element, tag: str) -> ET.Element | None:
    for c in el:
        if local(c.tag) == tag:
            return c
    return None


def children(el: ET.Element, tag: str) -> list[ET.Element]:
    return [c for c in el if local(c.tag) == tag]


def nested(el: ET.Element, *tags: str) -> list[ET.Element]:
    current = [el]
    for tag in tags:
        nxt: list[ET.Element] = []
        for node in current:
            nxt.extend(children(node, tag))
        current = nxt
    return current


def unit_categories(entry: ET.Element) -> list[str]:
    cats: list[str] = []
    links = child(entry, "categoryLinks")
    if links is None:
        return cats
    for link in children(links, "categoryLink"):
        name = link.attrib.get("name")
        if name:
            cats.append(name)
    return cats


def main() -> None:
    gst = parse(DATA / "Age of Sigmar 4.0.gst")
    cat = parse(DATA / "Stormcast Eternals.cat")
    lib = parse(DATA / "Stormcast Eternals - Library.cat")
    names = index_names(gst, cat, lib)
    link_targets = index_entry_targets(cat)

    library_units: dict[str, ET.Element] = {}
    for el in lib.iter():
        if local(el.tag) == "selectionEntry" and el.attrib.get("type") == "unit":
            library_units[el.attrib["id"]] = el

    formations: list[dict[str, str]] = []
    for el in cat.iter():
        if local(el.tag) == "selectionEntryGroup" and el.attrib.get(
            "name"
        ) == "Battle Formations: Stormcast Eternals":
            for entry in nested(el, "selectionEntries", "selectionEntry"):
                formations.append(
                    {
                        "id": entry.attrib["id"],
                        "name": entry.attrib["name"],
                    }
                )

    units: list[dict] = []
    seen: set[str] = set()

    for el in cat.iter():
        if local(el.tag) != "entryLink":
            continue
        if el.attrib.get("type") != "selectionEntry":
            continue
        target = el.attrib.get("targetId")
        if target not in library_units:
            continue
        if el.attrib.get("hidden") == "true":
            continue
        if target in seen:
            continue
        seen.add(target)

        lib_entry = library_units[target]
        name = el.attrib.get("name") or lib_entry.attrib.get("name") or ""
        cats = unit_categories(lib_entry)
        extra = child(el, "categoryLinks")
        if extra is not None:
            for link in children(extra, "categoryLink"):
                n = link.attrib.get("name")
                if n and n not in cats:
                    cats.append(n)

        points = 0
        costs = child(el, "costs")
        if costs is not None:
            for cost in children(costs, "cost"):
                if cost.attrib.get("name") == "pts":
                    points = int(float(cost.attrib.get("value") or "0"))

        reinforce = False
        links = child(el, "entryLinks")
        if links is not None:
            for link in children(links, "entryLink"):
                if link.attrib.get("targetId") == REINFORCED_ID or link.attrib.get(
                    "name"
                ) == "Reinforced":
                    reinforce = True

        options: list[dict] = []
        option_keys: set[str] = set()
        for modifier in el.iter():
            if local(modifier.tag) != "modifier":
                continue
            if modifier.attrib.get("field") != "category":
                continue
            if modifier.attrib.get("value") != REGIMENTAL_OPTION:
                continue
            affects = modifier.attrib.get("affects") or ""
            token = ""
            if "recursive." in affects:
                token = affects.split("recursive.")[-1]
            elif affects:
                continue
            else:
                continue
            label = names.get(token, token)
            key = f"{token}:{label}"
            if key in option_keys:
                continue
            option_keys.add(key)
            unit_id = token if token in library_units else link_targets.get(token)
            if unit_id and unit_id in library_units:
                options.append(
                    {
                        "type": "unit",
                        "id": unit_id,
                        "name": names.get(unit_id, label),
                    }
                )
            else:
                options.append({"type": "category", "id": token, "name": label})

        if points <= 0:
            continue

        units.append(
            {
                "id": target,
                "name": name,
                "points": points,
                "hero": "HERO" in cats,
                "unique": "UNIQUE" in cats,
                "reinforce": reinforce,
                "categories": cats,
                "regimentOptions": options,
            }
        )

    units.sort(key=lambda u: (not u["hero"], u["name"]))

    payload = {
        "id": "stormcast-eternals",
        "name": "Stormcast Eternals",
        "game": "Age of Sigmar 4th",
        "source": "https://github.com/BSData/age-of-sigmar-4th",
        "pointsCapDefault": 2000,
        "formations": formations,
        "units": units,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {OUT} ({len(units)} units, {len(formations)} formations)")


if __name__ == "__main__":
    main()
