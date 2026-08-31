import type {
  ArmyList,
  CatalogueUnit,
  PathToGloryPackId,
  PathToGlorySelectionState,
  PathToGloryState,
  Selection,
} from "../types";
import { findPath, findScar, findWound, pathsForPacks } from "./catalogue";
import { isPathToGloryList, normalizePackIds, normalizePathToGloryState } from "./packs";
import { prunePathOptionIds } from "./pathOptions";

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
    anvilRankId: null,
    anvilPickIds: [],
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

export function patchPathToGloryState(
  list: ArmyList,
  patch: Partial<PathToGloryState>,
): ArmyList {
  if (!isPathToGloryList(list)) {
    return list;
  }
  return {
    ...list,
    pathToGlory: normalizePathToGloryState({
      ...normalizePathToGloryState(list.pathToGlory),
      ...patch,
    }),
  };
}

export function applyPathToGloryPacks(
  list: ArmyList,
  packIds: PathToGloryPackId[],
): ArmyList {
  const nextIds = normalizePackIds(packIds);
  const allowed = new Set(pathsForPacks(nextIds).map((path) => path.id));
  const showWounds = nextIds.includes("ravaged-coast");

  const prune = (slot: Selection | null): Selection | null => {
    if (!slot?.pathToGlory) {
      return slot;
    }
    const pathId =
      slot.pathToGlory.pathId && allowed.has(slot.pathToGlory.pathId)
        ? slot.pathToGlory.pathId
        : null;
    const path = pathId ? findPath(pathId) : undefined;
    return {
      ...slot,
      pathToGlory: {
        ...slot.pathToGlory,
        pathId,
        pathOptionIds: prunePathOptionIds(
          path,
          pathId ? slot.pathToGlory.pathOptionIds : [],
          slot.pathToGlory.renown,
        ),
        battleWoundId: showWounds ? slot.pathToGlory.battleWoundId : null,
        scarId: showWounds ? slot.pathToGlory.scarId : null,
      },
    };
  };

  return {
    ...list,
    pathToGlory: {
      ...normalizePathToGloryState(list.pathToGlory),
      packIds: nextIds,
    },
    regiments: list.regiments.map((regiment) => ({
      ...regiment,
      hero: prune(regiment.hero),
      units: regiment.units.map((slot) => prune(slot) ?? slot),
    })),
    auxiliaries: list.auxiliaries.map((slot) => prune(slot) ?? slot),
    regimentOfRenown: list.regimentOfRenown
      ? {
          ...list.regimentOfRenown,
          units: list.regimentOfRenown.units.map(
            (slot) => prune(slot) ?? slot,
          ),
        }
      : null,
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

export function pathToGloryExportBits(
  selection: Selection,
  unit?: CatalogueUnit,
): string[] {
  const bits: string[] = [];
  const state = selection.pathToGlory;
  if (!state) {
    return bits;
  }
  const rank = unit?.anvilRanks?.find(
    (item) => item.id === state.anvilRankId,
  );
  if (rank) {
    bits.push(rank.name);
  }
  const picks = new Set(state.anvilPickIds ?? []);
  for (const group of unit?.anvilForge ?? []) {
    for (const option of group.options) {
      if (picks.has(option.id)) {
        bits.push(option.name);
      }
    }
  }
  const path = findPath(state.pathId);
  if (path) {
    bits.push(path.name);
    for (const optionId of state.pathOptionIds) {
      const option = path.options.find((item) => item.id === optionId);
      if (option) {
        bits.push(option.name);
      }
    }
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
