import { battleTactics } from "./data/load";
import {
  getFaction,
  getRegimentOfRenown,
  getUnit,
  unitScourgeRealm,
} from "./queries";
import type { ArmyList, FactionCatalogue } from "./types";

function trackScourgeUnitsOnList(
  list: ArmyList,
  faction: FactionCatalogue,
  track: (unit: { name: string } | undefined) => void,
) {
  for (const regiment of list.regiments) {
    if (regiment.hero) {
      track(getUnit(faction, regiment.hero.unitId));
    }
    for (const slot of regiment.units) {
      track(getUnit(faction, slot.unitId));
    }
  }
  for (const aux of list.auxiliaries) {
    track(getUnit(faction, aux.unitId));
  }
  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    if (ror) {
      for (const slot of rorPick.units) {
        const template = ror.units.find((unit) => unit.id === slot.unitId);
        track(template);
      }
    }
  }
}

/** True when the list has scourge warscrolls or scourge-season tactic cards. */
export function listUsesScourgeContent(
  list: ArmyList,
  faction: FactionCatalogue,
): boolean {
  for (const id of list.battleTacticCardIds ?? []) {
    const card = battleTactics.find((item) => item.id === id);
    if (card?.realm === "ghyran" || card?.realm === "aqshy") {
      return true;
    }
  }

  let hasScourgeUnit = false;
  trackScourgeUnitsOnList(list, faction, (unit) => {
    if (unit && unitScourgeRealm(unit.name)) {
      hasScourgeUnit = true;
    }
  });
  return hasScourgeUnit;
}

/** Infer season from tactic picks or scourge warscrolls on migrated lists. */
export function inferScourgeRealm(list: ArmyList): ArmyList["scourgeRealm"] {
  if (list.scourgeRealm) {
    return list.scourgeRealm;
  }

  for (const id of list.battleTacticCardIds ?? []) {
    const card = battleTactics.find((item) => item.id === id);
    if (card?.realm === "ghyran") {
      return "ghyran";
    }
    if (card?.realm === "aqshy") {
      return "aqshy";
    }
  }

  const faction = getFaction(list.factionId);
  if (!faction) {
    return null;
  }

  const scourgeRealms = new Set<"aqshy" | "ghyran">();
  const track = (unit: { name: string } | undefined) => {
    if (!unit) {
      return;
    }
    const realm = unitScourgeRealm(unit.name);
    if (realm) {
      scourgeRealms.add(realm);
    }
  };

  trackScourgeUnitsOnList(list, faction, track);

  if (scourgeRealms.size === 1) {
    return [...scourgeRealms][0];
  }
  return null;
}
