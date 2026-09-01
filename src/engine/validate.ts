import { battleTactics } from "./data/load";
import { listUsesScourgeContent } from "./scourgeRealm";
import {
  getUnit,
  getListUnit,
  getRegimentOfRenown,
  canJoinRegiment,
  canTakeMonstrousTrait,
  canTakeVisionOfFate,
  selectionPoints,
  pickedEnhancementPoints,
  armyHasKeyword,
  namedOption,
  unitBaseName,
  unitIsWarmaster,
  unitScourgeRealm,
  warmasterRegiments,
  rorTemplateForSelection,
  rorUnitAsCatalogue,
  catalogueMatchIds,
} from "./queries";
import { isSpearheadList } from "./spearhead";
import type { ArmyList, EnhancementPick, FactionCatalogue } from "./types";

export type ListIssueOptionsField =
  | "points"
  | "spell-lore"
  | "prayer-lore"
  | "tactics"
  | "scourge";

export type ListIssueTarget =
  | { area: "add-regiment" }
  | { area: "add-hero"; regimentId: string }
  | { area: "regiment"; regimentId: string }
  | { area: "unit"; selectionId: string }
  | { area: "add-ror" }
  | { area: "options"; field: ListIssueOptionsField };

export type ListIssue = {
  tone: "ok" | "warn" | "bad";
  text: string;
  target?: ListIssueTarget;
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
    target?: ListIssueTarget,
  ) => {
    const unit = getUnit(faction, unitId);
    if (!unit) {
      issues.push({
        tone: "bad",
        text: `Unknown unit in ${where}.`,
        target,
      });
      return;
    }
    points += selectionPoints(unit, reinforced);
    if (reinforced && !unit.reinforce) {
      issues.push({
        tone: "bad",
        text: `${unit.name} cannot be reinforced.`,
        target,
      });
    }
    if (unit.unique) {
      const base = unitBaseName(unit.name);
      if (uniqueSeen.has(base)) {
        issues.push({
          tone: "bad",
          text: `${unitBaseName(unit.name)} is unique.`,
          target,
        });
      }
      uniqueSeen.add(base);
    }
  };

  for (const regiment of list.regiments) {
    if (!regiment.hero) {
      issues.push({
        tone: "bad",
        text: "A regiment needs a hero.",
        target: { area: "add-hero", regimentId: regiment.id },
      });
      continue;
    }
    const hero = getUnit(faction, regiment.hero.unitId);
    addSel(regiment.hero.unitId, regiment.hero.reinforced, "a regiment", {
      area: "unit",
      selectionId: regiment.hero.id,
    });
    if (!isSpearheadList(list)) {
      const cap = regimentSlotCap(list, regiment.id);
      if (regiment.units.length > cap) {
        issues.push({
          tone: "bad",
          text: `${hero?.name ?? "A regiment"} has too many units.`,
          target: { area: "regiment", regimentId: regiment.id },
        });
      }
    }
    for (const slot of regiment.units) {
      addSel(slot.unitId, slot.reinforced, "a regiment", {
        area: "unit",
        selectionId: slot.id,
      });
      const companion = getUnit(faction, slot.unitId);
      if (
        !isSpearheadList(list) &&
        hero &&
        companion &&
        !canJoinRegiment(hero, companion, faction)
      ) {
        issues.push({
          tone: "bad",
          text: `${companion.name} cannot join ${hero.name}.`,
          target: { area: "unit", selectionId: slot.id },
        });
      }
    }
  }

  for (const aux of list.auxiliaries) {
    addSel(aux.unitId, aux.reinforced, "auxiliaries", {
      area: "unit",
      selectionId: aux.id,
    });
  }

  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    if (!ror) {
      issues.push({
        tone: "bad",
        text: "Unknown Regiment of Renown.",
        target: { area: "add-ror" },
      });
    } else if (
      !catalogueMatchIds(faction).some((id) => ror.factionIds.includes(id))
    ) {
      issues.push({
        tone: "bad",
        text: `${ror.name} is not available to this faction.`,
        target: { area: "add-ror" },
      });
    } else {
      points += ror.points;
      for (const slot of rorPick.units) {
        const template = ror.units.find((unit) => unit.id === slot.unitId);
        if (!template) {
          issues.push({
            tone: "bad",
            text: `Unknown unit in ${ror.name}.`,
            target: { area: "add-ror" },
          });
          continue;
        }
        if (template.unique) {
          const base = unitBaseName(template.name);
          if (uniqueSeen.has(base)) {
            issues.push({
              tone: "bad",
              text: `${unitBaseName(template.name)} is unique.`,
              target: { area: "add-ror" },
            });
          }
          uniqueSeen.add(base);
        }
      }
    }
  }

  warnMixedScourgeSheets(list, faction, issues);
  warnScourgeSeason(list, faction, issues);

  points += pickedEnhancementPoints(list.artefact, faction.artefacts);
  points += pickedEnhancementPoints(list.heroicTrait, faction.heroicTraits);
  points += pickedEnhancementPoints(
    list.monstrousTrait,
    faction.monstrousTraits,
  );
  points += pickedEnhancementPoints(list.visionOfFate, faction.visionsOfFate);

  for (const pick of list.specialEnhancements ?? []) {
    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === pick.tableId,
    );
    points += pickedEnhancementPoints(pick, table?.options);
  }

  const manifestationLore = faction.manifestationLores.find(
    (item) => item.id === list.manifestationLoreId,
  );
  if (manifestationLore?.points) {
    points += manifestationLore.points;
  }

  const formation = faction.formations.find(
    (item) => item.id === list.formationId,
  );
  if (formation?.points) {
    points += formation.points;
  }

  if (isSpearheadList(list)) {
    return summarizeSpearhead(list, faction, issues);
  }

  if (list.regiments.length === 0) {
    issues.push({
      tone: "warn",
      text: "Add a regiment to begin.",
      target: { area: "add-regiment" },
    });
  } else if (list.regiments.length > 5) {
    issues.push({
      tone: "bad",
      text: "Maximum five regiments.",
      target: { area: "add-regiment" },
    });
  }

  if (points > list.pointsCap) {
    issues.push({
      tone: "bad",
      text: `${points - list.pointsCap} points over.`,
      target: { area: "options", field: "points" },
    });
  }

  const auxiliaryCount = list.auxiliaries.length;
  const renownDrop = rorPick ? 1 : 0;
  const drops = list.regiments.length + auxiliaryCount + renownDrop;

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
        target: {
          area: "regiment",
          regimentId: list.generalRegimentId ?? list.regiments[0]?.id ?? "",
        },
      });
    }
  }

  if (
    armyHasKeyword(list, faction, "WIZARD") &&
    faction.spellLores.length > 0 &&
    !list.spellLoreId
  ) {
    issues.push({
      tone: "warn",
      text: "Choose a spell lore.",
      target: { area: "options", field: "spell-lore" },
    });
  }

  if (
    armyHasKeyword(list, faction, "PRIEST") &&
    faction.prayerLores.length > 0 &&
    !list.prayerLoreId
  ) {
    issues.push({
      tone: "warn",
      text: "Choose a prayer lore.",
      target: { area: "options", field: "prayer-lore" },
    });
  }

  warnUniqueEnhancement(list, faction, list.artefact, "artefact", issues);
  warnUniqueEnhancement(list, faction, list.heroicTrait, "heroic trait", issues);
  warnMonstrousTrait(list, faction, issues);
  warnVisionOfFate(list, faction, issues);
  warnSpecialEnhancements(list, faction, issues);

  if ((list.battleTacticCardIds ?? []).length === 0) {
    issues.push({
      tone: "warn",
      text: "Pick up to 2 battle tactic cards.",
      target: { area: "options", field: "tactics" },
    });
  } else if ((list.battleTacticCardIds ?? []).length > 2) {
    issues.push({
      tone: "bad",
      text: "Maximum two battle tactic cards.",
      target: { area: "options", field: "tactics" },
    });
  }

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

