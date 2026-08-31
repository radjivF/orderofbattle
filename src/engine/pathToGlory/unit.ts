import type { CatalogueUnit, Selection, UnitAbility } from "../types";
import { resolveAnvilUnit } from "./anvil";
import { findPath, findPathOption } from "./catalogue";

/** Warscroll for a list slot: Anvil picks plus chosen Path abilities. */
export function resolvePathToGloryUnit(
  unit: CatalogueUnit,
  selection?: Selection | null,
): CatalogueUnit {
  const anvil = resolveAnvilUnit(unit, selection);
  const pathAbilities = pickedPathAbilities(selection);
  if (pathAbilities.length === 0) {
    return anvil;
  }
  const seen = new Set(anvil.abilities.map((ability) => ability.name));
  const extra: UnitAbility[] = [];
  for (const ability of pathAbilities) {
    if (seen.has(ability.name)) {
      continue;
    }
    seen.add(ability.name);
    extra.push(ability);
  }
  if (extra.length === 0) {
    return anvil;
  }
  return {
    ...anvil,
    abilities: [...anvil.abilities, ...extra],
  };
}

function pickedPathAbilities(selection?: Selection | null): UnitAbility[] {
  const state = selection?.pathToGlory;
  if (!state) {
    return [];
  }
  const path = findPath(state.pathId);
  if (!path) {
    return [];
  }
  return state.pathOptionIds
    .map((optionId) => findPathOption(path, optionId)?.ability)
    .filter((ability): ability is UnitAbility => ability != null);
}
