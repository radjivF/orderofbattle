import type {
  ArmyList,
  CatalogueUnit,
  EnhancementOption,
  FactionCatalogue,
  Formation,
  NamedOption,
  RegimentOfRenown,
  RegimentOfRenownUnit,
  RegimentOption,
  Selection,
  SpecialEnhancementTable,
  UnitAbility,
  UnitStats,
} from "./types";
import { factions, regimentsOfRenown } from "./data/load";
import {
  anvilRankForSelection,
  uniqueKeywordBlocksEnhancements,
} from "./pathToGlory/anvil";
import {
  selectionArtefactOptionId,
  selectionHeroicTraitOptionId,
} from "./pathToGlory/heroGear";

const byFaction = new Map(factions.map((faction) => [faction.id, faction]));
const byRenown = new Map(
  regimentsOfRenown.map((item) => [item.id, item]),
);

export function listFactions(): FactionCatalogue[] {
  return factions
    .filter((faction) => !faction.parentFactionIds?.length)
    .sort((a, b) => {
      if (a.id === "stormcast-eternals") {
        return -1;
      }
      if (b.id === "stormcast-eternals") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
}

export function listArmiesOfRenown(
  factionId: string,
): FactionCatalogue[] {
  return factions
    .filter((faction) => faction.parentFactionIds?.includes(factionId))
    .sort((a, b) => armyOfRenownName(a).localeCompare(armyOfRenownName(b)));
}

export function isArmyOfRenown(faction: FactionCatalogue): boolean {
  return Boolean(faction.parentFactionIds?.length);
}

export function armyOfRenownName(faction: FactionCatalogue): string {
  if (!isArmyOfRenown(faction)) {
    return faction.name;
  }
  const parts = faction.name.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : faction.name;
}

export function catalogueMatchIds(faction: FactionCatalogue): string[] {
  return faction.parentFactionIds?.length
    ? faction.parentFactionIds
    : [faction.id];
}

export function getFaction(id: string): FactionCatalogue | undefined {
  return byFaction.get(id);
}

export function getRegimentOfRenown(
  id: string,
): RegimentOfRenown | undefined {
  return byRenown.get(id);
}

export function listRegimentsOfRenown(
  factionId: string,
): RegimentOfRenown[] {
  const faction = getFaction(factionId);
  const ids = faction ? catalogueMatchIds(faction) : [factionId];
  return regimentsOfRenown
    .filter((item) => item.factionIds.some((id) => ids.includes(id)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function rorUnitAsCatalogue(
  unit: RegimentOfRenownUnit,
): CatalogueUnit {
  return {
    id: unit.id,
    name: unit.name,
    points: unit.points,
    hero: unit.hero,
    unique: unit.unique,
    reinforce: unit.reinforce,
    models: unit.models,
    categories: unit.categories,
    stats: unit.stats,
    weapons: unit.weapons,
    abilities: unit.abilities,
    regimentOptions: [],
    regimentHeroes: [],
  };
}

/** Faction warscroll, or a unit from this list's Regiment of Renown. */
export function getListUnit(
  list: ArmyList,
  faction: FactionCatalogue,
  unitId: string,
): CatalogueUnit | undefined {
  const fromFaction = getUnit(faction, unitId);
  if (fromFaction) {
    return fromFaction;
  }
  const pick = list.regimentOfRenown;
  if (!pick) {
    return undefined;
  }
  const ror = getRegimentOfRenown(pick.renownId);
  const slot = ror?.units.find((unit) => unit.id === unitId);
  return slot ? rorUnitAsCatalogue(slot) : undefined;
}

export function rorTemplateForSelection(
  list: ArmyList,
  selectionId: string,
): RegimentOfRenownUnit | undefined {
  const pick = list.regimentOfRenown;
  if (!pick) {
    return undefined;
  }
  const selection = pick.units.find((slot) => slot.id === selectionId);
  if (!selection) {
    return undefined;
  }
  return getRegimentOfRenown(pick.renownId)?.units.find(
    (unit) => unit.id === selection.unitId,
  );
}

export type ScourgeRealm = "aqshy" | "ghyran";

const SCOURGE_SUFFIX: Record<ScourgeRealm, string> = {
  aqshy: " (Scourge of Aqshy)",
  ghyran: " (Scourge of Ghyran)",
};

export function unitBaseName(name: string): string {
  return name
    .replace(/ \(Scourge of Aqshy\)$/i, "")
    .replace(/ \(Scourge of Ghyran\)$/i, "");
}

export function unitScourgeRealm(name: string): ScourgeRealm | null {
  if (/ \(Scourge of Aqshy\)$/i.test(name)) {
    return "aqshy";
  }
  if (/ \(Scourge of Ghyran\)$/i.test(name)) {
    return "ghyran";
  }
  return null;
}

export function factionHasScourge(faction: FactionCatalogue): boolean {
  return faction.units.some((unit) => unitScourgeRealm(unit.name) !== null);
}

/** Pick the datasheet for this warscroll under the army's scourge setting. */
export function preferredUnitForRealm(
  faction: FactionCatalogue,
  baseName: string,
  realm: ScourgeRealm | null,
): CatalogueUnit | undefined {
  const family = faction.units.filter(
    (unit) => unitBaseName(unit.name) === baseName,
  );
  if (family.length === 0) {
    return undefined;
  }
  if (realm) {
    const suffix = SCOURGE_SUFFIX[realm];
    const scourge = family.find((unit) => unit.name === `${baseName}${suffix}`);
    if (scourge) {
      return scourge;
    }
  }
  return (
    family.find((unit) => unitScourgeRealm(unit.name) === null) ?? family[0]
  );
}

export function resolveUnitIdForRealm(
  faction: FactionCatalogue,
  unitId: string,
  realm: ScourgeRealm | null,
): string {
  const current = getUnit(faction, unitId);
  if (!current) {
    return unitId;
  }
  const preferred = preferredUnitForRealm(
    faction,
    unitBaseName(current.name),
    realm,
  );
  return preferred?.id ?? unitId;
}

/** Every catalogue unit variant (core + SoA sheets) for pickers. */
export function unitsForPicker(faction: FactionCatalogue): CatalogueUnit[] {
  return [...faction.units].sort((a, b) => {
    if (a.hero !== b.hero) {
      return a.hero ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });
}

/** Units available for the auxiliary picker — includes heroes. */
export function auxiliaryPickerUnits(faction: FactionCatalogue): CatalogueUnit[] {
  // GHB: heroes may be auxiliaries unless they have compulsory regiment
  // options. Catalogues only model optional slots, so include heroes
  // (e.g. Harbinger of Decay as a priest aux).
  return unitsForPicker(faction);
}

/** One datasheet per warscroll, matching the army scourge realm. */
export function unitsForRealm(
  faction: FactionCatalogue,
  realm: ScourgeRealm | null,
): CatalogueUnit[] {
  const seen = new Set<string>();
  const rows: CatalogueUnit[] = [];
  for (const unit of faction.units) {
    const base = unitBaseName(unit.name);
    if (seen.has(base)) {
      continue;
    }
    seen.add(base);
    const preferred = preferredUnitForRealm(faction, base, realm);
    if (preferred) {
      rows.push(preferred);
    }
  }
  return rows;
}

export function getUnit(
  faction: FactionCatalogue,
  unitId: string,
): CatalogueUnit | undefined {
  return faction.units.find((unit) => unit.id === unitId);
}

export function heroesOf(faction: FactionCatalogue): CatalogueUnit[] {
  return unitsForPicker(faction).filter((unit) => unit.hero);
}

export function optionMatches(
  unit: CatalogueUnit,
  option: RegimentOption,
  faction?: FactionCatalogue,
): boolean {
  if (option.type === "unit") {
    if (unit.id === option.id) {
      return true;
    }
    if (!faction) {
      return false;
    }
    const optionUnit = getUnit(faction, option.id);
    return (
      !!optionUnit &&
      unitBaseName(unit.name) === unitBaseName(optionUnit.name)
    );
  }
  return unit.categories.includes(option.name);
}

export function canJoinRegiment(
  hero: CatalogueUnit,
  unit: CatalogueUnit,
  faction?: FactionCatalogue,
): boolean {
  if (unitBaseName(unit.name) === unitBaseName(hero.name)) {
    return false;
  }
  const slots = unit.hero
    ? (hero.regimentHeroes ?? [])
    : hero.regimentOptions;
  return slots.some((option) => optionMatches(unit, option, faction));
}

export function legalCompanions(
  faction: FactionCatalogue,
  hero: CatalogueUnit,
): CatalogueUnit[] {
  return unitsForPicker(faction)
    .filter((unit) => canJoinRegiment(hero, unit, faction))
    .sort((a, b) => {
      if (a.hero !== b.hero) {
        return a.hero ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
}

export function selectionPoints(
  unit: CatalogueUnit,
  reinforced: boolean,
  selection?: Selection | null,
): number {
  const anvil = anvilRankForSelection(unit, selection);
  const base = anvil?.points ?? unit.points;
  return base * (reinforced ? 2 : 1);
}

export function unitHasKeyword(unit: CatalogueUnit, keyword: string): boolean {
  return unit.categories.some(
    (category) =>
      category === keyword ||
      category.startsWith(`${keyword} `) ||
      category.startsWith(`${keyword} (`),
  );
}

export function canTakeMonstrousTrait(unit: CatalogueUnit): boolean {
  return unitHasKeyword(unit, "MONSTER") && !unit.unique;
}

export function canTakeVisionOfFate(unit: CatalogueUnit): boolean {
  return !unit.hero && !unit.unique && !unitHasKeyword(unit, "BEAST");
}

export function specialEnhancementTablesForList(
  faction: FactionCatalogue,
  list: Pick<ArmyList, "scourgeRealm">,
): SpecialEnhancementTable[] {
  return (faction.specialEnhancementTables ?? []).filter((table) => {
    if (!table.realm) {
      return true;
    }
    return list.scourgeRealm === table.realm;
  });
}

export function canTakeSpecialEnhancement(
  unit: CatalogueUnit,
  table: SpecialEnhancementTable,
): boolean {
  if (uniqueKeywordBlocksEnhancements(unit)) {
    return false;
  }
  if (table.restrictTo === "nonHeroNonMonster") {
    return (
      !unit.hero &&
      !unitHasKeyword(unit, "HERO") &&
      !unitHasKeyword(unit, "MONSTER")
    );
  }
  return true;
}

export function enhancementChoiceDetail(
  option: { points?: number; pack?: string },
): string | undefined {
  const parts: string[] = [];
  if (option.pack) {
    parts.push(option.pack);
  }
  if (option.points) {
    parts.push(`${option.points} pts`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function formationLabel(formation: Formation): string {
  return formation.points
    ? `${formation.name} · ${formation.points} pts`
    : formation.name;
}

export function enhancementLabel(
  options: EnhancementOption[],
  optionId: string | null | undefined,
): string | undefined {
  if (!optionId) {
    return undefined;
  }
  const option = options.find((item) => item.id === optionId);
  if (!option) {
    return undefined;
  }
  const extra = enhancementChoiceDetail(option);
  return extra ? `${option.name} · ${extra}` : option.name;
}

export function enhancementSlotView(
  options: EnhancementOption[],
  optionId: string | null | undefined,
  selectionId: string,
): {
  bearerId: string | null;
  label?: string;
  abilities?: UnitAbility[];
} {
  if (!optionId) {
    return { bearerId: null };
  }
  const option = options.find((item) => item.id === optionId);
  return {
    bearerId: selectionId,
    label: enhancementLabel(options, optionId),
    abilities: option?.abilities,
  };
}

export function listHeroGearSlots(
  list: ArmyList,
  faction: FactionCatalogue,
  selection: Selection,
): {
  artefactBearerId: string | null;
  artefactLabel?: string;
  artefactAbilities?: UnitAbility[];
  heroicTraitBearerId: string | null;
  heroicTraitLabel?: string;
  heroicTraitAbilities?: UnitAbility[];
} {
  const artefact = enhancementSlotView(
    faction.artefacts,
    selectionArtefactOptionId(list, selection),
    selection.id,
  );
  const trait = enhancementSlotView(
    faction.heroicTraits,
    selectionHeroicTraitOptionId(list, selection),
    selection.id,
  );
  return {
    artefactBearerId: artefact.bearerId,
    artefactLabel: artefact.label,
    artefactAbilities: artefact.abilities,
    heroicTraitBearerId: trait.bearerId,
    heroicTraitLabel: trait.label,
    heroicTraitAbilities: trait.abilities,
  };
}

export function pickedEnhancementPoints(
  pick: { optionId: string } | null | undefined,
  options: EnhancementOption[] | undefined,
): number {
  if (!pick) {
    return 0;
  }
  return options?.find((item) => item.id === pick.optionId)?.points ?? 0;
}

export function unitIsWarmaster(unit: CatalogueUnit): boolean {
  return unitHasKeyword(unit, "WARMASTER");
}

/** Regiments whose hero has the Warmaster keyword. */
export function warmasterRegiments(
  list: ArmyList,
  faction: FactionCatalogue,
) {
  return list.regiments.filter((regiment) => {
    if (!regiment.hero) {
      return false;
    }
    const hero = getUnit(faction, regiment.hero.unitId);
    return hero ? unitIsWarmaster(hero) : false;
  });
}

/**
 * With any Warmaster in the army, only a Warmaster regiment may be general.
 * With none, any regiment may.
 */
export function canBeGeneral(
  list: ArmyList,
  faction: FactionCatalogue,
  regimentId: string,
): boolean {
  const warmasters = warmasterRegiments(list, faction);
  if (warmasters.length === 0) {
    return true;
  }
  return warmasters.some((regiment) => regiment.id === regimentId);
}

/** First Warmaster regiment, or keep/restore a valid general. */
export function resolveGeneralRegimentId(
  list: ArmyList,
  faction: FactionCatalogue,
): string | null {
  const warmasters = warmasterRegiments(list, faction);
  if (warmasters.length > 0) {
    if (
      list.generalRegimentId &&
      warmasters.some((regiment) => regiment.id === list.generalRegimentId)
    ) {
      return list.generalRegimentId;
    }
    return warmasters[0]?.id ?? null;
  }

  if (
    list.generalRegimentId &&
    list.regiments.some((regiment) => regiment.id === list.generalRegimentId)
  ) {
    return list.generalRegimentId;
  }
  return list.regiments[0]?.id ?? null;
}

type StatProfile = {
  stats: UnitStats;
  categories: string[];
};

export function unitWard(subject: StatProfile): string {
  for (const category of subject.categories) {
    const match = /^WARD\s*\((.+)\)$/i.exec(category);
    if (match) {
      return match[1];
    }
  }
  return "";
}

export function battleStatLine(unit: CatalogueUnit): string {
  const parts: string[] = [];
  const { move, health, save, control } = unit.stats ?? {
    move: "",
    health: "",
    save: "",
    control: "",
  };
  if (move) {
    parts.push(`Move ${move}`);
  }
  if (health) {
    parts.push(`Health ${health}`);
  }
  if (save) {
    parts.push(`Save ${save}`);
  }
  if (control) {
    parts.push(`Control ${control}`);
  }
  const ward = unitWard(unit);
  if (ward) {
    parts.push(`Ward ${ward}`);
  }
  return parts.join(" · ");
}

export function moveStatLine(unit: CatalogueUnit): string {
  const move = unit.stats?.move?.trim();
  if (!move || move === "-") {
    return "";
  }
  return `Move ${move}`;
}

export function defenceStatLine(subject: StatProfile): string {
  const parts: string[] = [];
  const save = subject.stats?.save?.trim();
  if (save && save !== "-") {
    parts.push(`Save ${save}`);
  }
  const ward = unitWard(subject);
  if (ward) {
    parts.push(`Ward ${ward}`);
  }
  return parts.join(" · ");
}

export function healthPerModel(unit: CatalogueUnit): number {
  const value = Number.parseInt(unit.stats?.health ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function selectionModelCount(
  unit: CatalogueUnit,
  reinforced: boolean,
): number {
  const base = unit.models > 0 ? unit.models : 1;
  return reinforced && unit.reinforce ? base * 2 : base;
}

/** Human-readable size for pickers and roster rows, e.g. "10 models". */
export function unitSizeLabel(
  unit: CatalogueUnit,
  reinforced = false,
): string {
  const count = selectionModelCount(unit, reinforced);
  return count === 1 ? "1 model" : `${count} models`;
}

export type SelectionPlayState = {
  damage: number;
  health: number;
  healthMax: number;
  healthPerModel: number;
  models: number;
  modelsMax: number;
};

export type BattleDamagedWarning = {
  threshold: number;
  summary: string;
  /** When Battle Damaged sets a weapon's Attacks characteristic. */
  attacksOverride?: {
    weaponName: string;
    attacks: string;
  };
};

/** Active Battle Damaged reminder for Play mode health tracking. */
export function battleDamagedWarning(
  unit: CatalogueUnit,
  damage: number,
): BattleDamagedWarning | null {
  const ability = unit.abilities.find(
    (item) => item.name.toLowerCase() === "battle damaged",
  );
  if (!ability?.effect) {
    return null;
  }
  const match = /while this unit has (\d+) or more damage points[,.]?\s*(.*)/i.exec(
    ability.effect,
  );
  const threshold = match ? Number.parseInt(match[1] ?? "10", 10) : 10;
  if (!Number.isFinite(threshold) || damage < threshold) {
    return null;
  }
  const rest = (match?.[2] ?? ability.effect).trim().replace(/\.$/, "");
  const attacks = /the Attacks characteristic of (.+?) is (\d+)/i.exec(rest);
  const attacksOverride = attacks
    ? {
        weaponName: (attacks[1] ?? "").trim(),
        attacks: (attacks[2] ?? "").trim(),
      }
    : undefined;
  const summary = attacksOverride
    ? `${attacksOverride.weaponName} · Attacks ${attacksOverride.attacks}`
    : rest || "Battle Damaged is in effect.";
  return { threshold, summary, attacksOverride };
}

/** Resolve displayed Attacks for a weapon under current damage. */
export function weaponAttacksForDamage(
  unit: CatalogueUnit,
  weaponName: string,
  baseAttacks: string,
  damage: number,
): { attacks: string; modified: boolean } {
  const warning = battleDamagedWarning(unit, damage);
  const override = warning?.attacksOverride;
  if (
    override &&
    weaponName.toLowerCase().includes(override.weaponName.toLowerCase())
  ) {
    return { attacks: override.attacks, modified: true };
  }
  if (
    override &&
    override.weaponName.toLowerCase().includes(weaponName.toLowerCase())
  ) {
    return { attacks: override.attacks, modified: true };
  }
  return { attacks: baseAttacks, modified: false };
}

export function getSelection(
  list: ArmyList,
  selectionId: string,
): Selection | undefined {
  return findSelection(list, selectionId)?.selection;
}

export function selectionDamage(
  list: ArmyList,
  selectionId: string,
  faction?: FactionCatalogue,
): number {
  const found = findSelection(list, selectionId);
  if (!found) {
    return 0;
  }
  if (!faction) {
    return found.selection.play?.damage ?? 0;
  }
  const unit = getListUnit(list, faction, found.selection.unitId);
  if (!unit) {
    return found.selection.play?.damage ?? 0;
  }
  return selectionPlayState(found.selection, unit).damage;
}

function findSelection(
  list: ArmyList,
  selectionId: string,
): { selection: Selection } | null {
  for (const regiment of list.regiments) {
    if (regiment.hero?.id === selectionId) {
      return { selection: regiment.hero };
    }
    for (const slot of regiment.units) {
      if (slot.id === selectionId) {
        return { selection: slot };
      }
    }
  }
  for (const slot of list.auxiliaries) {
    if (slot.id === selectionId) {
      return { selection: slot };
    }
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    if (slot.id === selectionId) {
      return { selection: slot };
    }
  }
  return null;
}

export function selectionPlayState(
  selection: Selection,
  unit: CatalogueUnit,
): SelectionPlayState {
  const perModel = healthPerModel(unit);
  const modelsMax = selectionModelCount(unit, selection.reinforced);
  const healthMax = perModel * modelsMax;
  const play = selection.play;
  let damage = 0;
  if (play && typeof play.damage === "number") {
    damage = play.damage;
  } else if (play && typeof play.health === "number") {
    damage = healthMax - play.health;
  }
  damage = Math.min(healthMax, Math.max(0, damage));
  const health = healthMax - damage;
  const models = health <= 0 ? 0 : Math.ceil(health / perModel);
  return {
    damage,
    health,
    healthMax,
    healthPerModel: perModel,
    models,
    modelsMax,
  };
}

export function selectionIsDestroyed(
  selection: Selection,
  unit: CatalogueUnit,
): boolean {
  return selectionPlayState(selection, unit).health <= 0;
}

export function manifestationStatLine(model: {
  stats: { move: string; health: string; save: string; control: string };
  banishment: string;
}): string {
  const parts: string[] = [];
  const { move, health, save } = model.stats;
  if (move) {
    parts.push(`Move ${move}`);
  }
  if (health) {
    parts.push(`Health ${health}`);
  }
  if (save) {
    parts.push(`Save ${save}`);
  }
  if (model.banishment) {
    parts.push(`Banish ${model.banishment}`);
  }
  return parts.join(" · ");
}

export function namedOption(
  options: NamedOption[],
  id: string | null | undefined,
): NamedOption | undefined {
  if (!id) {
    return undefined;
  }
  return options.find((option) => option.id === id);
}

export function armyHasKeyword(
  list: ArmyList,
  faction: FactionCatalogue,
  keyword: string,
): boolean {
  const ids: string[] = [];
  for (const regiment of list.regiments) {
    if (regiment.hero) {
      ids.push(regiment.hero.unitId);
    }
    for (const slot of regiment.units) {
      ids.push(slot.unitId);
    }
  }
  for (const slot of list.auxiliaries) {
    ids.push(slot.unitId);
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    ids.push(slot.unitId);
  }
  return ids.some((unitId) => {
    const unit = getListUnit(list, faction, unitId);
    return unit ? unitHasKeyword(unit, keyword) : false;
  });
}