function summarizeSpearhead(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
): ListTotals {
  const abilityId = list.regimentAbilityId ?? list.formationId;
  if (faction.formations.length > 0 && !abilityId) {
    issues.push({ tone: "warn", text: "Pick a regiment ability." });
  }
  if (faction.heroicTraits.length > 0 && !list.heroicTrait) {
    issues.push({ tone: "warn", text: "Give your general an enhancement." });
  }
  if (issues.length === 0) {
    issues.push({ tone: "ok", text: "Ready to play." });
  }
  return {
    points: 0,
    remaining: 0,
    drops: 1,
    regimentCount: list.regiments.length,
    auxiliaryCount: 0,
    slotCap: () => 99,
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
  const monstrousTrait =
    list.monstrousTrait && ids.has(list.monstrousTrait.heroSelectionId)
      ? list.monstrousTrait
      : null;
  const visionOfFate =
    list.visionOfFate && ids.has(list.visionOfFate.heroSelectionId)
      ? list.visionOfFate
      : null;
  const specialEnhancements = (list.specialEnhancements ?? []).filter((pick) =>
    ids.has(pick.heroSelectionId),
  );

  if (
    artefact === list.artefact &&
    heroicTrait === list.heroicTrait &&
    monstrousTrait === (list.monstrousTrait ?? null) &&
    visionOfFate === (list.visionOfFate ?? null) &&
    specialEnhancements.length === (list.specialEnhancements ?? []).length
  ) {
    return list;
  }
  return {
    ...list,
    artefact,
    heroicTrait,
    monstrousTrait,
    visionOfFate,
    specialEnhancements,
  };
}

function rosterSelection(list: ArmyList, selectionId: string) {
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
  for (const slot of list.auxiliaries) {
    if (slot.id === selectionId) {
      return slot;
    }
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    if (slot.id === selectionId) {
      return slot;
    }
  }
  return null;
}

function scourgeRealmLabel(realm: "core" | "aqshy" | "ghyran"): string {
  if (realm === "core") {
    return "standard";
  }
  if (realm === "aqshy") {
    return "Scourge of Aqshy";
  }
  return "Scourge of Ghyran";
}

function scourgeSeasonLabel(realm: "aqshy" | "ghyran"): string {
  return realm === "aqshy" ? "Scourge of Aqshy" : "Scourge of Ghyran";
}

function warnScourgeSeason(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
) {
  if (!listUsesScourgeContent(list, faction)) {
    return;
  }

  const realm = list.scourgeRealm;
  if (!realm) {
    issues.push({
      tone: "warn",
      text: "Choose Scourge of Aqshy or Scourge of Ghyran.",
      target: { area: "options", field: "scourge" },
    });
    return;
  }

  const checkUnit = (
    unit: { name: string } | undefined,
    selectionId?: string,
  ) => {
    if (!unit) {
      return;
    }
    const unitRealm = unitScourgeRealm(unit.name);
    if (unitRealm && unitRealm !== realm) {
      issues.push({
        tone: "bad",
        text: `${unit.name} does not match ${scourgeSeasonLabel(realm)}.`,
        target: selectionId
          ? { area: "unit", selectionId }
          : { area: "options", field: "scourge" },
      });
    }
  };

  for (const regiment of list.regiments) {
    if (regiment.hero) {
      checkUnit(getUnit(faction, regiment.hero.unitId), regiment.hero.id);
    }
    for (const slot of regiment.units) {
      checkUnit(getUnit(faction, slot.unitId), slot.id);
    }
  }
  for (const aux of list.auxiliaries) {
    checkUnit(getUnit(faction, aux.unitId), aux.id);
  }
  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    if (ror) {
      for (const slot of rorPick.units) {
        const template = ror.units.find((unit) => unit.id === slot.unitId);
        checkUnit(template);
      }
    }
  }

  for (const id of list.battleTacticCardIds ?? []) {
    const card = battleTactics.find((item) => item.id === id);
    if (card && card.realm !== realm) {
      issues.push({
        tone: "bad",
        text: `${card.name} is not a ${scourgeSeasonLabel(realm)} battle tactic card.`,
        target: { area: "options", field: "tactics" },
      });
    }
  }
}

