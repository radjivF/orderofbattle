import {
  auxiliaryPickerUnits,
  getListUnit,
  getRegimentOfRenown,
  getUnit,
  heroesOf,
  legalCompanions,
  unitBaseName,
  unitScourgeRealm,
} from "@/engine/queries";
import type { ArmyList, CatalogueUnit, FactionCatalogue } from "@/engine/types";
import { isPathToGloryList } from "@/engine/pathToGlory/packs";
import { isAnvilOfApotheosis } from "@/engine/pathToGlory/anvil";

export type ListPicker =
  | { kind: "hero"; regimentId?: string }
  | { kind: "unit"; regimentId: string }
  | { kind: "aux" }
  | { kind: "ror" }
  | { kind: "artefact"; heroSelectionId: string }
  | { kind: "trait"; heroSelectionId: string }
  | { kind: "monstrous"; heroSelectionId: string }
  | { kind: "vision"; heroSelectionId: string }
  | { kind: "special"; tableId: string; heroSelectionId: string }
  | null;

export function takenUniqueBases(
  list: ArmyList,
  faction: FactionCatalogue,
  exceptUnitId?: string,
): Set<string> {
  const bases = new Set<string>();
  const add = (unitId: string) => {
    const unit = getUnit(faction, unitId);
    if (unit?.unique) {
      bases.add(unitBaseName(unit.name));
    }
  };
  for (const regiment of list.regiments) {
    if (regiment.hero) {
      add(regiment.hero.unitId);
    }
    for (const slot of regiment.units) {
      add(slot.unitId);
    }
  }
  for (const slot of list.auxiliaries) {
    add(slot.unitId);
  }
  const ror = list.regimentOfRenown
    ? getRegimentOfRenown(list.regimentOfRenown.renownId)
    : undefined;
  for (const unit of ror?.units ?? []) {
    if (unit.unique) {
      bases.add(unitBaseName(unit.name));
    }
  }
  if (exceptUnitId) {
    const except = getUnit(faction, exceptUnitId);
    if (except?.unique) {
      bases.delete(unitBaseName(except.name));
    }
  }
  return bases;
}

export function availablePickerUnits(
  list: ArmyList,
  faction: FactionCatalogue,
  units: CatalogueUnit[],
  exceptUnitId?: string,
): CatalogueUnit[] {
  const taken = takenUniqueBases(list, faction, exceptUnitId);
  const pathToGlory = isPathToGloryList(list);
  // Da King's Gitz is an Army of Renown (faction), not a Regiment of Renown
  const isDaKingsGitz = faction.id === "gloomspite-gitz-da-king-s-gitz";
  
  // Gloomspite XOR: detect if list already has TROGGOTH or non-TROGGOTH units
  let gloomspiteHasTrogg = false;
  let gloomspiteHasGrot = false;
  if (pathToGlory && faction.id === "gloomspite-gitz") {
    const allUnits: CatalogueUnit[] = [];
    for (const regiment of list.regiments) {
      const hero = regiment.hero
        ? getListUnit(list, faction, regiment.hero.unitId)
        : null;
      if (hero) {
        allUnits.push(hero);
      }
      for (const slot of regiment.units) {
        const unit = getListUnit(list, faction, slot.unitId);
        if (unit) {
          allUnits.push(unit);
        }
      }
    }
    for (const slot of list.auxiliaries) {
      const unit = getListUnit(list, faction, slot.unitId);
      if (unit) {
        allUnits.push(unit);
      }
    }
    gloomspiteHasTrogg = allUnits.some((u) =>
      u.id !== exceptUnitId && u.categories.includes("TROGGOTH"),
    );
    gloomspiteHasGrot = allUnits.some((u) =>
      u.id !== exceptUnitId && !u.categories.includes("TROGGOTH"),
    );
  }
  
  return units.filter((unit) => {
    if (isAnvilOfApotheosis(unit) && !pathToGlory) {
      return false;
    }
    if (pathToGlory && unitScourgeRealm(unit.name)) {
      return false;
    }
    // Da King's Gitz: no TROGGOTH units in auxiliaries
    if (pathToGlory && isDaKingsGitz && unit.categories.includes("TROGGOTH")) {
      return false;
    }
    // Gloomspite XOR: once a type is chosen, block the other
    if (pathToGlory && faction.id === "gloomspite-gitz") {
      const isTrogg = unit.categories.includes("TROGGOTH");
      if (gloomspiteHasTrogg && !isTrogg) {
        return false; // Already have TROGGOTHs, block non-TROGGOTHs
      }
      if (gloomspiteHasGrot && isTrogg) {
        return false; // Already have grots, block TROGGOTHs
      }
    }
    return !unit.unique || !taken.has(unitBaseName(unit.name));
  });
}

export function pickerUnitsFor(
  list: ArmyList,
  faction: FactionCatalogue,
  picker: ListPicker,
): CatalogueUnit[] | null {
  if (!picker) {
    return null;
  }
  if (picker.kind === "hero") {
    const current = picker.regimentId
      ? list.regiments.find((item) => item.id === picker.regimentId)?.hero
          ?.unitId
      : undefined;
    return availablePickerUnits(list, faction, heroesOf(faction), current);
  }
  if (picker.kind === "aux") {
    return availablePickerUnits(list, faction, auxiliaryPickerUnits(faction));
  }
  if (picker.kind !== "unit") {
    return null;
  }
  const regiment = list.regiments.find((item) => item.id === picker.regimentId);
  const hero = regiment?.hero
    ? getUnit(faction, regiment.hero.unitId)
    : undefined;
  if (!hero) {
    return [];
  }
  return availablePickerUnits(list, faction, legalCompanions(faction, hero));
}

export function dropEnhancements(
  list: ArmyList,
  heroSelectionId?: string,
): ArmyList {
  if (!heroSelectionId) {
    return list;
  }
  return {
    ...list,
    artefact:
      list.artefact?.heroSelectionId === heroSelectionId ? null : list.artefact,
    heroicTrait:
      list.heroicTrait?.heroSelectionId === heroSelectionId
        ? null
        : list.heroicTrait,
    monstrousTrait:
      list.monstrousTrait?.heroSelectionId === heroSelectionId
        ? null
        : list.monstrousTrait,
    visionOfFate:
      list.visionOfFate?.heroSelectionId === heroSelectionId
        ? null
        : list.visionOfFate,
    specialEnhancements: (list.specialEnhancements ?? []).filter(
      (pick) => pick.heroSelectionId !== heroSelectionId,
    ),
  };
}
