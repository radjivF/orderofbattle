import type { ArmyList, CatalogueUnit, FactionCatalogue, Selection } from "./types";
import { getListUnit, getSelection, selectionIsDestroyed } from "./queries";

export function addHiddenPhaseSelection(
  hidden: Partial<Record<string, readonly string[]>>,
  phaseId: string,
  selectionId: string,
): Record<string, string[]> {
  const current = hidden[phaseId] ?? [];
  return {
    ...Object.fromEntries(
      Object.entries(hidden).map(([id, ids]) => [id, [...(ids ?? [])]]),
    ),
    [phaseId]: current.includes(selectionId)
      ? [...current]
      : [...current, selectionId],
  };
}

export function selectionHiddenFromPhase(
  selection: Selection,
  phaseId: string,
): boolean {
  return selection.play?.removedFromPhases?.includes(phaseId) ?? false;
}

function patchSelection(
  selection: Selection,
  selectionId: string,
  phaseId: string,
): Selection {
  if (selection.id !== selectionId) {
    return selection;
  }
  const current = selection.play?.removedFromPhases ?? [];
  if (current.includes(phaseId)) {
    return selection;
  }
  return {
    ...selection,
    play: {
      damage: selection.play?.damage ?? 0,
      ...selection.play,
      removedFromPhases: [...current, phaseId],
    },
  };
}

/** Mark a selection hidden on one play phase. Later hides append; they do not replace. */
export function hideSelectionFromPhase(
  list: ArmyList,
  selectionId: string,
  phaseId: string,
): ArmyList {
  return {
    ...list,
    regiments: list.regiments.map((regiment) => ({
      ...regiment,
      hero: regiment.hero
        ? patchSelection(regiment.hero, selectionId, phaseId)
        : regiment.hero,
      units: regiment.units.map((slot) =>
        patchSelection(slot, selectionId, phaseId),
      ),
    })),
    auxiliaries: list.auxiliaries.map((slot) =>
      patchSelection(slot, selectionId, phaseId),
    ),
    regimentOfRenown: list.regimentOfRenown
      ? {
          ...list.regimentOfRenown,
          units: list.regimentOfRenown.units.map((slot) =>
            patchSelection(slot, selectionId, phaseId),
          ),
        }
      : null,
  };
}

export function hiddenSelectionIdsForPhase(
  list: ArmyList,
  phaseId: string,
): string[] {
  const ids: string[] = [];
  const take = (selection: Selection | null) => {
    if (selection && selectionHiddenFromPhase(selection, phaseId)) {
      ids.push(selection.id);
    }
  };
  for (const regiment of list.regiments) {
    take(regiment.hero);
    for (const slot of regiment.units) {
      take(slot);
    }
  }
  for (const slot of list.auxiliaries) {
    take(slot);
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    take(slot);
  }
  return ids;
}

/** Drop phase-hides when the unit is alive again (revive). */
export function playAfterDamage(
  selection: Selection,
  damage: number,
  unit: CatalogueUnit | undefined,
): NonNullable<Selection["play"]> {
  const play = { ...selection.play, damage };
  if (!unit) {
    return play;
  }
  if (!selectionIsDestroyed({ ...selection, play }, unit)) {
    const rest = { ...play };
    delete rest.removedFromPhases;
    return rest;
  }
  return play;
}

export function pruneHiddenPhaseSelections(
  hidden: Partial<Record<string, string[]>>,
  list: ArmyList,
  faction: FactionCatalogue,
): Partial<Record<string, string[]>> {
  let changed = false;
  const next: Partial<Record<string, string[]>> = {};
  for (const [phaseId, ids] of Object.entries(hidden)) {
    const kept = (ids ?? []).filter((id) => {
      const selection = getSelection(list, id);
      if (!selection) {
        changed = true;
        return false;
      }
      const unit = getListUnit(list, faction, selection.unitId);
      const dead = Boolean(unit && selectionIsDestroyed(selection, unit));
      if (!dead) {
        changed = true;
      }
      return dead;
    });
    if (kept.length > 0) {
      next[phaseId] = kept;
    } else if ((ids ?? []).length > 0) {
      changed = true;
    }
  }
  return changed ? next : hidden;
}
