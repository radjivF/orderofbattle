#!/usr/bin/env python3
"""Extract Age of Sigmar Spearhead catalogues from Wahapedia faction pages.

Attribute: https://wahapedia.ru/aos4/
Unofficial fan data — confirm with official Games Workshop Spearhead cards.
"""

from __future__ import annotations

import html as htmlmod
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "engine" / "data" / "spearhead"
UA = "OrderOfBattle/1.0 (unofficial fan extractor; +https://github.com/radjivF/orderofbattle)"

FACTIONS: list[tuple[str, str]] = [
    ("stormcast-eternals", "stormcast-eternals"),
    ("cities-of-sigmar", "cities-of-sigmar"),
    ("daughters-of-khaine", "daughters-of-khaine"),
    ("fyreslayers", "fyreslayers"),
    ("idoneth-deepkin", "idoneth-deepkin"),
    ("kharadron-overlords", "kharadron-overlords"),
    ("lumineth-realm-lords", "lumineth-realm-lords"),
    ("seraphon", "seraphon"),
    ("sylvaneth", "sylvaneth"),
    ("gloomspite-gitz", "gloomspite-gitz"),
    ("ironjawz", "ironjawz"),
    ("kruleboyz", "kruleboyz"),
    ("ogor-mawtribes", "ogor-mawtribes"),
    ("sons-of-behemat", "sons-of-behemat"),
    ("blades-of-khorne", "blades-of-khorne"),
    ("disciples-of-tzeentch", "disciples-of-tzeentch"),
    ("hedonites-of-slaanesh", "hedonites-of-slaanesh"),
    ("helsmiths-of-hashut", "helsmiths-of-hashut"),
    ("maggotkin-of-nurgle", "maggotkin-of-nurgle"),
    ("skaven", "skaven"),
    ("slaves-to-darkness", "slaves-to-darkness"),
    ("flesh-eater-courts", "flesh-eater-courts"),
    ("nighthaunt", "nighthaunt"),
    ("ossiarch-bonereapers", "ossiarch-bonereapers"),
    ("soulblight-gravelords", "soulblight-gravelords"),
]


def slug(name: str) -> str:
    value = name.lower().replace("’", "'")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "item"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", "replace")


