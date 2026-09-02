import type {
  TowCatalogueUnit,
  TowCategory,
  TowFactionCatalogue,
  TowMagicItemsCatalogue,
  TowNamedOption,
  TowSpecialRule,
  TowStats,
} from "./types";
import {
  allTowArmies,
  commonSpecialRuleNames,
  factions,
  journals,
  loresCatalogue,
  magicItemsCatalogue,
} from "../data/tow/load";

const PROFILE_KEYS: readonly (keyof TowStats)[] = [
  "M",
  "WS",
  "BS",
  "S",
  "T",
  "W",
  "I",
  "A",
  "Ld",
];

const FACTIONS: TowFactionCatalogue[] = [...factions].sort((a, b) =>
  a.name.localeCompare(b.name),
);

const JOURNALS: TowFactionCatalogue[] = [...journals].sort((a, b) =>
  a.name.localeCompare(b.name),
);

const ALL_ARMIES: TowFactionCatalogue[] = [...allTowArmies].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function listTowFactions(): TowFactionCatalogue[] {
  return FACTIONS;
}

export function listTowJournals(): TowFactionCatalogue[] {
  return JOURNALS;
}

export function listTowArmies(): TowFactionCatalogue[] {
  return ALL_ARMIES;
}

export function getTowFaction(id: string): TowFactionCatalogue | undefined {
  return ALL_ARMIES.find((faction) => faction.id === id);
}

export function getTowUnit(faction: TowFactionCatalogue, unitId: string) {
  return faction.units.find((unit) => unit.id === unitId);
}

export function towUnitsInCategory(
  faction: TowFactionCatalogue,
  category: TowCategory,
) {
  return faction.units.filter((unit) => unit.category === category);
}

export function towProfileLine(stats: TowStats): string {
  return PROFILE_KEYS.map((key) => `${key} ${stats[key]}`).join(" · ");
}

export function towCharacterCanJoinUnits(unit: TowCatalogueUnit): boolean {
  return Boolean(unit.character && unit.canJoinUnits);
}

export function getTowMagicItems(): TowMagicItemsCatalogue {
  return magicItemsCatalogue;
}

export function getTowLores() {
  return loresCatalogue;
}

export function findTowMagicItem(
  itemId: string,
): TowNamedOption | undefined {
  for (const category of magicItemsCatalogue.categories) {
    const item = category.options.find((option) => option.id === itemId);
    if (item) {
      return item;
    }
  }
  return undefined;
}

/** Split army-book / unit rules from core Old World special rules. */
export function partitionTowSpecialRules(rules: TowSpecialRule[]): {
  unit: TowSpecialRule[];
  common: TowSpecialRule[];
} {
  const unit: TowSpecialRule[] = [];
  const common: TowSpecialRule[] = [];
  for (const rule of rules) {
    if (commonSpecialRuleNames.has(rule.name)) {
      common.push(rule);
    } else {
      unit.push(rule);
    }
  }
  return { unit, common };
}

export function woundsCharacteristic(raw: string): number {
  const match = raw.match(/\d+/);
  if (!match) {
    return 1;
  }
  return Math.max(1, Number.parseInt(match[0], 10));
}
