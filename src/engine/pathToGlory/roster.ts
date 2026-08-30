import type { ArmyList, CatalogueUnit, PathToGlorySelectionState, Selection } from "../types";
import { findPath, findScar, findWound } from "./catalogue";

export function selectionDisplayName(
  selection: Selection | undefined,
  unit: CatalogueUnit | undefined,
): string {
  const nickname = selection?.nickname?.trim();
  if (nickname) {
    return nickname;
  }
  return unit?.name ?? "Unknown unit";
}

export function emptyPathToGlorySelection(): PathToGlorySelectionState {
  return {
    renown: 0,
    pathId: null,
    pathOptionIds: [],
    battleWoundId: null,
    scarId: null,
  };
}

export function mergePathToGlory(
  selection: Selection,
  patch: Partial<PathToGlorySelectionState>,
): Selection {
  return {
    ...selection,
    pathToGlory: {
      ...emptyPathToGlorySelection(),
      ...selection.pathToGlory,
      ...patch,
    },
  };
}

export function patchSelection(
  list: ArmyList,
  selectionId: string,
  patch: Partial<Selection>,
): ArmyList {
  const update = (slot: Selection | null): Selection | null => {
    if (!slot || slot.id !== selectionId) {
      return slot;
    }
    return { ...slot, ...patch };
  };
  return {
    ...list,
    regiments: list.regiments.map((regiment) => ({
      ...regiment,
      hero: update(regiment.hero),
      units: regiment.units.map((slot) => update(slot) ?? slot),
    })),
    auxiliaries: list.auxiliaries.map((slot) => update(slot) ?? slot),
    regimentOfRenown: list.regimentOfRenown
      ? {
          ...list.regimentOfRenown,
          units: list.regimentOfRenown.units.map(
            (slot) => update(slot) ?? slot,
          ),
        }
      : null,
  };
}

export function pathToGloryExportBits(selection: Selection): string[] {
  const bits: string[] = [];
  const state = selection.pathToGlory;
  if (!state) {
    return bits;
  }
  const path = findPath(state.pathId);
  if (path) {
    bits.push(path.name);
  }
  if (state.renown > 0) {
    bits.push(`${state.renown} renown`);
  }
  const wound = findWound(state.battleWoundId);
  if (wound) {
    bits.push(`Battle Wound: ${wound.name}`);
  }
  const scar = findScar(state.scarId);
  if (scar) {
    bits.push(`Scar: ${scar.name}`);
  }
  return bits;
}
