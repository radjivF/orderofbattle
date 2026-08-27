#!/usr/bin/env python3
"""Extract AoS 4th list-building data from BSData catalogues.

Attribute: https://github.com/BSData/age-of-sigmar-4th
Names, costs, and categories only — no ability text.
"""

from __future__ import annotations

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

REGIMENTAL_OPTION = "db3a-7199-c92e-f3cf"
REGIMENTAL_HERO = "8f4b-1fa6-3128-8405"
REINFORCED_ID = "1b37-82b8-c062-eb82"
SKIP = (
    "lores",
    "regiments of renown",
    "legions of nagash",
    "the duardin ascendant",
)

ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("AOS4_DATA") or (ROOT / "data" / "aos4"))
OUT_DIR = ROOT / "src" / "engine" / "data"
AOR_SKIP_STEMS = {
    "Ironjawz - Big Waaagh!",
    "Kruleboyz - Big Waaagh!",
}


def local(tag: str) -> str:
    return tag.split("}")[-1]


def parse(path: Path) -> ET.Element:
    return ET.parse(path).getroot()


def slug(name: str) -> str:
    value = name.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


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
    for item in el:
        if local(item.tag) == tag:
            return item
    return None


def children(el: ET.Element, tag: str) -> list[ET.Element]:
    return [item for item in el if local(item.tag) == tag]


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


def regiment_slots(
    entry_link: ET.Element,
    slot_category_id: str,
    names: dict[str, str],
    library_units: dict[str, ET.Element],
    link_targets: dict[str, str],
) -> list[dict]:
    """Units/categories granted Regimental Option or Regimental Hero by this hero."""
    options: list[dict] = []
    option_keys: set[str] = set()
    for modifier in entry_link.iter():
        if local(modifier.tag) != "modifier":
            continue
        if modifier.attrib.get("field") != "category":
            continue
        if modifier.attrib.get("value") != slot_category_id:
            continue
        affects = modifier.attrib.get("affects") or ""
        if "recursive." not in affects:
            continue
        token = affects.split("recursive.")[-1]
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
    return options


def entry_link_extra_categories(
    entry_link: ET.Element,
    names: dict[str, str],
) -> list[str]:
    """Categories BattleScribe adds onto this unit (e.g. Rotbringer Lord)."""
    extra: list[str] = []
    seen: set[str] = set()
    for modifier in entry_link.iter():
        if local(modifier.tag) != "modifier":
            continue
        if modifier.attrib.get("field") != "category":
            continue
        if modifier.attrib.get("type") != "add":
            continue
        affects = (modifier.attrib.get("affects") or "").strip()
        if affects and "recursive." in affects:
            continue
        cat_id = modifier.attrib.get("value") or ""
        label = names.get(cat_id, "")
        if not label or label in seen:
            continue
        if label in {"Regimental Option", "Regimental Hero", "Regimental Leader"}:
            continue
        seen.add(label)
        extra.append(label)
    return extra


