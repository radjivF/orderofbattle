import type {
  AnvilForgeGroup,
  AnvilRank,
  CatalogueUnit,
  Selection,
  UnitAbility,
  UnitStats,
  UnitWeapon,
} from "../types";
import { applyWarscrollInstruction, bumpStat } from "./anvilWarscroll";

export type { AnvilForgeGroup, AnvilRank };

export function isAnvilOfApotheosis(
  unit: Pick<CatalogueUnit, "name" | "pathToGloryOnly">,
): boolean {
  return (
    Boolean(unit.pathToGloryOnly) ||
    unit.name.startsWith("Anvil of Apotheosis")
  );
}

/** Extract `unique` is a roster cap of one. Anvil is a custom hero, not UNIQUE. */
export function uniqueKeywordBlocksEnhancements(
  unit: Pick<CatalogueUnit, "unique" | "name" | "pathToGloryOnly">,
): boolean {
  return Boolean(unit.unique) && !isAnvilOfApotheosis(unit);
}

export function anvilForgeGroups(unit: CatalogueUnit): AnvilForgeGroup[] {
  return unit.anvilForge ?? [];
}

export function anvilRankForSelection(
  unit: CatalogueUnit,
  selection?: Selection | null,
): AnvilRank | undefined {
  const ranks = unit.anvilRanks ?? [];
  if (!ranks.length) {
    return undefined;
  }
  const picked = selection?.pathToGlory?.anvilRankId;
  return ranks.find((rank) => rank.id === picked) ?? ranks[0];
}

export function anvilPickIds(selection?: Selection | null): string[] {
  return selection?.pathToGlory?.anvilPickIds ?? [];
}

export function isBattleMountGroup(group: AnvilForgeGroup): boolean {
  return /^battle mount$/i.test(group.name.trim());
}

export function isBattleMountUpgradeGroup(group: AnvilForgeGroup): boolean {
  return /mount upgrade/i.test(group.name);
}

export function visibleAnvilForgeGroups(
  unit: CatalogueUnit,
  pickIds: readonly string[],
): AnvilForgeGroup[] {
  const groups = anvilForgeGroups(unit);
  const mountGroup = groups.find(isBattleMountGroup);
  if (!mountGroup) {
    return groups;
  }
  const hasMount = mountGroup.options.some((option) =>
    pickIds.includes(option.id),
  );
  if (hasMount) {
    return groups;
  }
  return groups.filter((group) => !isBattleMountUpgradeGroup(group));
}

export function anvilForgeSummary(
  unit: CatalogueUnit,
  selection?: Selection | null,
): string {
  const rank = anvilRankForSelection(unit, selection);
  const remaining = anvilDestinyRemaining(unit, selection);
  const budget = anvilDestinyBudget(unit, selection);
  const rankBit = rank
    ? `${rank.name} · ${rank.points} pts`
    : `${unit.points} pts`;
  return `${rankBit} · ${remaining} / ${budget} dest`;
}

export function anvilDestinyBudget(
  unit: CatalogueUnit,
  selection?: Selection | null,
): number {
  return anvilRankForSelection(unit, selection)?.destiny ?? 0;
}

export function anvilDestinyRemaining(
  unit: CatalogueUnit,
  selection?: Selection | null,
): number {
  let remaining = anvilDestinyBudget(unit, selection);
  const picks = new Set(anvilPickIds(selection));
  for (const group of anvilForgeGroups(unit)) {
    for (const option of group.options) {
      if (picks.has(option.id)) {
        remaining += option.destiny;
      }
    }
  }
  return remaining;
}

export function pickAnvilOption(
  unit: CatalogueUnit,
  pickIds: string[],
  groupId: string,
  optionId: string,
): string[] {
  const group = anvilForgeGroups(unit).find((item) => item.id === groupId);
  if (!group) {
    return pickIds;
  }
  const inGroup = new Set(group.options.map((item) => item.id));
  const others = pickIds.filter((id) => !inGroup.has(id));
  const selected = pickIds.filter((id) => inGroup.has(id));
  if (group.max === 1) {
    if (selected.includes(optionId)) {
      return others;
    }
    return [...others, optionId];
  }
  if (selected.includes(optionId)) {
    return pickIds.filter((id) => id !== optionId);
  }
  return [...pickIds, optionId];
}

function uniqueByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.name)) {
      continue;
    }
    seen.add(item.name);
    out.push(item);
  }
  return out;
}

function applyStatAdds(
  stats: UnitStats,
  adds: { move: number; health: number; control: number },
): UnitStats {
  return {
    ...stats,
    move: bumpStat(stats.move, adds.move),
    health: bumpStat(stats.health, adds.health),
    control: bumpStat(stats.control, adds.control),
  };
}

export function resolveAnvilUnit(
  unit: CatalogueUnit,
  selection?: Selection | null,
): CatalogueUnit {
  const groups = anvilForgeGroups(unit);
  if (!isAnvilOfApotheosis(unit) || groups.length === 0) {
    return unit;
  }
  const picks = new Set(anvilPickIds(selection));
  const forgeAbilityNames = new Set<string>();
  const forgeWeaponNames = new Set<string>();
  const pickedAbilities: UnitAbility[] = [];
  const pickedWeapons: UnitWeapon[] = [];
  let stats: UnitStats = { ...unit.stats };
  const adds = { move: 0, health: 0, control: 0 };

  for (const group of groups) {
    for (const option of group.options) {
      for (const ability of option.abilities) {
        forgeAbilityNames.add(ability.name);
      }
      forgeAbilityNames.add(option.name);
      for (const weapon of option.weapons) {
        forgeWeaponNames.add(weapon.name);
      }
      if (!picks.has(option.id)) {
        continue;
      }
      if (option.abilities.length > 0) {
        pickedAbilities.push(...option.abilities);
      } else {
        const dumped = unit.abilities.find((item) => item.name === option.name);
        if (dumped) {
          pickedAbilities.push(dumped);
        }
      }
      pickedWeapons.push(...option.weapons);
      if (option.stats) {
        stats = { ...stats, ...option.stats };
      }
      adds.move += option.statAdds?.move ?? 0;
      adds.health += option.statAdds?.health ?? 0;
      adds.control += option.statAdds?.control ?? 0;
    }
  }

  let categories = [...unit.categories];
  let weapons = uniqueByName([
    ...unit.weapons.filter((item) => !forgeWeaponNames.has(item.name)),
    ...pickedWeapons,
  ]);
  const keptAbilities: UnitAbility[] = [];
  for (const ability of pickedAbilities) {
    const applied = applyWarscrollInstruction(
      ability.effect,
      categories,
      weapons,
    );
    categories = applied.categories;
    weapons = applied.weapons;
    if (applied.keep) {
      keptAbilities.push(ability);
    }
  }

  return {
    ...unit,
    categories,
    stats: applyStatAdds(stats, adds),
    abilities: uniqueByName([
      ...unit.abilities.filter((item) => !forgeAbilityNames.has(item.name)),
      ...keptAbilities,
    ]),
    weapons,
  };
}