def strip_tags(raw: str) -> str:
    text = re.sub(r"(?i)<br\s*/?>", "\n", raw)
    text = re.sub(r"(?i)</(p|div|li|tr|h[1-6])>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = htmlmod.unescape(text)
    text = text.replace("\xa0", " ").replace("‑", "-").replace("–", "-")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    return text.strip()


def collapse(raw: str) -> str:
    return re.sub(r"\s+", " ", strip_tags(raw)).strip()


def ability(
    name: str,
    timing: str,
    declare: str,
    effect: str,
    kind: str = "",
    keywords: str = "",
) -> dict:
    resolved_kind = kind or ("Passive" if timing.lower().startswith("passive") else "Activated")
    return {
        "name": name,
        "kind": resolved_kind,
        "timing": timing,
        "declare": declare,
        "effect": effect,
        "keywords": keywords,
        "castingValue": "",
        "chantingValue": "",
        "cost": "",
    }


def parse_ab_blocks(section: str) -> list[dict]:
    parts = re.split(r'<td class="abHeader"[^>]*>', section)
    out: list[dict] = []
    for part in parts[1:]:
        timing_html, _, rest = part.partition("</td>")
        timing = collapse(timing_html)
        body_m = re.search(r'class="abBody[^"]*"[^>]*>(.*)', rest, re.S)
        if not body_m:
            continue
        body = body_m.group(1)
        # Truncate at the next ability or section to avoid swallowing siblings.
        cut = re.search(
            r'(?:<td class="abHeader"|<a name="|<h3 |<div class="datasheet)',
            body,
        )
        if cut:
            body = body[: cut.start()]
        name_m = re.search(r"<b>(.*?)</b>", body, re.S)
        name = collapse(re.sub(r'<span class="ShowFluff">:</span>', "", name_m.group(1) if name_m else ""))
        fluff = re.search(r'class="ShowFluff legend4"[^>]*>(.*?)(?:</span>|$)', body, re.S)
        declare_m = re.search(r"<b>Declare:</b>\s*(.*?)(?:<br><br>|<b>Effect:|<b>Used By:|$)", body, re.S)
        used_m = re.search(r"<b>Used By:</b>\s*(.*?)(?:<br><br>|<b>Effect:|$)", body, re.S)
        effect_m = re.search(r"<b>Effect:</b>\s*(.*?)$", body, re.S)
        declare = collapse(declare_m.group(1)) if declare_m else ""
        if used_m and not declare:
            declare = collapse("Used By: " + used_m.group(1))
        elif used_m:
            declare = (declare + " Used By: " + collapse(used_m.group(1))).strip()
        effect = collapse(effect_m.group(1)) if effect_m else collapse(fluff.group(1) if fluff else "")
        if not name:
            continue
        out.append(ability(name, timing, declare, effect))
    return out


def split_h3(block: str, title: str) -> str:
    pattern = rf'<h3 class="h2_pge[^"]*outline_header3">{re.escape(title)}</h3>(.*?)(?=<h3 class="h2_pge|<div class="datasheet|$)'
    match = re.search(pattern, block, re.S | re.I)
    return match.group(1) if match else ""


def parse_roster_items(block: str) -> tuple[str, list[tuple[int, str]]]:
    general = ""
    units: list[tuple[int, str]] = []
    gen_m = re.search(
        r'<div class="hi_custom">General</div>\s*<ul class="Rhombus">(.*?)</ul>',
        block,
        re.S,
    )
    if gen_m:
        items = re.findall(r"<li>(.*?)</li>", gen_m.group(1), re.S)
        if items:
            general = collapse(items[0])
    units_m = re.search(
        r'<div class="hi_custom">Units</div>\s*<ul class="Rhombus">(.*?)</ul>',
        block,
        re.S,
    )
    if units_m:
        for item in re.findall(r"<li>(.*?)</li>", units_m.group(1), re.S):
            label = collapse(item)
            counted = re.match(r"^(\d+)\s+(.+)$", label)
            if counted:
                units.append((int(counted.group(1)), counted.group(2)))
            elif label:
                units.append((1, label))
    return general, units


def parse_keywords(block: str) -> list[str]:
    line = re.search(r'class="wsKeywordLine1[^"]*"[^>]*>(.*?)</td>', block, re.S)
    if not line:
        return []
    text = collapse(line.group(1))
    return [part.strip() for part in text.split(",") if part.strip()]


def parse_weapons(block: str) -> list[dict]:
    weapons: list[dict] = []
    tables = re.findall(r'<table class="wTable"[^>]*>(.*?)</table>', block, re.S)
    for table in tables:
        ranged = "RANGED WEAPONS" in table.upper() or "wsHeaderCellName_RangedWeapons" in table
        kind = "ranged" if ranged else "melee"
        bodies = re.findall(r'<tbody class="bkg">(.*?)</tbody>', table, re.S)
        for body in bodies:
            name_m = re.search(r"<tr class=\"wsDataRow wsDataRow_short\"[^>]*>\s*<td[^>]*>(.*?)</td>", body, re.S)
            name = collapse(re.sub(r"\[.*?\]", "", name_m.group(1) if name_m else ""))
            ability_bits = re.findall(r'class="tt kwbu"[^>]*>(.*?)</span>', name_m.group(1) if name_m else "", re.S)
            ability = ", ".join(collapse(bit) for bit in ability_bits)
            stat_row = re.search(r'<tr class="wsDataRow dsColorFrSE">(.*?)</tr>', body, re.S)
            if not stat_row:
                continue
            cells = re.findall(r"<td[^>]*>(.*?)</td>", stat_row.group(1), re.S)
            values = [collapse(cell) for cell in cells if collapse(cell)]
            # Name is often repeated as a cell; keep trailing combat stats.
            if kind == "ranged":
                # range, atk, hit, wound, rend, damage — name may prefix
                stats = values[-6:] if len(values) >= 6 else values
                while len(stats) < 6:
                    stats.insert(0, "")
                rng, attacks, hit, wound, rend, damage = stats[-6:]
            else:
                stats = values[-5:] if len(values) >= 5 else values
                while len(stats) < 5:
                    stats.insert(0, "")
                rng = ""
                attacks, hit, wound, rend, damage = stats[-5:]
            if not name and values:
                name = values[0]
            if not name:
                continue
            weapons.append(
                {
                    "name": name,
                    "kind": kind,
                    "range": rng,
                    "attacks": attacks,
                    "hit": hit,
                    "wound": wound,
                    "rend": rend,
                    "damage": damage,
                    "ability": ability,
                }
            )
    return weapons


def parse_warscrolls(block: str) -> list[dict]:
    units: list[dict] = []
    sheets = re.split(r'<div class="datasheet pagebreak\s*">', block)[1:]
    seen: set[str] = set()
    for sheet in sheets:
        body_m = re.search(r'<div class="wsBody">(.*)', sheet, re.S)
        target = body_m.group(1) if body_m else sheet
        name_m = re.search(r'<div class="wsHeaderIn">(.*?)</div></div></div>', target, re.S)
        if not name_m:
            name_m = re.search(r'<div class="wsHeaderIn">(.*?)</div>', target, re.S)
        if not name_m:
            continue
        name_html = re.sub(r"<a[^>]*>.*?</a>", "", name_m.group(1), flags=re.S)
        name_html = re.sub(r'<div class="wsAddName">', " ", name_html)
        name = collapse(name_html)
        if not name or name in seen:
            continue
        seen.add(name)
        move = collapse(re.search(r'class="wsMove"[^>]*>(.*?)</div>', sheet, re.S).group(1)) if re.search(r'class="wsMove"', sheet) else ""
        health = collapse(re.search(r'class="wsWounds"[^>]*>(.*?)</div>', sheet, re.S).group(1)) if re.search(r'class="wsWounds"', sheet) else ""
        save = collapse(re.search(r'class="wsSave"[^>]*>(.*?)</div>', sheet, re.S).group(1)) if re.search(r'class="wsSave"', sheet) else ""
        control = collapse(re.search(r'class="wsBravery"[^>]*>(.*?)</div>', sheet, re.S).group(1)) if re.search(r'class="wsBravery"', sheet) else ""
        keywords = parse_keywords(target)
        upper = {item.upper() for item in keywords}
        units.append(
            {
                "name": name,
                "stats": {
                    "move": move,
                    "health": health,
                    "save": save,
                    "control": control,
                },
                "weapons": parse_weapons(target),
                "abilities": parse_ab_blocks(target),
                "categories": keywords,
                "hero": "HERO" in upper,
                "unique": "UNIQUE" in upper,
                "reinforce": "REINFORCEMENTS" in upper or "REINFORCEMENT" in upper,
            }
        )
    return units


def norm_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().replace("'", ""))


