import type { ArmyList, CatalogueUnit, FactionCatalogue, Selection } from "../types";
import { getUnit, selectionPoints } from "../queries";
import { isAnvilOfApotheosis } from "./anvil";

const WARLORD_POINTS_CAP = 350;

/**
 * Check if a hero is eligible to be a warlord.
 * - Must be a hero
 * - Non-unique OR an Anvil of Apotheosis hero (which has unique: true but is still eligible)
 * - Single model (models === 1, not reinforced)
 * - ≤ 350 pts (Sons of Behemat heroes ignored from this cap)
 */
export function canBeWarlord(
  unit: CatalogueUnit,
  selection: Selection,
  faction: FactionCatalogue,
): boolean {
  if (!unit.hero) {
    return false;
  }

  // Anvil heroes are allowed even though they have unique: true
  const allowedUnique = isAnvilOfApotheosis(unit);
  if (unit.unique && !allowedUnique) {
    return false;
  }

  // Must be a single model
  if (unit.models !== 1 || selection.reinforced) {
    return false;
  }

  // Sons of Behemat heroes ignore the points cap
  const isSonsOfBehemat = faction.id === "sons-of-behemat";
  if (isSonsOfBehemat) {
    return true;
  }

  // Check points cap
  const points = selectionPoints(unit, selection.reinforced, selection);
  return points <= WARLORD_POINTS_CAP;
}

/**
 * Get the warlord selection from the list, or null if not set or not found.
 */
export function getWarlordSelection(list: ArmyList): Selection | null {
  const warlordId = list.pathToGlory?.warlordSelectionId;
  if (!warlordId) {
    return null;
  }

  for (const regiment of list.regiments) {
    if (regiment.hero?.id === warlordId) {
      return regiment.hero;
    }
  }
  for (const aux of list.auxiliaries) {
    if (aux.id === warlordId) {
      return aux;
    }
  }
  return null;
}

/**
 * Check if a selection is the warlord.
 */
export function isWarlord(list: ArmyList, selectionId: string): boolean {
  return list.pathToGlory?.warlordSelectionId === selectionId;
}

/**
 * Count warlords in the list.
 */
export function warlordCount(list: ArmyList): number {
  const warlord = getWarlordSelection(list);
  return warlord ? 1 : 0;
}