def clean_rules_text(value: str) -> str:
    text = " ".join(value.split())
    text = re.sub(r"\*\*\^\^([^*]+)\^\^\*\*", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\^\^([^^]+)\^\^", r"\1", text)
    return text.strip()


def profile_chars(profile: ET.Element) -> dict[str, str]:
    out: dict[str, str] = {}
    chars = child(profile, "characteristics")
    if chars is None:
        return out
    for ch in children(chars, "characteristic"):
        key = ch.attrib.get("name") or ""
        if not key:
            continue
        out[key] = clean_rules_text("".join(ch.itertext()))
    return out


def unit_stats(entry: ET.Element) -> dict[str, str]:
    stats = {"move": "", "health": "", "save": "", "control": ""}
    for profile in entry.iter():
        if local(profile.tag) != "profile":
            continue
        kind = profile.attrib.get("typeName") or ""
        if kind not in {"Unit", "Manifestation"}:
            continue
        chars = profile_chars(profile)
        stats["move"] = chars.get("Move", "")
        stats["health"] = chars.get("Health", "")
        stats["save"] = chars.get("Save", "")
        stats["control"] = chars.get("Control", "")
        break
    return stats


def model_entry_size(se: ET.Element) -> int:
    mins: list[int] = []
    maxes: list[int] = []
    for constraint in se.iter():
        if local(constraint.tag) != "constraint":
            continue
        if constraint.attrib.get("field") != "selections":
            continue
        if constraint.attrib.get("scope") != "parent":
            continue
        raw = constraint.attrib.get("value") or ""
        try:
            value = int(float(raw))
        except ValueError:
            continue
        if value <= 0:
            continue
        kind = constraint.attrib.get("type")
        if kind == "min":
            mins.append(value)
        elif kind == "max":
            maxes.append(value)
    paired = [value for value in mins if value in maxes]
    if paired:
        return max(paired)
    if mins:
        return max(mins)
    if maxes:
        return max(maxes)
    return 1


def unit_models(entry: ET.Element) -> int:
    """Base model count from model selection entries.

    Squad-style units use one model entry with min=max=N.
    Some units (e.g. Stormfiends) use N separate model entries of size 1.
    """
    total = 0
    for se in entry.iter():
        if local(se.tag) != "selectionEntry":
            continue
        if se is entry:
            continue
        if se.attrib.get("type") != "model":
            continue
        total += model_entry_size(se)
    return total if total > 0 else 1


def manifestation_banishment(entry: ET.Element) -> str:
    for profile in entry.iter():
        if local(profile.tag) != "profile":
            continue
        if profile.attrib.get("typeName") != "Manifestation":
            continue
        return profile_chars(profile).get("Banishment", "")
    return ""


def resolve_entry(
    oid: str, by_id: dict[str, ET.Element]
) -> ET.Element | None:
    target = by_id.get(oid)
    if target is None:
        return None
    if local(target.tag) == "entryLink":
        return by_id.get(target.attrib.get("targetId") or "")
    return target


def manifestation_sheet(
    oid: str,
    oname: str,
    by_id: dict[str, ET.Element],
    summon: dict | None = None,
) -> dict:
    entry = resolve_entry(oid, by_id)
    if entry is None:
        return {
            "id": oid,
            "name": oname,
            "stats": {"move": "", "health": "", "save": "", "control": ""},
            "banishment": "",
            "categories": [],
            "weapons": [],
            "abilities": [],
            "summon": summon,
        }
    return {
        "id": oid,
        "name": oname or named(entry),
        "stats": unit_stats(entry),
        "banishment": manifestation_banishment(entry),
        "categories": unit_categories(entry),
        "weapons": unit_weapons(entry),
        "abilities": unit_abilities(entry),
        "summon": summon,
    }


def manifestation_models(lore_el: ET.Element, by_id: dict[str, ET.Element]) -> list[dict]:
    models: list[dict] = []
    seen: set[str] = set()
    summons = summon_map(lore_el, by_id)

    def add(oid: str, oname: str) -> None:
        if not oid or not oname or oid in seen:
            return
        if oname.startswith("Summon "):
            return
        seen.add(oid)
        models.append(
            manifestation_sheet(oid, oname, by_id, summons.get(oname))
        )

    def from_group(group: ET.Element) -> None:
        summons.update(summon_map(group, by_id))
        for item in leaf_upgrades(group, by_id):
            add(item["id"], item["name"])

    links = child(lore_el, "entryLinks")
    if links is not None:
        for link in children(links, "entryLink"):
            target_id = link.attrib.get("targetId") or ""
            target = by_id.get(target_id)
            if target is None:
                continue
            tag = local(target.tag)
            if tag == "selectionEntryGroup":
                from_group(target)
            elif tag == "selectionEntry" and target.attrib.get("type") == "unit":
                add(target_id, named(link) or named(target))

    ses = child(lore_el, "selectionEntries")
    if ses is not None:
        for se in children(ses, "selectionEntry"):
            if se.attrib.get("type") == "unit":
                add(se.attrib.get("id") or "", named(se))

    # Re-attach summons after all models known (group may resolve late).
    for model in models:
        if model.get("summon") is None:
            model["summon"] = summons.get(model["name"])

    return models


def unit_weapons(entry: ET.Element) -> list[dict]:
    weapons: list[dict] = []
    seen: set[str] = set()
    for profile in entry.iter():
        if local(profile.tag) != "profile":
            continue
        kind = profile.attrib.get("typeName") or ""
        if kind not in {"Melee Weapon", "Ranged Weapon"}:
            continue
        name = named(profile)
        if not name or name in seen:
            continue
        seen.add(name)
        chars = profile_chars(profile)
        weapons.append(
            {
                "name": name,
                "kind": "ranged" if kind == "Ranged Weapon" else "melee",
                "range": chars.get("Rng", ""),
                "attacks": chars.get("Atk", ""),
                "hit": chars.get("Hit", ""),
                "wound": chars.get("Wnd", ""),
                "rend": chars.get("Rnd", ""),
                "damage": chars.get("Dmg", ""),
                "ability": chars.get("Ability", ""),
            }
        )
    return weapons


def ability_from_profile(profile: ET.Element) -> dict | None:
    kind = profile.attrib.get("typeName") or ""
    if not kind.startswith("Ability"):
        return None
    name = named(profile)
    if not name:
        return None
    chars = profile_chars(profile)
    return {
        "name": name,
        "kind": kind.replace("Ability (", "").rstrip(")"),
        "timing": chars.get("Timing", ""),
        "declare": chars.get("Declare", ""),
        "effect": chars.get("Effect", ""),
        "keywords": chars.get("Keywords", ""),
        "castingValue": chars.get("Casting Value", ""),
        "chantingValue": chars.get("Chanting Value", ""),
    }


def powers_under(el: ET.Element, *kinds: str) -> list[dict]:
    powers: list[dict] = []
    seen: set[str] = set()
    wanted = {kind.lower() for kind in kinds}
    for profile in el.iter():
        if local(profile.tag) != "profile":
            continue
        power = ability_from_profile(profile)
        if power is None:
            continue
        if wanted and power["kind"].lower() not in wanted:
            continue
        key = power["name"]
        if key in seen:
            continue
        seen.add(key)
        powers.append(power)
    return powers


def lore_powers(source: ET.Element, by_id: dict[str, ET.Element], *kinds: str) -> list[dict]:
    powers: list[dict] = []
    seen: set[str] = set()

    def absorb(el: ET.Element) -> None:
        for power in powers_under(el, *kinds):
            if power["name"] in seen:
                continue
            seen.add(power["name"])
            powers.append(power)

    absorb(source)
    links = child(source, "entryLinks")
    if links is not None:
        for link in children(links, "entryLink"):
            target = by_id.get(link.attrib.get("targetId") or "")
            if target is not None:
                absorb(target)
    return powers


def summon_map(lore_el: ET.Element, by_id: dict[str, ET.Element]) -> dict[str, dict]:
    """Map manifestation name -> Summon spell ability."""
    found: dict[str, dict] = {}

    def scan(el: ET.Element) -> None:
        ses = child(el, "selectionEntries")
        if ses is not None:
            for se in children(ses, "selectionEntry"):
                oname = named(se)
                if not oname.startswith("Summon "):
                    continue
                for power in powers_under(se, "Spell", "Prayer"):
                    target_name = oname[len("Summon ") :].strip()
                    found[target_name] = power
        links = child(el, "entryLinks")
        if links is not None:
            for link in children(links, "entryLink"):
                target = by_id.get(link.attrib.get("targetId") or "")
                if target is not None and local(target.tag) == "selectionEntryGroup":
                    scan(target)

    scan(lore_el)
    return found


def unit_abilities(entry: ET.Element) -> list[dict]:
    return powers_under(entry)


def collect_library_units(*roots: ET.Element) -> dict[str, ET.Element]:
    units: dict[str, ET.Element] = {}
    for root in roots:
        for el in root.iter():
            if local(el.tag) == "selectionEntry" and el.attrib.get("type") == "unit":
                units[el.attrib["id"]] = el
    return units


def index_elements(*roots: ET.Element) -> dict[str, ET.Element]:
    by_id: dict[str, ET.Element] = {}
    for root in roots:
        for el in root.iter():
            el_id = el.attrib.get("id")
            if el_id and el_id not in by_id:
                by_id[el_id] = el
    return by_id


def named(el: ET.Element) -> str:
    return (el.attrib.get("name") or "").strip()


def is_hidden(el: ET.Element) -> bool:
    return el.attrib.get("hidden") == "true"


def group_matches(name: str, *labels: str) -> bool:
    for label in labels:
        if name == label or name.startswith(f"{label}:") or name.startswith(f"{label} "):
            return True
    return False


def leaf_upgrades(
    group: ET.Element,
    by_id: dict[str, ET.Element],
    seen: set[str] | None = None,
    *,
    include_hidden: bool = False,
    pack: str = "",
    wrappers: tuple[str, ...] = (),
) -> list[dict[str, str]]:
    """Collect named upgrade/unit picks under a group, following entryLinks."""
    if seen is None:
        seen = set()
    gid = group.attrib.get("id")
    if gid:
        if gid in seen:
            return []
        seen.add(gid)

    options: list[dict[str, str]] = []
    found: set[str] = set()

    def add(oid: str, oname: str) -> None:
        if not oid or not oname or oid in found:
            return
        if oname.startswith("Summon "):
            return
        found.add(oid)
        item = {"id": oid, "name": oname}
        if pack:
            item["pack"] = pack
        options.append(item)

    def child_pack(child_name: str) -> str:
        if child_name and wrappers and not group_matches(child_name, *wrappers):
            return child_name
        return pack

    def walk_group(target: ET.Element, next_pack: str) -> None:
        options.extend(
            leaf_upgrades(
                target,
                by_id,
                seen,
                include_hidden=include_hidden,
                pack=next_pack,
                wrappers=wrappers,
            )
        )

    ses = child(group, "selectionEntries")
    if ses is not None:
        for se in children(ses, "selectionEntry"):
            if is_hidden(se):
                continue
            add(se.attrib.get("id") or "", named(se))

    links = child(group, "entryLinks")
    if links is not None:
        for link in children(links, "entryLink"):
            if is_hidden(link) and not include_hidden:
                continue
            target_id = link.attrib.get("targetId") or ""
            target = by_id.get(target_id)
            if target is None:
                continue
            tag = local(target.tag)
            if tag == "selectionEntryGroup":
                walk_group(target, child_pack(named(link) or named(target)))
            elif tag == "selectionEntry":
                add(target_id, named(link) or named(target))

    nested_groups = child(group, "selectionEntryGroups")
    if nested_groups is not None:
        for nested_group in children(nested_groups, "selectionEntryGroup"):
            if is_hidden(nested_group) and not include_hidden:
                continue
            walk_group(nested_group, child_pack(named(nested_group)))

    return options


def find_groups(cat: ET.Element, *labels: str) -> list[ET.Element]:
    groups: list[ET.Element] = []
    for el in cat.iter():
        if local(el.tag) != "selectionEntryGroup":
            continue
        if is_hidden(el):
            continue
        if group_matches(named(el), *labels):
            groups.append(el)
    return groups


def extract_lores(
    cat: ET.Element,
    by_id: dict[str, ET.Element],
    *labels: str,
    with_manifestations: bool = False,
) -> list[dict]:
    lores: list[dict] = []
    seen: set[str] = set()

    def add(oid: str, oname: str, source: ET.Element) -> None:
        if not oid or not oname or oid in seen:
            return
        if group_matches(oname, *labels):
            return
        seen.add(oid)
        item: dict = {"id": oid, "name": oname}
        if with_manifestations:
            models = manifestation_models(source, by_id)
            if not models and local(source.tag) == "selectionEntryGroup":
                models = [
                    manifestation_sheet(m["id"], m["name"], by_id)
                    for m in leaf_upgrades(source, by_id)
                    if not m["name"].startswith("Summon ")
                ]
            item["manifestations"] = models
        else:
            kinds = (
                ("Spell",)
                if any("Spell" in label for label in labels)
                else ("Prayer",)
            )
            item["powers"] = lore_powers(source, by_id, *kinds)
        lores.append(item)

    def collect_from_group(group: ET.Element) -> None:
        ses = child(group, "selectionEntries")
        if ses is not None:
            for se in children(ses, "selectionEntry"):
                if is_hidden(se):
                    continue
                add(se.attrib.get("id") or "", named(se), se)
        links = child(group, "entryLinks")
        if links is not None:
            for link in children(links, "entryLink"):
                if is_hidden(link):
                    continue
                target_id = link.attrib.get("targetId") or ""
                target = by_id.get(target_id)
                if target is None:
                    continue
                if local(target.tag) != "selectionEntryGroup":
                    continue
                add(target.attrib.get("id") or target_id, named(link) or named(target), target)

    for group in find_groups(cat, *labels):
        collect_from_group(group)

    for el in cat.iter():
        if local(el.tag) != "entryLink":
            continue
        if is_hidden(el):
            continue
        if el.attrib.get("type") != "selectionEntryGroup":
            continue
        if not group_matches(named(el), *labels):
            continue
        target = by_id.get(el.attrib.get("targetId") or "")
        if target is None or local(target.tag) != "selectionEntryGroup":
            continue
        collect_from_group(target)

    return lores


def entry_points(entry: ET.Element | None) -> int:
    if entry is None:
        return 0
    costs = child(entry, "costs")
    if costs is None:
        return 0
    for cost in children(costs, "cost"):
        if cost.attrib.get("name") != "pts":
            continue
        try:
            return int(float(cost.attrib.get("value") or "0"))
        except ValueError:
            return 0
    return 0


def extract_enhancements(
    cat: ET.Element,
    by_id: dict[str, ET.Element],
    *labels: str,
    include_hidden: bool = False,
) -> list[dict]:
    options: list[dict] = []
    seen: set[str] = set()
    for group in find_groups(cat, *labels):
        for item in leaf_upgrades(
            group,
            by_id,
            include_hidden=include_hidden,
            wrappers=labels,
        ):
            if item["id"] in seen:
                continue
            if group_matches(item["name"], *labels):
                continue
            seen.add(item["id"])
            entry = by_id.get(item["id"])
            option: dict = {
                "id": item["id"],
                "name": item["name"],
                "abilities": unit_abilities(entry) if entry is not None else [],
            }
            points = entry_points(entry)
            if points:
                option["points"] = points
            pack = item.get("pack") or ""
            if pack:
                option["pack"] = pack
            options.append(option)
    return options


def extract_faction(
    gst: ET.Element,
    cat_path: Path,
    lib_path: Path | list[Path] | None,
    extra_roots: list[ET.Element],
    parent_faction_ids: list[str] | None = None,
) -> dict | None:
    cat = parse(cat_path)
    if lib_path is None:
        lib_files: list[Path] = []
    elif isinstance(lib_path, Path):
        lib_files = [lib_path]
    else:
        lib_files = lib_path
    lib_roots = [parse(path) for path in lib_files if path.exists()]
    roots = [gst, cat, *extra_roots, *lib_roots]
    names = index_names(*roots)
    link_targets = index_entry_targets(cat)
    library_units = collect_library_units(*(lib_roots if lib_roots else [cat]))
    by_id = index_elements(*roots)

    formations: list[dict] = []
    seen_form: set[str] = set()
    for el in cat.iter():
        if local(el.tag) != "selectionEntryGroup":
            continue
        group_name = el.attrib.get("name") or ""
        if not group_name.startswith("Battle Formations"):
            continue
        for entry in nested(el, "selectionEntries", "selectionEntry"):
            fid = entry.attrib.get("id")
            fname = entry.attrib.get("name")
            if not fid or not fname or fid in seen_form:
                continue
            seen_form.add(fid)
            formations.append(
                {
                    "id": fid,
                    "name": fname,
                    "abilities": unit_abilities(entry),
                }
            )

    battle_traits: list[dict] = []
    seen_traits: set[str] = set()
    for el in cat.iter():
        if local(el.tag) != "selectionEntry":
            continue
        name = el.attrib.get("name") or ""
        if not name.startswith("Battle Traits"):
            continue
        tid = el.attrib.get("id") or name
        if tid in seen_traits:
            continue
        seen_traits.add(tid)
        abilities = unit_abilities(el)
        if not abilities:
            continue
        battle_traits.append(
            {
                "id": tid,
                "name": name.replace("Battle Traits:", "").strip() or name,
                "abilities": abilities,
            }
        )

    units: list[dict] = []
    seen: set[str] = set()
    terrain: list[dict] = []
    seen_terrain: set[str] = set()

    for el in cat.iter():
        if local(el.tag) != "entryLink":
            continue
        if el.attrib.get("type") != "selectionEntry":
            continue
        target = el.attrib.get("targetId")
        if not target or target not in library_units:
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
                label = link.attrib.get("name")
                if label and label not in cats:
                    cats.append(label)

        points = 0
        costs = child(el, "costs")
        if costs is not None:
            for cost in children(costs, "cost"):
                if cost.attrib.get("name") == "pts":
                    points = int(float(cost.attrib.get("value") or "0"))

        if "FACTION TERRAIN" in cats:
            if target not in seen_terrain:
                seen_terrain.add(target)
                terrain.append(
                    {
                        "id": target,
                        "name": name or lib_entry.attrib.get("name") or "",
                        "stats": unit_stats(lib_entry),
                        "categories": cats,
                        "weapons": unit_weapons(lib_entry),
                        "abilities": unit_abilities(lib_entry),
                    }
                )
            continue

        reinforce = False
        links = child(el, "entryLinks")
        if links is not None:
            for link in children(links, "entryLink"):
                if (
                    link.attrib.get("targetId") == REINFORCED_ID
                    or link.attrib.get("name") == "Reinforced"
                ):
                    reinforce = True

        options = regiment_slots(
            el, REGIMENTAL_OPTION, names, library_units, link_targets
        )
        hero_options = regiment_slots(
            el, REGIMENTAL_HERO, names, library_units, link_targets
        )

        for label in entry_link_extra_categories(el, names):
            if label not in cats:
                cats.append(label)
        # BSData omits this keyword on Lord of Afflictions; warscroll has it.
        if name == "Lord of Afflictions" and "Rotbringer Lord" not in cats:
            cats.append("Rotbringer Lord")

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
                "models": unit_models(lib_entry),
                "categories": cats,
                "stats": unit_stats(lib_entry),
                "weapons": unit_weapons(lib_entry),
                "abilities": unit_abilities(lib_entry),
                "regimentOptions": options,
                "regimentHeroes": hero_options,
            }
        )

    units.sort(key=lambda item: (not item["hero"], item["name"]))
    terrain.sort(key=lambda item: item["name"])
    heroes = [item for item in units if item["hero"]]
    if len(heroes) == 0 or len(units) == 0:
        return None

    display = cat.attrib.get("name") or cat_path.stem
    spell_lores = extract_lores(cat, by_id, "Spell Lores", "Spell Lore")
    prayer_lores = extract_lores(cat, by_id, "Prayer Lores", "Prayer Lore")
    manifestation_lores = extract_lores(
        cat,
        by_id,
        "Manifestation Lores",
        "Manifestation Lore",
        with_manifestations=True,
    )
    artefacts = extract_enhancements(
        cat,
        by_id,
        "Artefacts of Power",
        "Artefacts of",
    )
    heroic_traits = extract_enhancements(cat, by_id, "Heroic Traits")
    monstrous_traits = extract_enhancements(
        cat,
        by_id,
        "Monstrous Traits",
        include_hidden=True,
    )
    visions_of_fate = extract_enhancements(
        cat,
        by_id,
        "Visions of Fate",
        include_hidden=True,
    )
    payload = {
        "id": slug(display),
        "name": display,
        "game": "Age of Sigmar 4th",
        "source": "https://github.com/BSData/age-of-sigmar-4th",
        "pointsCapDefault": 2000,
        "formations": formations,
        "battleTraits": battle_traits,
        "spellLores": spell_lores,
        "prayerLores": prayer_lores,
        "manifestationLores": manifestation_lores,
        "artefacts": artefacts,
        "heroicTraits": heroic_traits,
        "monstrousTraits": monstrous_traits,
        "visionsOfFate": visions_of_fate,
        "terrain": terrain,
        "units": units,
    }
    if parent_faction_ids:
        payload["parentFactionIds"] = parent_faction_ids
    return payload