def match_unit(name: str, units: list[dict]) -> dict | None:
    target = norm_name(name)
    for unit in units:
        if norm_name(unit["name"]) == target:
            return unit
    for unit in units:
        other = norm_name(unit["name"])
        if target in other or other in target:
            return unit
    return None


def to_camel(value: str) -> str:
    parts = [part for part in value.split("-") if part]
    if not parts:
        return "spearhead"
    first, *rest = parts
    return first + "".join(part[:1].upper() + part[1:] if part else "" for part in rest)


def extract_boxes(parent_id: str, page: str) -> list[dict]:
    start = page.find('name="SPEARHEAD"')
    if start < 0:
        return []
    section = page[start:]
    chunks = re.split(r'<a name="([^"]+)"></a><h2 class="outline_header">', section)
    boxes: list[dict] = []
    # chunks: [preamble, name1, html1, name2, html2, ...]
    for index in range(1, len(chunks) - 1, 2):
        raw_title = chunks[index + 1]
        title_html, _, body = raw_title.partition("</h2>")
        title = collapse(re.sub(r"<img[^>]*>", "", title_html))
        if title.upper() == "SPEARHEAD" or "This Spearhead army consists" not in body:
            continue
        block = body
        next_h2 = re.search(r'<a name="[^"]+"></a><h2 class="outline_header">', block)
        if next_h2:
            block = block[: next_h2.start()]
        general_name, unit_lines = parse_roster_items(block)
        warscrolls = parse_warscrolls(block)
        trait_html = split_h3(block, "Battle Traits")
        regiment_html = split_h3(block, "Regiment Abilities")
        enhance_html = split_h3(block, "Enhancements")
        trait_name_m = re.search(r'class="h_custom"[^>]*>(.*?)</div>', trait_html, re.S)
        trait_name = collapse(trait_name_m.group(1)) if trait_name_m else "Battle Traits"
        box_slug = f"{parent_id}-{slug(title)}"
        battle_abilities = parse_ab_blocks(trait_html)
        regiment_abilities = parse_ab_blocks(regiment_html)
        enhancements = parse_ab_blocks(enhance_html)

        used: dict[str, dict] = {}
        catalogue_units: list[dict] = []
        roster: list[dict] = []

        def add_entry(label: str, models: int, general: bool) -> None:
            scroll = match_unit(label, warscrolls)
            unit_name = scroll["name"] if scroll else label
            unit_id = f"{box_slug}-{slug(unit_name)}"
            if unit_id not in used:
                cats = list(scroll["categories"]) if scroll else (["HERO"] if general else [])
                catalogue_units.append(
                    {
                        "id": unit_id,
                        "name": unit_name,
                        "points": 0,
                        "hero": bool(scroll["hero"]) if scroll else general,
                        "unique": bool(scroll["unique"]) if scroll else False,
                        "reinforce": bool(scroll["reinforce"]) if scroll else False,
                        "models": models,
                        "categories": cats,
                        "stats": scroll["stats"] if scroll else {
                            "move": "",
                            "health": "",
                            "save": "",
                            "control": "",
                        },
                        "weapons": scroll["weapons"] if scroll else [],
                        "abilities": scroll["abilities"] if scroll else [],
                        "regimentOptions": [],
                        "regimentHeroes": [],
                    }
                )
                used[unit_id] = catalogue_units[-1]
            else:
                # Same warscroll again (e.g. two Vanquishers units): keep max models.
                used[unit_id]["models"] = max(used[unit_id]["models"], models)
            entry: dict = {"unitId": unit_id, "count": 1}
            if general:
                entry["general"] = True
            roster.append(entry)

        if general_name:
            add_entry(general_name, 1, True)
        for models, label in unit_lines:
            add_entry(label, models, False)

        # Include unmatched warscrolls so Play still has the sheet.
        for scroll in warscrolls:
            unit_id = f"{box_slug}-{slug(scroll['name'])}"
            if unit_id in used:
                continue
            catalogue_units.append(
                {
                    "id": unit_id,
                    "name": scroll["name"],
                    "points": 0,
                    "hero": scroll["hero"],
                    "unique": scroll["unique"],
                    "reinforce": scroll["reinforce"],
                    "models": 1,
                    "categories": scroll["categories"],
                    "stats": scroll["stats"],
                    "weapons": scroll["weapons"],
                    "abilities": scroll["abilities"],
                    "regimentOptions": [],
                    "regimentHeroes": [],
                }
            )

        boxes.append(
            {
                "id": box_slug,
                "name": title,
                "parentFactionId": parent_id,
                "game": "Age of Sigmar Spearhead",
                "source": f"https://wahapedia.ru/aos4/factions/{parent_id}/",
                "roster": roster,
                "battleTraits": [
                    {
                        "id": f"{box_slug}-{slug(trait_name)}",
                        "name": trait_name,
                        "abilities": battle_abilities,
                    }
                ]
                if battle_abilities
                else [],
                "regimentAbilities": [
                    {
                        "id": f"{box_slug}-{slug(item['name'])}",
                        "name": item["name"],
                        "abilities": [item],
                    }
                    for item in regiment_abilities
                ],
                "enhancements": [
                    {
                        "id": f"{box_slug}-{slug(item['name'])}",
                        "name": item["name"],
                        "abilities": [item],
                    }
                    for item in enhancements
                ],
                "units": catalogue_units,
            }
        )
    return boxes


