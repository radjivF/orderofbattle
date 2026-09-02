#!/usr/bin/env python3
"""Extract The Old World list-building data from New Recruit catalogues.

Attribute: https://github.com/vflam/Warhammer-The-Old-World
Pulls mounts, equipment, unit options, command (incl. BSB), kindreds,
enchanted arrows, wizard levels/lores, special rules, weapons, troop type,
and linked Magic Items / Lores libraries. Also writes Arcane Journal armies.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("TOW_DATA") or (ROOT / "data" / "tow"))
OUT_DIR = ROOT / "src" / "engine" / "data" / "tow"
SOURCE = "https://github.com/vflam/Warhammer-The-Old-World"

FORCE_ORG = {
    "Characters": "characters",
    "Named Characters": "characters",
    "Core": "core",
    "Special": "special",
    "Rare": "rare",
}

CORE_STEMS = {
    "Beastmen Brayherds",
    "Bretonnians",
    "Chaos Dwarfs",
    "Daemons of Chaos",
    "Dark Elves",
    "Dwarfen Mountain Holds",
    "Grand Cathay",
    "High Elf Realms",
    "Lizardmen",
    "Ogre Kingdoms",
    "Orc and Goblin Tribes",
    "Skaven",
    "The Empire of Man",
    "Tomb Kings of Khemri",
    "Vampire Counts",
    "Warriors of Chaos",
    "Wood Elf Realms",
}

# Stem → treat as Arcane Journal (factionId slug from catalogue name).
JOURNAL_STEMS = {
    "Beastmen Brayherds - Minotaur Blood Herd",
    "Beastmen Breyherds - Wild Herd",
    "Chaos Dwarfs - Renegades 2.0",
    "Dwarfen Mountain Holds - Expeditionary Force",
    "Dwarfen Mountain Holds - Royal Clan",
    "Dwarfen Mountain Holds - Slayer Host",
    "Grand Cathay - Jade Fleet",
    "Grand Cathay - Warriors of Wind & Field",
    "High Elf Realms - Chracian Warhost",
    "High Elf Realms - Sea Guard Garrison",
    "Kingdom of Bretonnia - Errantry Crusade",
    "Lizardmen - Renegades v2",
    "Orc and Goblin Tribes - Nomadic Waagh!",
    "Orc and Goblin Tribes - Troll Horde",
    "Skaven - Renegades v2.0",
    "The Empire of Man - City-State of Nuln",
    "The Empire of Man - Knightly Order",
    "Vampire Counts - Midnight Aristocracy",
    "Warriors of Chaos - Knights of Chaos",
    "Wood Elf Realms - Host of Talsyn",
    "Wood Elf Realms - Orion's Wild Hunt",
}

LIBRARY_STEMS = {
    "Common Magic Items",
    "The Lores of Magic",
    "Warhammer_Old_World",
}

GST_STEM = "Warhammer_Old_World"

SKIP_GROUP_TOKENS = ("command", "detach", "detat")

JOINABLE_TROOP = (
    "regular infantry",
    "heavy infantry",
    "light infantry",
    "cavalry",
    "heavy cavalry",
    "light cavalry",
    "monstrous infantry",
    "monstrous cavalry",
)


def slug(name: str) -> str:
    value = name.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


def as_list(value: object) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def pts(entry: dict) -> int | None:
    for cost in as_list(entry.get("costs")):
        if isinstance(cost, dict) and cost.get("typeId") == "points":
            try:
                return int(float(cost.get("value") or 0))
            except (TypeError, ValueError):
                return None
    return None


def load_catalogue(path: Path) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if "catalogue" in raw:
        return raw["catalogue"]
    if "gameSystem" in raw:
        return raw["gameSystem"]
    return raw


def index_catalogue(catalogue: dict) -> dict:
    return {
        "name": catalogue.get("name"),
        "id": catalogue.get("id"),
        "shared": {
            entry["id"]: entry
            for entry in as_list(catalogue.get("sharedSelectionEntries"))
            if isinstance(entry, dict) and entry.get("id")
        },
        "groups": {
            group["id"]: group
            for group in as_list(catalogue.get("sharedSelectionEntryGroups"))
            if isinstance(group, dict) and group.get("id")
        },
        "profiles": {
            profile["id"]: profile
            for profile in as_list(catalogue.get("sharedProfiles"))
            if isinstance(profile, dict) and profile.get("id")
        },
        "rules": {
            rule["id"]: rule
            for rule in as_list(catalogue.get("sharedRules"))
            if isinstance(rule, dict) and rule.get("id")
        },
    }


def profile_stats(profiles: list[dict]) -> dict[str, str] | None:
    ordered = [p for p in profiles if p.get("typeName") == "Model"] + [
        p for p in profiles if p.get("typeName") == "Unit"
    ]
    for profile in ordered:
        stats: dict[str, str] = {}
        for item in as_list(profile.get("characteristics")):
            if not isinstance(item, dict):
                continue
            key = item.get("name")
            if key in ("M", "WS", "BS", "S", "T", "W", "I", "A", "Ld"):
                stats[str(key)] = str(item.get("$text") or "")
        if "M" in stats or "W" in stats:
            return stats
    return None


def troop_type_and_size(profiles: list[dict]) -> tuple[str, str]:
    for profile in profiles:
        if profile.get("typeName") != "Unit":
            continue
        troop = ""
        size = ""
        for item in as_list(profile.get("characteristics")):
            if not isinstance(item, dict):
                continue
            if item.get("name") == "Troop Type":
                troop = str(item.get("$text") or "")
            if item.get("name") == "Unit Size":
                size = str(item.get("$text") or "")
        if troop or size:
            return troop, size
    return "", ""


def linked_profiles(entry: dict, profiles_by_id: dict[str, dict]) -> list[dict]:
    found: list[dict] = []
    found.extend(as_list(entry.get("profiles")))
    for link in as_list(entry.get("infoLinks")):
        if not isinstance(link, dict) or link.get("type") != "profile":
            continue
        profile = profiles_by_id.get(str(link.get("targetId") or ""))
        if profile:
            found.append(profile)
    model = model_entry(entry)
    if model and model is not entry:
        found.extend(linked_profiles(model, profiles_by_id))
    return found


def model_entry(unit: dict) -> dict | None:
    for entry in as_list(unit.get("selectionEntries")):
        if isinstance(entry, dict) and entry.get("type") == "model":
            return entry
    if pts(unit) is not None:
        return unit
    for entry in as_list(unit.get("selectionEntries")):
        if isinstance(entry, dict) and pts(entry) is not None:
            return entry
    for link in as_list(unit.get("entryLinks")):
        if isinstance(link, dict) and pts(link) is not None:
            return link
    return None


def unit_points(unit: dict, model: dict | None) -> int | None:
    if model:
        cost = pts(model)
        if cost is not None:
            return cost
    cost = pts(unit)
    if cost is not None:
        return cost
    for link in as_list(unit.get("entryLinks")):
        if isinstance(link, dict) and pts(link) is not None:
            return pts(link)
    return None


def model_bounds(model: dict, category: str) -> tuple[int, int]:
    minimum = 1
    maximum: int | None = None
    for constraint in as_list(model.get("constraints")):
        if not isinstance(constraint, dict):
            continue
        if constraint.get("field") != "selections":
            continue
        value = int(float(constraint.get("value") or 0))
        if constraint.get("type") == "min":
            minimum = value
        if constraint.get("type") == "max" and value > 0:
            maximum = value
    if maximum is None:
        maximum = 1 if category == "characters" else max(minimum, 40)
    return minimum, maximum


def has_detachment_group(unit: dict) -> bool:
    for root in (unit, model_entry(unit) or {}):
        for group in as_list(root.get("selectionEntryGroups")):
            name = str(group.get("name") or "").lower()
            if "detach" in name or "detatch" in name:
                return True
    return False


def primary_category(link: dict) -> str | None:
    for item in as_list(link.get("categoryLinks")):
        if isinstance(item, dict) and item.get("primary"):
            return FORCE_ORG.get(str(item.get("name") or ""))
    return None


def option_pick(name: str, cost: int | None) -> dict:
    return {
        "id": slug(name or "option"),
        "name": name or "Option",
        "points": cost or 0,
    }


def entry_model_stats(
    entry: dict, profiles_by_id: dict[str, dict]
) -> dict[str, str] | None:
    profiles = linked_profiles(entry, profiles_by_id)
    return profile_stats(profiles)


def entry_special_rules(
    entry: dict,
    profiles_by_id: dict[str, dict],
    rules_by_id: dict[str, dict],
) -> list[dict]:
    rules = special_rules_for(entry, profiles_by_id, rules_by_id)
    seen = {str(rule["name"]).lower() for rule in rules}

    def add(name: str, text: str) -> None:
        key = name.lower()
        if not name or key in seen:
            return
        seen.add(key)
        rules.append({"name": name, "text": text})

    for profile in linked_profiles(entry, profiles_by_id):
        if profile.get("typeName") != "Special Rule":
            continue
        name = str(profile.get("name") or "")
        text = ""
        for item in as_list(profile.get("characteristics")):
            if not isinstance(item, dict):
                continue
            if item.get("name") in ("Description", "Notes"):
                text = str(item.get("$text") or "")
                break
        add(name, text)

    for link in as_list(entry.get("infoLinks")):
        if not isinstance(link, dict) or link.get("type") != "rule":
            continue
        target = rules_by_id.get(str(link.get("targetId") or ""))
        if not target:
            continue
        add(
            str(link.get("name") or target.get("name") or ""),
            str(target.get("description") or ""),
        )

    return rules


def enrich_pick_from_entry(
    pick: dict,
    entry: dict | None,
    profiles_by_id: dict[str, dict],
    rules_by_id: dict[str, dict],
) -> dict:
    if not entry:
        return pick
    stats = entry_model_stats(entry, profiles_by_id)
    if stats:
        pick["stats"] = stats
    rules = entry_special_rules(entry, profiles_by_id, rules_by_id)
    if rules:
        pick["specialRules"] = rules
    return pick


def collect_picks_from_group(
    group: dict,
    shared: dict[str, dict],
    groups: dict[str, dict],
    libraries: dict[str, dict],
    profiles_by_id: dict[str, dict] | None = None,
    rules_by_id: dict[str, dict] | None = None,
) -> list[dict]:
    picks: list[dict] = []
    seen: set[str] = set()
    profiles_by_id = profiles_by_id or {}
    rules_by_id = rules_by_id or {}

    def add_pick(pick: dict) -> None:
        if pick["id"] in seen:
            return
        seen.add(pick["id"])
        picks.append(pick)

    def add(
        name: str,
        cost: int | None,
        entry: dict | None = None,
    ) -> None:
        pick = option_pick(name, cost)
        add_pick(
            enrich_pick_from_entry(pick, entry, profiles_by_id, rules_by_id)
        )

    for entry in as_list(group.get("selectionEntries")):
        if isinstance(entry, dict):
            add(str(entry.get("name") or "Option"), pts(entry), entry)

    for link in as_list(group.get("entryLinks")):
        if not isinstance(link, dict):
            continue
        name = str(link.get("name") or "Option")
        cost = pts(link)
        target_id = str(link.get("targetId") or "")
        target = shared.get(target_id)
        if cost is None and target:
            cost = pts(target)
        if link.get("type") == "selectionEntryGroup" or target_id in groups:
            nested = groups.get(target_id)
            if nested:
                for pick in collect_picks_from_group(
                    nested,
                    shared,
                    groups,
                    libraries,
                    profiles_by_id,
                    rules_by_id,
                ):
                    add_pick(pick)
                continue
            for lib in libraries.values():
                nested = lib["groups"].get(target_id)
                if nested:
                    lib_profiles = {
                        **profiles_by_id,
                        **lib.get("profiles", {}),
                    }
                    lib_rules = {**rules_by_id, **lib.get("rules", {})}
                    for pick in collect_picks_from_group(
                        nested,
                        lib["shared"],
                        lib["groups"],
                        {},
                        lib_profiles,
                        lib_rules,
                    ):
                        add_pick(pick)
                    break
            continue
        add(name, cost, target)

    for nested in as_list(group.get("selectionEntryGroups")):
        if not isinstance(nested, dict):
            continue
        for pick in collect_picks_from_group(
            nested,
            shared,
            groups,
            libraries,
            profiles_by_id,
            rules_by_id,
        ):
            add_pick(pick)

    return picks


def command_options(
    unit: dict,
    shared: dict[str, dict],
    groups: dict[str, dict],
) -> list[dict]:
    options: list[dict] = []
    seen: set[str] = set()
    roots = [unit]
    model = model_entry(unit)
    if model and model is not unit:
        roots.append(model)
    for root in roots:
        for group in as_list(root.get("selectionEntryGroups")):
            if not isinstance(group, dict):
                continue
            if "command" not in str(group.get("name") or "").lower():
                continue
            for pick in collect_picks_from_group(group, shared, groups, {}):
                # General is handled by Make general UI — keep BSB etc.
                if pick["id"] == "general":
                    continue
                if pick["id"] in seen:
                    continue
                seen.add(pick["id"])
                options.append(pick)
    return options


def is_magic_items_link(name: str) -> bool:
    return "magic item" in name.lower()


def is_skip_group(name: str) -> bool:
    lower = name.lower()
    return any(token in lower for token in SKIP_GROUP_TOKENS)


def option_groups_for_unit(
    unit: dict,
    shared: dict[str, dict],
    groups: dict[str, dict],
    libraries: dict[str, dict],
    profiles_by_id: dict[str, dict] | None = None,
    rules_by_id: dict[str, dict] | None = None,
) -> tuple[list[dict], bool]:
    result: list[dict] = []
    seen_group: set[str] = set()
    magic_items = False
    profiles_by_id = profiles_by_id or {}
    rules_by_id = rules_by_id or {}
    roots = [unit]
    model = model_entry(unit)
    if model and model is not unit:
        roots.append(model)

    def add_group(name: str, picks: list[dict]) -> None:
        if not picks:
            return
        group_id = slug(name or "options")
        if group_id in seen_group:
            # Merge unique picks into existing group.
            existing = next(g for g in result if g["id"] == group_id)
            have = {o["id"] for o in existing["options"]}
            for pick in picks:
                if pick["id"] not in have:
                    existing["options"].append(pick)
            return
        seen_group.add(group_id)
        result.append({"id": group_id, "name": name, "options": picks})

    for root in roots:
        for group in as_list(root.get("selectionEntryGroups")):
            if not isinstance(group, dict):
                continue
            name = str(group.get("name") or "Options")
            if is_skip_group(name):
                continue
            if is_magic_items_link(name):
                magic_items = True
                continue
            picks = collect_picks_from_group(
                group,
                shared,
                groups,
                libraries,
                profiles_by_id,
                rules_by_id,
            )
            add_group(name, picks)

        for link in as_list(root.get("entryLinks")):
            if not isinstance(link, dict):
                continue
            name = str(link.get("name") or "Option")
            if is_magic_items_link(name):
                magic_items = True
                continue
            target_id = str(link.get("targetId") or "")
            # Shared option groups (Kindreds, Enchanted Arrows, Forest Sprites).
            if link.get("type") == "selectionEntryGroup" or target_id in groups:
                nested = groups.get(target_id)
                if nested:
                    picks = collect_picks_from_group(
                        nested,
                        shared,
                        groups,
                        libraries,
                        profiles_by_id,
                        rules_by_id,
                    )
                    add_group(str(nested.get("name") or name), picks)
                    continue
                for lib in libraries.values():
                    nested = lib["groups"].get(target_id)
                    if nested:
                        if is_magic_items_link(str(nested.get("name") or name)):
                            magic_items = True
                            break
                        lib_profiles = {
                            **profiles_by_id,
                            **lib.get("profiles", {}),
                        }
                        lib_rules = {**rules_by_id, **lib.get("rules", {})}
                        picks = collect_picks_from_group(
                            nested,
                            lib["shared"],
                            lib["groups"],
                            {},
                            lib_profiles,
                            lib_rules,
                        )
                        add_group(str(nested.get("name") or name), picks)
                        break
                continue
            # Free gear with a points cost (Shield, etc.).
            cost = pts(link)
            if cost is None:
                continue
            # Skip free default gear at 0 pts that is always-on (Hand Weapon).
            if cost == 0 and name.lower() in {
                "hand weapon",
                "light armour",
                "asrai longbow",
            }:
                continue
            add_group("Equipment", [option_pick(name, cost)])

    return result, magic_items


def special_rules_for(
    unit: dict, profiles_by_id: dict[str, dict], rules_by_id: dict[str, dict]
) -> list[dict]:
    rules: list[dict] = []
    seen: set[str] = set()

    def add(name: str, text: str) -> None:
        key = name.lower()
        if not name or key in seen:
            return
        seen.add(key)
        rules.append({"name": name, "text": text})

    def collect_from(root: dict) -> None:
        for group in as_list(root.get("infoGroups")):
            if not isinstance(group, dict):
                continue
            if "special" not in str(group.get("name") or "").lower():
                continue
            for link in as_list(group.get("infoLinks")):
                if not isinstance(link, dict):
                    continue
                name = str(link.get("name") or "")
                text = ""
                target_id = str(link.get("targetId") or "")
                profile = profiles_by_id.get(target_id)
                if profile:
                    for item in as_list(profile.get("characteristics")):
                        if not isinstance(item, dict):
                            continue
                        if item.get("name") in ("Description", "Notes"):
                            text = str(item.get("$text") or "")
                            break
                    if not name:
                        name = str(profile.get("name") or "")
                rule = rules_by_id.get(target_id)
                if rule and not text:
                    text = str(rule.get("description") or "")
                    if not name:
                        name = str(rule.get("name") or "")
                add(name, text)

    roots = [unit]
    for entry in as_list(unit.get("selectionEntries")):
        if isinstance(entry, dict) and entry.get("type") == "model":
            roots.append(entry)
    # Fallback when the unit itself is the model.
    if len(roots) == 1:
        model = model_entry(unit)
        if model and model is not unit:
            roots.append(model)

    for root in roots:
        collect_from(root)
    return rules


def weapons_for(
    unit: dict,
    profiles_by_id: dict[str, dict],
    shared: dict[str, dict] | None = None,
) -> list[dict]:
    weapons: list[dict] = []
    seen: set[str] = set()
    shared = shared or {}

    def add_profile(profile: dict) -> None:
        if profile.get("typeName") != "Weapon":
            return
        name = str(profile.get("name") or "")
        if not name or name.lower() in seen:
            return
        seen.add(name.lower())
        chars = {
            str(item.get("name")): str(item.get("$text") or "")
            for item in as_list(profile.get("characteristics"))
            if isinstance(item, dict) and item.get("name")
        }
        weapons.append(
            {
                "name": name,
                "range": chars.get("R") or chars.get("Range") or "",
                "strength": chars.get("S") or chars.get("Strength") or "",
                "ap": chars.get("AP") or "",
                "specialRules": chars.get("Special Rules") or "",
            }
        )

    def walk_entry(entry: dict, depth: int = 0) -> None:
        if depth > 4 or not isinstance(entry, dict):
            return
        for profile in as_list(entry.get("profiles")):
            if isinstance(profile, dict):
                add_profile(profile)
        for group in as_list(entry.get("infoGroups")):
            if not isinstance(group, dict):
                continue
            for link in as_list(group.get("infoLinks")):
                if not isinstance(link, dict) or link.get("type") != "profile":
                    continue
                profile = profiles_by_id.get(str(link.get("targetId") or ""))
                if profile:
                    add_profile(profile)
        for link in as_list(entry.get("infoLinks")):
            if not isinstance(link, dict) or link.get("type") != "profile":
                continue
            profile = profiles_by_id.get(str(link.get("targetId") or ""))
            if profile:
                add_profile(profile)
        for child in as_list(entry.get("selectionEntries")):
            if isinstance(child, dict):
                walk_entry(child, depth + 1)
        for group in as_list(entry.get("selectionEntryGroups")):
            if not isinstance(group, dict):
                continue
            for child in as_list(group.get("selectionEntries")):
                if isinstance(child, dict):
                    walk_entry(child, depth + 1)
            for link in as_list(group.get("entryLinks")):
                if not isinstance(link, dict):
                    continue
                target = shared.get(str(link.get("targetId") or ""))
                if target:
                    walk_entry(target, depth + 1)

    walk_entry(unit)
    # Default infantry kit when the unit only links options from the GST.
    if not weapons:
        hand = next(
            (
                profile
                for profile in profiles_by_id.values()
                if profile.get("typeName") == "Weapon"
                and str(profile.get("name") or "") == "Hand Weapon"
            ),
            None,
        )
        if hand:
            add_profile(hand)
    return weapons


def character_can_join(troop: str, unit_size: str, character: bool) -> bool:
    if not character:
        return False
    # Multi-model named characters (Orion 3*) are their own unit.
    if "*" in unit_size or (unit_size and unit_size not in ("1", "1+")):
        try:
            if int(re.sub(r"[^\d].*", "", unit_size) or "1") > 1:
                return False
        except ValueError:
            if "*" in unit_size:
                return False
    lower = troop.lower()
    if any(token in lower for token in ("behemoth", "monster", "chariot", "war machine", "warbeast", "war beast")):
        return False
    return any(token in lower for token in JOINABLE_TROOP)


def parent_core_stem(journal_stem: str) -> str | None:
    """Map 'Wood Elf Realms - Host of Talsyn' → 'Wood Elf Realms'."""
    if " - " not in journal_stem:
        return None
    prefix = journal_stem.split(" - ", 1)[0].strip()
    # Typo in upstream file name.
    if prefix == "Beastmen Breyherds":
        prefix = "Beastmen Brayherds"
    if prefix == "Kingdom of Bretonnia":
        return "Bretonnians"
    if prefix.startswith("Orcs and Goblins"):
        return "Orc and Goblin Tribes"
    if prefix.startswith("Tomb Kings"):
        return "Tomb Kings of Khemri"
    if prefix in CORE_STEMS:
        return prefix
    return None


def extract_faction(
    path: Path,
    libraries: dict[str, dict],
    *,
    journal: bool = False,
    parent_indexed: dict | None = None,
) -> dict:
    catalogue = load_catalogue(path)
    indexed = index_catalogue(catalogue)
    shared = dict(indexed["shared"])
    groups = dict(indexed["groups"])
    profiles_by_id = dict(indexed["profiles"])
    rules_by_id = dict(indexed["rules"])
    if parent_indexed:
        for key, entry in parent_indexed["shared"].items():
            shared.setdefault(key, entry)
        for key, group in parent_indexed["groups"].items():
            groups.setdefault(key, group)
        for key, profile in parent_indexed["profiles"].items():
            profiles_by_id.setdefault(key, profile)
        for key, rule in parent_indexed["rules"].items():
            rules_by_id.setdefault(key, rule)
    # Merge library profiles for rule text when linked.
    for lib in libraries.values():
        for key, entry in lib["shared"].items():
            shared.setdefault(key, entry)
        for key, group in lib["groups"].items():
            groups.setdefault(key, group)
        for key, profile in lib["profiles"].items():
            profiles_by_id.setdefault(key, profile)
        for key, rule in lib["rules"].items():
            rules_by_id.setdefault(key, rule)

    units: list[dict] = []
    seen: set[str] = set()
    for link in as_list(catalogue.get("entryLinks")):
        if not isinstance(link, dict):
            continue
        category = primary_category(link)
        if not category:
            continue
        target = shared.get(str(link.get("targetId") or ""))
        if not target:
            continue
        unit_id = slug(target.get("name") or link.get("name") or "unit")
        if unit_id in seen:
            continue
        seen.add(unit_id)
        model = model_entry(target)
        cost = unit_points(target, model)
        if cost is None:
            cost = pts(link)
        if cost is None:
            continue
        minimum, maximum = model_bounds(model or target, category)
        profiles = linked_profiles(target, profiles_by_id)
        stats = profile_stats(profiles)
        troop, size = troop_type_and_size(
            as_list(target.get("profiles"))
            + ([p for p in profiles if isinstance(p, dict)])
        )
        character = category == "characters"
        option_groups, magic_items = option_groups_for_unit(
            target,
            shared,
            groups,
            libraries,
            profiles_by_id,
            rules_by_id,
        )
        units.append(
            {
                "id": unit_id,
                "name": target.get("name") or link.get("name"),
                "category": category,
                "pointsPerModel": cost,
                "minModels": minimum,
                "maxModels": maximum,
                "character": character,
                "canTakeDetachments": has_detachment_group(target),
                "canJoinUnits": character_can_join(troop, size, character),
                "troopType": troop,
                "magicItems": magic_items,
                "command": command_options(target, shared, groups),
                "optionGroups": option_groups,
                "specialRules": special_rules_for(
                    target, profiles_by_id, rules_by_id
                ),
                "weapons": weapons_for(target, profiles_by_id, shared),
                "stats": stats
                or {
                    "M": "",
                    "WS": "",
                    "BS": "",
                    "S": "",
                    "T": "",
                    "W": "1",
                    "I": "",
                    "A": "",
                    "Ld": "",
                },
            }
        )

    faction_id = slug(str(catalogue.get("name") or path.stem))
    # Bretonnians catalogue → kingdom-of-bretonnia for stable app ids.
    if faction_id == "bretonnians":
        faction_id = "kingdom-of-bretonnia"
    return {
        "id": faction_id,
        "name": catalogue.get("name") or path.stem,
        "game": "The Old World",
        "source": SOURCE,
        "pointsCapDefault": 2000,
        "journal": journal,
        "units": units,
    }


def extract_magic_items(path: Path) -> dict:
    catalogue = load_catalogue(path)
    indexed = index_catalogue(catalogue)
    root = indexed["groups"].get("1539-fd78-88f-badd")
    categories: list[dict] = []
    if root:
        for link in as_list(root.get("entryLinks")):
            if not isinstance(link, dict):
                continue
            group = indexed["groups"].get(str(link.get("targetId") or ""))
            if not group:
                continue
            picks = collect_picks_from_group(
                group, indexed["shared"], indexed["groups"], {}
            )
            categories.append(
                {
                    "id": slug(str(group.get("name") or link.get("name"))),
                    "name": group.get("name") or link.get("name"),
                    "options": picks,
                }
            )
    return {
        "id": "magic-items",
        "name": "Magic Items",
        "game": "The Old World",
        "source": SOURCE,
        "categories": categories,
    }


def extract_lores(path: Path) -> dict:
    catalogue = load_catalogue(path)
    indexed = index_catalogue(catalogue)
    lores = [
        {"id": slug(str(entry.get("name") or "lore")), "name": entry.get("name")}
        for entry in indexed["shared"].values()
    ]
    lores.sort(key=lambda item: str(item["name"]))
    return {
        "id": "lores-of-magic",
        "name": "The Lores of Magic",
        "game": "The Old World",
        "source": SOURCE,
        "lores": lores,
    }


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    paths = sorted(DATA.glob("*.json"))
    if not paths:
        print(f"No catalogues in {DATA}", file=sys.stderr)
        return 1

    libraries: dict[str, dict] = {}
    core_index: dict[str, dict] = {}
    magic_path = DATA / "Common Magic Items.json"
    lores_path = DATA / "The Lores of Magic.json"
    gst_path = DATA / f"{GST_STEM}.json"
    if gst_path.exists():
        libraries["gst"] = index_catalogue(load_catalogue(gst_path))
        print(f"Loaded GST profiles ({len(libraries['gst']['profiles'])})")
        common_names = sorted(
            {
                str(profile.get("name") or "")
                for profile in libraries["gst"]["profiles"].values()
                if isinstance(profile, dict)
                and profile.get("typeName") == "Special Rule"
                and profile.get("name")
            }
        )
        (OUT_DIR / "common-special-rules.json").write_text(
            json.dumps({"names": common_names}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote common special rules ({len(common_names)})")
    if magic_path.exists():
        libraries["magic-items"] = index_catalogue(load_catalogue(magic_path))
        magic = extract_magic_items(magic_path)
        (OUT_DIR / "magic-items.json").write_text(
            json.dumps(magic, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Wrote Magic Items ({sum(len(c['options']) for c in magic['categories'])} items)")
    if lores_path.exists():
        libraries["lores"] = index_catalogue(load_catalogue(lores_path))
        lores = extract_lores(lores_path)
        (OUT_DIR / "lores-of-magic.json").write_text(
            json.dumps(lores, indent=2) + "\n", encoding="utf-8"
        )
        print(f"Wrote Lores ({len(lores['lores'])})")

    written: list[str] = []
    faction_ids: list[str] = []
    journal_ids: list[str] = []

    # Pass 1: core armies (also cache indexes for journals).
    for path in paths:
        stem = path.stem
        if stem not in CORE_STEMS:
            continue
        core_index[stem] = index_catalogue(load_catalogue(path))
        faction = extract_faction(path, libraries, journal=False)
        out = OUT_DIR / f"{faction['id']}.json"
        out.write_text(json.dumps(faction, indent=2) + "\n", encoding="utf-8")
        faction_ids.append(str(faction["id"]))
        written.append(f"{faction['name']} ({len(faction['units'])} units)")

    # Pass 2: Arcane Journals / composition lists.
    for path in paths:
        stem = path.stem
        if stem in CORE_STEMS or stem in LIBRARY_STEMS:
            continue
        if " - " not in stem and stem not in JOURNAL_STEMS:
            continue
        parent_stem = parent_core_stem(stem)
        parent = core_index.get(parent_stem) if parent_stem else None
        faction = extract_faction(
            path, libraries, journal=True, parent_indexed=parent
        )
        if not faction["units"]:
            continue
        out = OUT_DIR / f"{faction['id']}.json"
        out.write_text(json.dumps(faction, indent=2) + "\n", encoding="utf-8")
        journal_ids.append(str(faction["id"]))
        written.append(f"[journal] {faction['name']} ({len(faction['units'])})")

    faction_ids = sorted(set(faction_ids))
    journal_ids = sorted(set(journal_ids))
    (OUT_DIR / "index.json").write_text(
        json.dumps(
            {"factions": faction_ids, "journals": journal_ids},
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    if not faction_ids:
        print(f"No core catalogues matched in {DATA}", file=sys.stderr)
        return 1
    print("Wrote", ", ".join(written))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