def write_loader_from_out_dir() -> None:
    slugs: list[tuple[str, str]] = []
    for path in sorted(OUT_DIR.glob("*.json")):
        if path.stem == "regiments-of-renown":
            continue
        slugs.append((ident(path.stem), path.stem))
    write_loader(slugs)


def write_aor_payload(payload: dict) -> None:
    out = OUT_DIR / f"{payload['id']}.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(
        f"{payload['name']}: {len(payload['units'])} units, "
        f"{len(payload['formations'])} formations, "
        f"{len(payload['battleTraits'])} battle traits, "
        f"{len(payload['artefacts'])} artefacts, "
        f"{len(payload['heroicTraits'])} traits"
        + (
            f" (AoR → {', '.join(payload.get('parentFactionIds', []))})"
            if payload.get("parentFactionIds")
            else ""
        )
    )


def is_army_of_renown_cat(name: str) -> bool:
    if " - " not in name:
        return False
    if "Library" in name or "[LEGENDS" in name:
        return False
    if name.lower().startswith("path to glory"):
        return False
    if name in AOR_SKIP_STEMS:
        return False
    return True


def extract_armies_of_renown() -> None:
    """Write Armies of Renown JSON without wiping existing faction files."""
    gst = parse(DATA / "Age of Sigmar 4.0.gst")
    lores_path = DATA / "Lores.cat"
    extra_roots = [parse(lores_path)] if lores_path.exists() else []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    core_ids = {
        path.stem
        for path in OUT_DIR.glob("*.json")
        if path.stem != "regiments-of-renown"
    }
    written = 0

    big_waaagh = DATA / "Big Waaagh!.cat"
    if big_waaagh.exists():
        payload = extract_faction(
            gst,
            big_waaagh,
            [
                DATA / "Ironjawz - Library.cat",
                DATA / "Kruleboyz - Library.cat",
            ],
            extra_roots,
            parent_faction_ids=["ironjawz", "kruleboyz"],
        )
        if payload:
            write_aor_payload(payload)
            written += 1
        else:
            print("skip Big Waaagh! (no units)")

    for cat_path in sorted(DATA.glob("*.cat")):
        name = cat_path.stem
        if not is_army_of_renown_cat(name):
            continue
        parent = name.split(" - ")[0]
        parent_id = slug(parent)
        if parent_id not in core_ids:
            print(f"skip {name} (unknown parent {parent_id})")
            continue
        lib_path = DATA / f"{parent} - Library.cat"
        payload = extract_faction(
            gst,
            cat_path,
            lib_path if lib_path.exists() else None,
            extra_roots,
            parent_faction_ids=[parent_id],
        )
        if payload is None:
            print(f"skip {name} (no units)")
            continue
        if "[LEGENDS" in payload["name"]:
            print(f"skip {payload['name']}")
            continue
        write_aor_payload(payload)
        written += 1

    write_loader_from_out_dir()
    print(f"wrote {written} armies of renown")