function warnMixedScourgeSheets(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
) {
  const realmsByBase = new Map<string, Set<"core" | "aqshy" | "ghyran">>();

  const trackUnit = (unit: { name: string } | undefined) => {
    if (!unit) {
      return;
    }
    const base = unitBaseName(unit.name);
    const scourgeRealm = unitScourgeRealm(unit.name);
    const sheetRealm = scourgeRealm ?? "core";
    const realms = realmsByBase.get(base) ?? new Set();
    realms.add(sheetRealm);
    realmsByBase.set(base, realms);
  };

  for (const regiment of list.regiments) {
    if (regiment.hero) {
      trackUnit(getUnit(faction, regiment.hero.unitId));
    }
    for (const slot of regiment.units) {
      trackUnit(getUnit(faction, slot.unitId));
    }
  }
  for (const aux of list.auxiliaries) {
    trackUnit(getUnit(faction, aux.unitId));
  }
  const rorPick = list.regimentOfRenown;
  if (rorPick) {
    const ror = getRegimentOfRenown(rorPick.renownId);
    if (ror) {
      for (const slot of rorPick.units) {
        const template = ror.units.find((unit) => unit.id === slot.unitId);
        if (template) {
          trackUnit(template);
        }
      }
    }
  }

  for (const [base, realms] of realmsByBase) {
    if (realms.size <= 1) {
      continue;
    }
    const labels = [...realms].map(scourgeRealmLabel);
    issues.push({
      tone: "bad",
      text: `${base}: cannot mix ${labels.join(" and ")} warscrolls in the same army.`,
    });
  }
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
  const selection = rosterSelection(list, pick.heroSelectionId);
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
        target: { area: "unit", selectionId: pick.heroSelectionId },
      });
    }
  } else {
    const unit = getUnit(faction, selection.unitId);
    if (unit?.unique) {
      issues.push({
        tone: "warn",
        text: `Unique heroes cannot take ${article.toLowerCase()} ${label}.`,
        target: { area: "unit", selectionId: pick.heroSelectionId },
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

function warnMonstrousTrait(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
) {
  const pick = list.monstrousTrait;
  if (!pick) {
    return;
  }
  const selection = rosterSelection(list, pick.heroSelectionId);
  if (!selection) {
    return;
  }
  const unit = unitForSelection(list, faction, selection.unitId, pick.heroSelectionId);
  if (unit && !canTakeMonstrousTrait(unit)) {
    issues.push({
      tone: "warn",
      text: `${unit.name} cannot take a monstrous trait.`,
      target: { area: "unit", selectionId: pick.heroSelectionId },
    });
  }
  if (!namedOption(faction.monstrousTraits ?? [], pick.optionId)) {
    issues.push({ tone: "warn", text: "Unknown monstrous trait." });
  }
}

function warnVisionOfFate(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
) {
  const pick = list.visionOfFate;
  if (!pick) {
    return;
  }
  const selection = rosterSelection(list, pick.heroSelectionId);
  if (!selection) {
    return;
  }
  const unit = unitForSelection(list, faction, selection.unitId, pick.heroSelectionId);
  if (unit && !canTakeVisionOfFate(unit)) {
    issues.push({
      tone: "warn",
      text: `${unit.name} cannot take a Vision of Fate.`,
      target: { area: "unit", selectionId: pick.heroSelectionId },
    });
  }
  if (!namedOption(faction.visionsOfFate ?? [], pick.optionId)) {
    issues.push({ tone: "warn", text: "Unknown Vision of Fate." });
  }
}

function warnSpecialEnhancements(
  list: ArmyList,
  faction: FactionCatalogue,
  issues: ListIssue[],
) {
  const seenTables = new Set<string>();
  for (const pick of list.specialEnhancements ?? []) {
    if (seenTables.has(pick.tableId)) {
      issues.push({ tone: "bad", text: "Duplicate special enhancement table." });
    }
    seenTables.add(pick.tableId);
    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === pick.tableId,
    );
    const selection = rosterSelection(list, pick.heroSelectionId);
    if (!selection) {
      continue;
    }
    const unit = unitForSelection(
      list,
      faction,
      selection.unitId,
      pick.heroSelectionId,
    );
    if (unit?.unique) {
      issues.push({
        tone: "warn",
        text: `${unit.name} cannot take ${table?.name ?? "a special enhancement"}.`,
        target: { area: "unit", selectionId: pick.heroSelectionId },
      });
    }
    if (!table || !namedOption(table.options, pick.optionId)) {
      issues.push({ tone: "warn", text: "Unknown special enhancement." });
    }
  }
}

function unitForSelection(
  list: ArmyList,
  faction: FactionCatalogue,
  unitId: string,
  selectionId: string,
) {
  const rorHero = rorTemplateForSelection(list, selectionId);
  if (rorHero) {
    return rorUnitAsCatalogue(rorHero);
  }
  return getListUnit(list, faction, unitId);
}
