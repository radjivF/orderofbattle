import {
  getUnit,
  getRegimentOfRenown,
  canJoinRegiment,
  selectionPoints,
  armyHasKeyword,
  namedOption,
  unitBaseName,
  unitIsWarmaster,
  warmasterRegiments,
  rorTemplateForSelection,
} from "./queries";
import type { ArmyList, EnhancementPick, FactionCatalogue } from "./types";

export type ListIssue = {
  tone: "ok" | "warn" | "bad";
  text: string;
};

export type ListTotals = {
  points: number;
  remaining: number;
  drops: number;
  regimentCount: number;
  auxiliaryCount: number;
  slotCap: (regimentId: string) => number;
  issues: ListIssue[];
};

export function regimentSlotCap(
  list: ArmyList,
  regimentId: string,
): number {
  return list.generalRegimentId === regimentId ? 4 : 3;
}

export function summarize(
  list: ArmyList,
  faction: FactionCatalogue,
): ListTotals {
  let points = 0;
  const uniqueSeen = new Set<string>();
  const issues: ListIssue[] = [];

  const addSel = (
    unitId: string,
    reinforced: boolean,
    where: string,
  ) => {
    const unit = getUnit(faction, unitId);
    if (!unit) {
      issues.push({ tone: "bad", text: `Unknown unit in ${where}.` });
      return;
    }
    points += selectionPoints(unit, reinforced);
    if (reinforced && !unit.reinforce) {
      issues.push({
        tone: "bad",
        text: `${unit.name} cannot be reinforced.`,
      });
    }
    if (unit.unique) {
      const base = unitBaseName(unit.name);
      if (uniqueSeen.has(base)) {
        issues.push({
          tone: "bad",
          text: `${unitBaseName(unit.name)} is unique.`,
        });
      }
      uniqueSeen.add(base);
    }
  };

  for (const regiment of list.regiments) {
    if (!regiment.hero) {
      issues.push({ tone: "bad", text: "A regiment needs a hero." });
      continue;
    }
    const hero = getUnit(faction, regiment.hero.unitId);
    addSel(regiment.hero.unitId, regiment.hero.reinforced, "a regiment");
    const cap = regimentSlotCap(list, regiment.id);
    if (regiment.units.length > cap) {
      issues.push({
        tone: "bad",
        text: `${hero?.name ?? "A regiment"} has too many units.`,
      });
    }
    for (const slot of regiment.units) {
      addSel(slot.unitId, slot.reinforced, "a regiment");
      const companion = getUnit(faction, slot.unitId);
      if (hero && companion && !canJoinRegiment(hero, companion, faction)) {
        issues.push({
          tone: "bad",
          text: `${companion.name} cannot join ${hero.name}.`,
        });
      }
    }
  }

  for (const aux of list.auxiliaries) {
    addSel(aux.unitId, aux.reinforced, "auxiliaries");
  }

  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    if (!ror) {
      issues.push({ tone: "bad", text: "Unknown Regiment of Renown." });
    } else if (!ror.factionIds.includes(list.factionId)) {
      issues.push({
        tone: "bad",
        text: `${ror.name} is not available to this faction.`,
      });
    } else {
      points += ror.points;
      for (const slot of rorPick.units) {
        const template = ror.units.find((unit) => unit.id === slot.unitId);
        if (!template) {
          issues.push({
            tone: "bad",
            text: `Unknown unit in ${ror.name}.`,
          });
          continue;
        }
        if (template.unique) {
          const base = unitBaseName(template.name);
          if (uniqueSeen.has(base)) {
            issues.push({
              tone: "bad",
              text: `${unitBaseName(template.name)} is unique.`,
            });
          }
          uniqueSeen.add(base);
        }
      }
    }
  }

  if (list.regiments.length === 0) {
    issues.push({ tone: "warn", text: "Add a regiment to begin." });
  } else if (list.regiments.length > 5) {
    issues.push({ tone: "bad", text: "Maximum five regiments." });
  }

  if (points > list.pointsCap) {
    issues.push({
      tone: "bad",
      text: `${points - list.pointsCap} points over.`,
    });
  }

  const auxiliaryCount = list.auxiliaries.length;
  const renownDrop = rorPick ? 1 : 0;
  const drops = list.regiments.length + auxiliaryCount + renownDrop;

  if (auxiliaryCount > 0) {
    issues.push({
      tone: "warn",
      text: `${auxiliaryCount} auxiliar${auxiliaryCount === 1 ? "y" : "ies"}: extra drops, fewer command points.`,
    });
  }

  const warmasters = warmasterRegiments(list, faction);
  if (warmasters.length > 0) {
    const general = list.regiments.find(
      (regiment) => regiment.id === list.generalRegimentId,
    );
    const generalHero = general?.hero
      ? getUnit(faction, general.hero.unitId)
      : undefined;
    if (!generalHero || !unitIsWarmaster(generalHero)) {
      issues.push({
        tone: "bad",
        text:
          warmasters.length === 1
            ? "The Warmaster must be your general."
            : "A Warmaster must be your general.",
      });
    }
  }

  if (
    armyHasKeyword(list, faction, "WIZARD") &&
    faction.spellLores.length > 0 &&
    !list.spellLoreId
  ) {
    issues.push({ tone: "warn", text: "Choose a spell lore." });
  }

  if (
    armyHasKeyword(list, faction, "PRIEST") &&
    faction.prayerLores.length > 0 &&
    !list.prayerLoreId
  ) {
    issues.push({ tone: "warn", text: "Choose a prayer lore." });
  }

  warnUniqueEnhancement(list, faction, list.artefact, "artefact", issues);
  warnUniqueEnhancement(list, faction, list.heroicTrait, "heroic trait", issues);

  const remaining = list.pointsCap - points;
  if (issues.length === 0) {
    issues.push({
      tone: "ok",
      text:
        remaining === 0
          ? "On the nose."
          : `${remaining} points left.`,
    });
  }

  return {
    points,
    remaining,
    drops,
    regimentCount: list.regiments.length,
    auxiliaryCount,
    slotCap: (regimentId) => regimentSlotCap(list, regimentId),
    issues,
  };
}