def write_loader(slugs: list[tuple[str, str]]) -> None:
    imports = "\n".join(
        f'import {ident} from "./{slug}.json";'
        for ident, slug in slugs
    )
    array = ",\n  ".join(ident for ident, _ in slugs)
    (OUT_DIR / "load.ts").write_text(
        "import type { FactionCatalogue, RegimentOfRenown } from \"../types\";\n"
        f"{imports}\n"
        'import regimentsOfRenownJson from "./regiments-of-renown.json";\n\n'
        "export const factions = [\n"
        f"  {array},\n"
        "] as FactionCatalogue[];\n\n"
        "export const regimentsOfRenown =\n"
        "  regimentsOfRenownJson as RegimentOfRenown[];\n"
    )


def extract_regiments_of_renown(
    gst: ET.Element,
    cat_id_to_slug: dict[str, str],
) -> list[dict]:
    """Regiments of Renown from the GST force entries + RoR catalogue."""
    ror_path = DATA / "Regiments of Renown.cat"
    if not ror_path.exists():
        return []
    ror_cat = parse(ror_path)
    lib_roots = [gst, ror_cat]
    for path in DATA.glob("*- Library.cat"):
        lib_roots.append(parse(path))
    names = index_names(*lib_roots)
    library_units = collect_library_units(*lib_roots)
    by_id = index_elements(*lib_roots)

    # force id -> unit entryLinks in RoR cat
    parent: dict[ET.Element, ET.Element] = {}
    for node in ror_cat.iter():
        for child_el in node:
            parent[child_el] = node

    def ancestor_link(el: ET.Element) -> ET.Element | None:
        cur: ET.Element | None = el
        while cur is not None:
            if local(cur.tag) == "entryLink" and cur.attrib.get("name"):
                return cur
            cur = parent.get(cur)
        return None

    force_links: dict[str, list[ET.Element]] = {}
    for el in ror_cat.iter():
        child_id = el.attrib.get("childId")
        if not child_id:
            continue
        link = ancestor_link(el)
        if link is None:
            continue
        name = link.attrib.get("name") or ""
        if name.startswith("Regiment of Renown:"):
            continue
        force_links.setdefault(child_id, [])
        if link not in force_links[child_id]:
            force_links[child_id].append(link)

    # ability profiles on Regiment of Renown: X upgrades
    ror_abilities: dict[str, list[dict]] = {}
    for el in ror_cat.iter():
        if local(el.tag) != "selectionEntry":
            continue
        name = el.attrib.get("name") or ""
        if not name.startswith("Regiment of Renown:"):
            continue
        short = name.split(":", 1)[-1].strip()
        ror_abilities[short.lower()] = unit_abilities(el)
        # also key by force-style names
        ror_abilities[name.lower()] = unit_abilities(el)

    rows: list[dict] = []
    for el in gst.iter():
        if local(el.tag) != "forceEntry":
            continue
        force_id = el.attrib.get("id") or ""
        name = el.attrib.get("name") or ""
        if not force_id or not name:
            continue
        points = 0
        for cost in el.iter():
            if local(cost.tag) != "cost":
                continue
            if cost.attrib.get("name") == "pts":
                points = int(float(cost.attrib.get("value") or "0"))
                break
        if points <= 0:
            continue

        faction_ids: list[str] = []
        seen_f: set[str] = set()
        for cond in el.iter():
            if local(cond.tag) != "condition":
                continue
            cid = cond.attrib.get("childId") or ""
            slug_id = cat_id_to_slug.get(cid)
            if slug_id and slug_id not in seen_f:
                seen_f.add(slug_id)
                faction_ids.append(slug_id)
        if not faction_ids:
            continue

        units: list[dict] = []
        for link in force_links.get(force_id, []):
            target = link.attrib.get("targetId") or ""
            lib_entry = library_units.get(target) or by_id.get(target)
            unit_name = link.attrib.get("name") or names.get(target, target)
            if lib_entry is None:
                units.append(
                    {
                        "id": target or link.attrib.get("id") or unit_name,
                        "name": unit_name,
                        "count": ror_link_count(link),
                        "points": 0,
                        "hero": False,
                        "unique": False,
                        "reinforce": False,
                        "models": 1,
                        "categories": [],
                        "stats": {
                            "move": "",
                            "health": "",
                            "save": "",
                            "control": "",
                        },
                        "weapons": [],
                        "abilities": [],
                        "canTakeEnhancements": ror_link_allows_enhancements(link),
                    }
                )
                continue
            cats = unit_categories(lib_entry)
            units.append(
                {
                    "id": target,
                    "name": named(lib_entry) or unit_name,
                    "count": ror_link_count(link),
                    "points": 0,
                    "hero": "HERO" in cats,
                    "unique": "UNIQUE" in cats,
                    "reinforce": False,
                    "models": unit_models(lib_entry),
                    "categories": cats,
                    "stats": unit_stats(lib_entry),
                    "weapons": unit_weapons(lib_entry),
                    "abilities": unit_abilities(lib_entry),
                    "canTakeEnhancements": ror_link_allows_enhancements(link),
                }
            )

        abilities = (
            ror_abilities.get(name.lower())
            or ror_abilities.get(f"regiment of renown: {name}".lower())
            or []
        )
        # fuzzy: Pit-beasts vs Pit Beasts
        if not abilities:
            key = re.sub(r"[^a-z0-9]+", "", name.lower())
            for abl_name, abl in ror_abilities.items():
                if re.sub(r"[^a-z0-9]+", "", abl_name) == key:
                    abilities = abl
                    break

        rows.append(
            {
                "id": force_id,
                "name": name,
                "points": points,
                "factionIds": sorted(faction_ids),
                "abilities": abilities,
                "units": units,
            }
        )

    rows.sort(key=lambda item: item["name"])
    return rows


