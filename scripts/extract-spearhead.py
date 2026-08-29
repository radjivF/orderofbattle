#!/usr/bin/env python3
"""Extract Age of Sigmar Spearhead catalogues from Wahapedia faction pages.

Attribute: https://wahapedia.ru/aos4/
Unofficial fan data — confirm with official Games Workshop Spearhead cards.
"""

from __future__ import annotations

import html as htmlmod
import json
import re
import sys
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


# Core / command / example-prayer names Wahapedia appends after a Spearhead sheet.
LEAKED_WARSCROLL_NAMES = {
    "ward save",
    "normal move",
    "run",
    "retreat",
    "charge",
    "shoot",
    "fight",
    "unbind",
    "banish manifestation",
    "fly",
    "mystic shield",
    "sacred rites",
    "resurrection",
    "deploy faction terrain",
    "champion",
    "rally",
    "redeploy",
    "at the double",
    "covering fire",
    "all-out attack",
    "all-out defence",
    "counter-charge",
    "forward to victory",
    "power through",
    "magical intervention",
}


def scrub_rules_text(text: str) -> str:
    """Drop warscroll keyword footers and ad scripts that trail ability text."""
    text = re.split(r"(?i)KEYWORDS", text, maxsplit=1)[0]
    text = re.split(r"(?i)Universal Core Abilities", text, maxsplit=1)[0]
    text = re.split(r"(?i)keyword is used in the following", text, maxsplit=1)[0]
    text = re.split(r"ezstandalone\.", text, maxsplit=1)[0]
    return text.strip()


def trim_warscroll_body(target: str) -> str:
    """Stop at keywords / the next page section so core-rules HTML is not scraped."""
    cut = re.search(
        r'class="wsKeywordLine|<h3 class="|<a name="|Universal Core Abilities|<div class="datasheet',
        target,
    )
    return target[: cut.start()] if cut else target


def is_leaked_warscroll_name(name: str) -> bool:
    return name.strip().lower() in LEAKED_WARSCROLL_NAMES


def pack_ability_names(box: dict) -> set[str]:
    names: set[str] = set()
    for group in ("battleTraits", "regimentAbilities", "enhancements"):
        for item in box.get(group) or []:
            names.add(str(item.get("name", "")).strip().lower())
            for ability in item.get("abilities") or []:
                names.add(str(ability.get("name", "")).strip().lower())
    return names


def clean_warscroll_abilities(
    abilities: list[dict],
    pack_names: set[str] | None = None,
) -> list[dict]:
    pack = pack_names or set()
    out: list[dict] = []
    for ability in abilities:
        key = str(ability.get("name", "")).strip().lower()
        if key == "battle damaged":
            continue
        if is_leaked_warscroll_name(ability.get("name", "")):
            break
        if key in pack:
            continue
        blob = f"{ability.get('declare', '')} {ability.get('effect', '')}"
        if re.search(r"heroic trait", blob, re.I):
            continue
        if out and re.search(
            r"Universal Core Abilities|keyword is used in the following",
            blob,
            re.I,
        ):
            continue
        cleaned = {
            **ability,
            "declare": scrub_rules_text(str(ability.get("declare", ""))),
            "effect": scrub_rules_text(str(ability.get("effect", ""))),
        }
        if cleaned["declare"] or cleaned["effect"] or cleaned.get("timing"):
            out.append(cleaned)
    return out


def clean_box(box: dict) -> None:
    skip = pack_ability_names(box)
    for unit in box.get("units") or []:
        unit["abilities"] = clean_warscroll_abilities(unit.get("abilities") or [], skip)


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


def parse_ab_blocks(section: str, *, stop_at_leaked: bool = False) -> list[dict]:
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
        declare = scrub_rules_text(collapse(declare_m.group(1)) if declare_m else "")
        if used_m and not declare:
            declare = scrub_rules_text(collapse("Used By: " + used_m.group(1)))
        elif used_m:
            declare = scrub_rules_text(
                (declare + " Used By: " + collapse(used_m.group(1))).strip()
            )
        effect = scrub_rules_text(
            collapse(effect_m.group(1)) if effect_m else collapse(fluff.group(1) if fluff else "")
        )
        if not name:
            continue
        key = name.strip().lower()
        if key == "battle damaged":
            continue
        if is_leaked_warscroll_name(name):
            if stop_at_leaked:
                break
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


def weapon_from_tbody(body: str, kind: str) -> dict | None:
    name_m = re.search(
        r'<tr class="wsDataRow wsDataRow_short"[^>]*>\s*<td[^>]*>(.*?)</td>',
        body,
        re.S,
    )
    name = collapse(re.sub(r"\[.*?\]", "", name_m.group(1) if name_m else ""))
    ability_bits = re.findall(
        r'class="tt kwbu"[^>]*>(.*?)</span>',
        name_m.group(1) if name_m else "",
        re.S,
    )
    ability = ", ".join(collapse(bit) for bit in ability_bits)
    # Faction colour suffix varies (dsColorFrSE, dsColorFrCoS, …).
    stat_row = re.search(r'<tr class="wsDataRow dsColorFr\w*">(.*?)</tr>', body, re.S)
    if not stat_row:
        return None
    cells = re.findall(r"<td[^>]*>(.*?)</td>", stat_row.group(1), re.S)
    values = [collapse(cell) for cell in cells if collapse(cell)]
    if kind == "ranged":
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
        return None
    return {
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


def wtable_inners(block: str) -> list[str]:
    """Return wTable bodies, counting nested tables so 'See below' cells are not cut short."""
    inners: list[str] = []
    pos = 0
    while True:
        match = re.search(r'<table class="[^"]*wTable[^"]*"[^>]*>', block[pos:])
        if not match:
            break
        start = pos + match.end()
        depth = 1
        cursor = start
        inner = ""
        while cursor < len(block) and depth:
            next_open = block.find("<table", cursor)
            next_close = block.find("</table>", cursor)
            if next_close < 0:
                break
            if 0 <= next_open < next_close:
                depth += 1
                cursor = next_open + 6
            else:
                depth -= 1
                if depth == 0:
                    inner = block[start:next_close]
                cursor = next_close + 8
        if inner:
            inners.append(inner)
        pos = cursor if cursor > pos else start + 1
    return inners


def parse_weapons(block: str) -> list[dict]:
    weapons: list[dict] = []
    for table in wtable_inners(block):
        kind = "melee"
        pos = 0
        while True:
            tbody_m = re.search(r'<tbody class="bkg">(.*?)</tbody>', table[pos:], re.S)
            if not tbody_m:
                break
            header_region = table[pos : pos + tbody_m.start()]
            last_ranged = header_region.rfind("wsHeaderCellName_RangedWeapons")
            last_melee = header_region.rfind("wsHeaderCellName_MeleeWeapons")
            if last_ranged >= 0 or last_melee >= 0:
                kind = "ranged" if last_ranged > last_melee else "melee"
            weapon = weapon_from_tbody(tbody_m.group(1), kind)
            if weapon:
                weapons.append(weapon)
            pos += tbody_m.end()
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
                "abilities": parse_ab_blocks(
                    trim_warscroll_body(target),
                    stop_at_leaked=True,
                ),
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

        box = {
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
        clean_box(box)
        boxes.append(box)
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


def clean_existing() -> None:
    count = 0
    for path in sorted(OUT_DIR.glob("*.json")):
        box = json.loads(path.read_text(encoding="utf-8"))
        clean_box(box)
        path.write_text(json.dumps(box, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        count += 1
    print(f"cleaned {count} catalogues in {OUT_DIR}")


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--clean":
        clean_existing()
        return
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