/** Drop artefact / trait picks whose hero is no longer on the list. */
export function pruneOrphanEnhancements(list: ArmyList): ArmyList {
  const ids = new Set<string>();
  for (const regiment of list.regiments) {
    if (regiment.hero) {
      ids.add(regiment.hero.id);
    }
    for (const slot of regiment.units) {
      ids.add(slot.id);
    }
  }
  for (const slot of list.auxiliaries) {
    ids.add(slot.id);
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    ids.add(slot.id);
  }

  const artefact =
    list.artefact && ids.has(list.artefact.heroSelectionId)
      ? list.artefact
      : null;
  const heroicTrait =
    list.heroicTrait && ids.has(list.heroicTrait.heroSelectionId)
      ? list.heroicTrait
      : null;

  if (artefact === list.artefact && heroicTrait === list.heroicTrait) {
    return list;
  }
  return { ...list, artefact, heroicTrait };
}

function heroSelection(list: ArmyList, selectionId: string) {
  for (const regiment of list.regiments) {
    if (regiment.hero?.id === selectionId) {
      return regiment.hero;
    }
    for (const slot of regiment.units) {
      if (slot.id === selectionId) {
        return slot;
      }
    }
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    if (slot.id === selectionId) {
      return slot;
    }
  }
  return null;
}

function warnUniqueEnhancement(
  list: ArmyList,
  faction: FactionCatalogue,
  pick: EnhancementPick | null | undefined,
  label: string,
  issues: ListIssue[],
) {
  if (!pick) {
    return;
  }
  const selection = heroSelection(list, pick.heroSelectionId);
  if (!selection) {
    // Orphans are pruned on load/save; skip the confusing status line.
    return;
  }
  const article = label === "artefact" ? "An" : "A";
  const rorHero = rorTemplateForSelection(list, pick.heroSelectionId);
  if (rorHero) {
    if (!rorHero.canTakeEnhancements) {
      issues.push({
        tone: "warn",
        text: `${rorHero.name} cannot take ${article.toLowerCase()} ${label}.`,
      });
    }
  } else {
    const unit = getUnit(faction, selection.unitId);
    if (unit?.unique) {
      issues.push({
        tone: "warn",
        text: `Unique heroes cannot take ${article.toLowerCase()} ${label}.`,
      });
    }
  }
  if (!namedOption(
    label === "artefact" ? faction.artefacts : faction.heroicTraits,
    pick.optionId,
  )) {
    issues.push({
      tone: "warn",
      text: `Unknown ${label}.`,
    });
  }
}