def ror_link_count(link: ET.Element) -> int:
    """Fixed model/unit count when the RoR force is active (usually 1)."""
    best = 1
    for group in link.iter():
        if local(group.tag) != "modifierGroup":
            continue
        for modifier in group.iter():
            if local(modifier.tag) != "modifier":
                continue
            if modifier.attrib.get("type") != "set":
                continue
            raw = modifier.attrib.get("value") or ""
            try:
                value = int(float(raw))
            except ValueError:
                continue
            if value > best:
                best = value
    return best


def ror_link_allows_enhancements(link: ET.Element) -> bool:
    for child_el in link.iter():
        if local(child_el.tag) != "entryLink":
            continue
        name = (child_el.attrib.get("name") or "").lower()
        if "artefact" in name or "heroic trait" in name:
            return True
    return False


def ident(slug_value: str) -> str:
    parts = slug_value.split("-")
    return parts[0] + "".join(p.title() for p in parts[1:])


def main() -> None:
    gst = parse(DATA / "Age of Sigmar 4.0.gst")
    lores_path = DATA / "Lores.cat"
    extra_roots = [parse(lores_path)] if lores_path.exists() else []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob("*.json"):
        stale.unlink()
    written: list[tuple[str, str]] = []
    cat_id_to_slug: dict[str, str] = {}

    for cat_path in sorted(DATA.glob("*.cat")):
        name = cat_path.stem
        if " - " in name or "[LEGENDS]" in name:
            continue
        if name.lower() in SKIP:
            continue
        lib_path = DATA / f"{name} - Library.cat"
        payload = extract_faction(
            gst,
            cat_path,
            lib_path if lib_path.exists() else None,
            extra_roots,
        )
        if payload is None:
            print(f"skip {name} (no units)")
            continue
        if "[LEGENDS]" in payload["name"]:
            print(f"skip {payload['name']}")
            continue
        cat_root = parse(cat_path)
        cat_id = cat_root.attrib.get("id")
        if cat_id:
            cat_id_to_slug[cat_id] = payload["id"]
        out = OUT_DIR / f"{payload['id']}.json"
        out.write_text(json.dumps(payload, indent=2) + "\n")
        written.append((ident(payload["id"]), payload["id"]))
        print(
            f"{payload['name']}: {len(payload['units'])} units, "
            f"{len(payload['formations'])} formations, "
            f"{len(payload['battleTraits'])} battle traits, "
            f"{len(payload['spellLores'])} spells, "
            f"{len(payload['prayerLores'])} prayers, "
            f"{len(payload['manifestationLores'])} marbles, "
            f"{len(payload['artefacts'])} artefacts, "
            f"{len(payload['heroicTraits'])} traits, "
            f"{len(payload['monstrousTraits'])} monstrous, "
            f"{len(payload['visionsOfFate'])} visions"
        )

    rors = extract_regiments_of_renown(gst, cat_id_to_slug)
    (OUT_DIR / "regiments-of-renown.json").write_text(
        json.dumps(rors, indent=2) + "\n"
    )
    print(f"Regiments of Renown: {len(rors)}")

    write_loader(written)
    print(f"wrote {len(written)} factions")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--aor-only", "--armies-of-renown"):
        extract_armies_of_renown()
    else:
        main()