def write_manifest(files: list[str]) -> None:
    imports: list[str] = []
    names: list[str] = []
    for file_name in files:
        stem = file_name.replace(".json", "")
        ident = to_camel(stem)
        imports.append(f'import {ident} from "./{file_name}";')
        names.append(ident)
    body = "\n".join(imports)
    array = ",\n  ".join(names)
    (OUT_DIR / "manifest.ts").write_text(
        f"""import type {{ SpearheadCatalogue }} from \"../../types\";\n{body}\n\nexport const spearheads = [\n  {array},\n] as SpearheadCatalogue[];\n""",
        encoding="utf-8",
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    total_boxes = 0
    for parent_id, slug_name in FACTIONS:
        url = f"https://wahapedia.ru/aos4/factions/{slug_name}/"
        print(f"fetch {parent_id} …", flush=True)
        try:
            page = fetch(url)
        except Exception as error:  # noqa: BLE001
            print(f"  FAIL {error}")
            continue
        boxes = extract_boxes(parent_id, page)
        print(f"  {len(boxes)} spearhead(s)")
        for box in boxes:
            file_name = f"{box['id']}.json"
            (OUT_DIR / file_name).write_text(
                json.dumps(box, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            written.append(file_name)
            total_boxes += 1
    written.sort()
    write_manifest(written)
    print(f"wrote {total_boxes} catalogues to {OUT_DIR}")


if __name__ == "__main__":
    main()
