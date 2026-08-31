import { getListUnit, getRegimentOfRenown, getSelection } from "./queries";
import { isSpearheadList } from "./spearhead";
import { findPath, findPathOption, isPathToGloryList, learnedManifestationsForList, resolveAnvilUnit, selectionDisplayName } from "./pathToGlory";
import { isUniversalCoreAbility, warscrollAbilities } from "./coreRules";
import type {
  ArmyList,
  CatalogueUnit,
  FactionCatalogue,
  Selection,
  UnitAbility,
  UnitWeapon,
} from "./types";

export type PlayPhaseId =
  | "passive"
  | "hero"
  | "movement"
  | "shooting"
  | "charge"
  | "combat"
  | "end";

export type PlayPhase = {
  id: PlayPhaseId;
  name: string;
  blurb: string;
};

/** Always shown in Play → Phases, in this order. */
export const CORE_PLAY_PHASES: PlayPhase[] = [
  {
    id: "passive",
    name: "Army",
    blurb: "Battle traits, formation, passives, and deploy",
  },
  { id: "hero", name: "Hero", blurb: "Spells, prayers, hero-phase abilities" },
  { id: "movement", name: "Movement", blurb: "Movement-phase abilities" },
  { id: "shooting", name: "Shooting", blurb: "Ranged weapons and shooting abilities" },
  { id: "charge", name: "Charge", blurb: "Charge-phase abilities" },
  { id: "combat", name: "Combat", blurb: "Melee weapons and combat-phase abilities" },
  { id: "end", name: "End of turn", blurb: "End-of-turn abilities" },
];

export const PLAY_PHASES: PlayPhase[] = CORE_PLAY_PHASES;

const CORE_PHASE_IDS = new Set(CORE_PLAY_PHASES.map((phase) => phase.id));

export type RosterEntry = {
  selectionId: string;
  unit: CatalogueUnit;
  reinforced: boolean;
};

export type PhaseAbilityRow = {
  selectionId: string;
  unitName: string;
  ability: UnitAbility;
};

export type PhaseWeaponRow = {
  selectionId: string;
  unitName: string;
  weapon: UnitWeapon;
};

export type PhaseBoard = {
  phase: PlayPhase;
  abilities: PhaseAbilityRow[];
  weapons: PhaseWeaponRow[];
};

export function armyRoster(
  list: ArmyList,
  faction: FactionCatalogue,
): RosterEntry[] {
  const rows: RosterEntry[] = [];
  const add = (selection: Selection) => {
    const unit = getListUnit(list, faction, selection.unitId);
    if (!unit) {
      return;
    }
    rows.push({
      selectionId: selection.id,
      unit: resolveAnvilUnit(unit, selection),
      reinforced: selection.reinforced,
    });
  };

  for (const regiment of list.regiments) {
    if (regiment.hero) {
      add(regiment.hero);
    }
    for (const slot of regiment.units) {
      add(slot);
    }
  }
  for (const slot of list.auxiliaries) {
    add(slot);
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    add(slot);
  }
  return rows;
}

export type RegimentPlayGroup = {
  id: string;
  label: string;
  subtitle?: string;
  entries: RosterEntry[];
};

/** Regiment-shaped roster for Play phase unit grouping (movement, etc.). */
export function regimentPlayGroups(
  list: ArmyList,
  faction: FactionCatalogue,
): RegimentPlayGroup[] {
  const groups: RegimentPlayGroup[] = [];

  for (const regiment of list.regiments) {
    const entries: RosterEntry[] = [];
    const push = (selection: Selection) => {
      const unit = getListUnit(list, faction, selection.unitId);
      if (!unit) {
        return;
      }
      entries.push({
        selectionId: selection.id,
        unit,
        reinforced: selection.reinforced,
      });
    };
    if (regiment.hero) {
      push(regiment.hero);
    }
    for (const slot of regiment.units) {
      push(slot);
    }
    if (entries.length === 0) {
      continue;
    }
    const heroUnit = regiment.hero
      ? getListUnit(list, faction, regiment.hero.unitId)
      : undefined;
    groups.push({
      id: regiment.id,
      label: heroUnit?.name ?? "Regiment",
      subtitle:
        list.generalRegimentId === regiment.id
          ? "General's regiment"
          : "Regiment",
      entries,
    });
  }

  const auxEntries: RosterEntry[] = [];
  for (const slot of list.auxiliaries) {
    const unit = getListUnit(list, faction, slot.unitId);
    if (!unit) {
      continue;
    }
    auxEntries.push({
      selectionId: slot.id,
      unit,
      reinforced: slot.reinforced,
    });
  }
  if (auxEntries.length > 0) {
    groups.push({
      id: "__aux__",
      label: "Auxiliaries",
      entries: auxEntries,
    });
  }

  const rorEntries: RosterEntry[] = [];
  for (const slot of list.regimentOfRenown?.units ?? []) {
    const unit = getListUnit(list, faction, slot.unitId);
    if (!unit) {
      continue;
    }
    rorEntries.push({
      selectionId: slot.id,
      unit,
      reinforced: slot.reinforced,
    });
  }
  if (rorEntries.length > 0) {
    const ror = list.regimentOfRenown
      ? getRegimentOfRenown(list.regimentOfRenown.renownId)
      : undefined;
    groups.push({
      id: "__ror__",
      label: ror?.name ?? "Regiment of Renown",
      subtitle: "Regiment of Renown",
      entries: rorEntries,
    });
  }

  return groups;
}

export function rosterSelectionIds(list: ArmyList): Set<string> {
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
  return ids;
}

export function phasesForAbility(ability: UnitAbility): PlayPhaseId[] {
  const kind = ability.kind.toLowerCase();
  if (kind === "passive") {
    return ["passive"];
  }
  if (kind === "spell" || kind === "prayer") {
    return ["hero"];
  }

  const timing = ability.timing.toLowerCase();
  if (!timing || timing === "passive") {
    return kind === "activated" ? ["hero"] : ["passive"];
  }

  const phases: PlayPhaseId[] = [];
  const add = (id: PlayPhaseId) => {
    if (!phases.includes(id)) {
      phases.push(id);
    }
  };

  if (
    timing.includes("deployment") ||
    timing.includes("start of battle") ||
    timing.includes("start of the battle") ||
    timing.includes("start of")
  ) {
    add("passive");
  }
  if (
    timing.includes("hero phase") ||
    timing.includes("spell ability") ||
    timing.includes("prayer ability") ||
    timing.includes("chant this prayer") ||
    timing.includes("cast this spell")
  ) {
    add("hero");
  }
  if (
    timing.includes("movement phase") ||
    timing.includes("move ability") ||
    timing.includes("run ability") ||
    timing.includes("retreat ability")
  ) {
    add("movement");
  }
  if (
    timing.includes("shooting phase") ||
    timing.includes("shoot ability")
  ) {
    add("shooting");
  }
  if (
    timing.includes("charge phase") ||
    timing.includes("charge ability")
  ) {
    add("charge");
  }
  if (
    timing.includes("combat phase") ||
    timing.includes("fight ability") ||
    timing.includes("declared a fight") ||
    timing.includes("attack ability")
  ) {
    add("combat");
  }
  if (timing.includes("end of")) {
    add("end");
  }

  if (phases.length === 0) {
    add("passive");
  }
  return phases;
}

export function buildPhaseBoards(
  list: ArmyList,
  faction: FactionCatalogue,
): PhaseBoard[] {
  const roster = armyRoster(list, faction);
  const boards = new Map<PlayPhaseId, PhaseBoard>();
  for (const phase of PLAY_PHASES) {
    boards.set(phase.id, {
      phase,
      abilities: [],
      weapons: [],
    });
  }

  const formationId = list.regimentAbilityId ?? list.formationId;
  const formation = faction.formations.find(
    (item) => item.id === formationId,
  );
  if (formation) {
    pushLabeledAbilities(
      boards,
      formation.id,
      isSpearheadList(list)
        ? `Regiment ability · ${formation.name}`
        : `Battle formation · ${formation.name}`,
      formation.abilities,
    );
  }

  for (const trait of faction.battleTraits ?? []) {
    pushLabeledAbilities(
      boards,
      trait.id,
      `Battle trait · ${trait.name}`,
      trait.abilities,
    );
  }

  const ror = list.regimentOfRenown
    ? getRegimentOfRenown(list.regimentOfRenown.renownId)
    : undefined;
  if (ror) {
    pushLabeledAbilities(
      boards,
      ror.id,
      `Regiment of Renown · ${ror.name}`,
      ror.abilities,
    );
  }

  for (const feature of faction.terrain) {
    pushLabeledAbilities(
      boards,
      feature.id,
      `Terrain · ${feature.name}`,
      feature.abilities,
    );
  }

  for (const entry of roster) {
    const abilities = isSpearheadList(list)
      ? warscrollAbilities(entry.unit)
      : entry.unit.abilities;
    const selection = getSelection(list, entry.selectionId);
    const unitName = selectionDisplayName(selection, entry.unit);
    for (const ability of abilities) {
      if (omitFromPhaseBoard(ability, isSpearheadList(list))) {
        continue;
      }
      for (const phaseId of phasesForAbility(ability)) {
        boards.get(phaseId)?.abilities.push({
          selectionId: entry.selectionId,
          unitName,
          ability,
        });
      }
    }
    const path = findPath(selection?.pathToGlory?.pathId);
    const optionIds = selection?.pathToGlory?.pathOptionIds ?? [];
    const picked = path
      ? optionIds
          .map((optionId) => findPathOption(path, optionId))
          .filter((option) => option != null)
      : [];
    if (picked.length > 0) {
      for (const option of picked) {
        for (const phaseId of phasesForAbility(option.ability)) {
          boards.get(phaseId)?.abilities.push({
            selectionId: entry.selectionId,
            unitName,
            ability: option.ability,
          });
        }
      }
    } else if (path) {
      boards.get("passive")?.abilities.push({
        selectionId: entry.selectionId,
        unitName,
        ability: {
          name: path.name,
          kind: "passive",
          timing: "Path to Glory",
          declare: "",
          effect: "",
          keywords: "",
          castingValue: "",
          chantingValue: "",
        },
      });
    }
    for (const weapon of entry.unit.weapons) {
      const phaseId: PlayPhaseId =
        weapon.kind === "ranged" ? "shooting" : "combat";
      boards.get(phaseId)?.weapons.push({
        selectionId: entry.selectionId,
        unitName,
        weapon,
      });
    }
  }

  pushEnhancementAbilities(list, faction, boards, "artefact");
  pushEnhancementAbilities(list, faction, boards, "heroicTrait");
  pushEnhancementAbilities(list, faction, boards, "monstrousTrait");
  pushEnhancementAbilities(list, faction, boards, "visionOfFate");

  for (const pick of list.specialEnhancements ?? []) {
    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === pick.tableId,
    );
    const option = table?.options.find((item) => item.id === pick.optionId);
    if (!table || !option) {
      continue;
    }
    const bearer = rosterUnitName(list, faction, pick.heroSelectionId);
    const unitName = bearer
      ? `${bearer} · ${table.name}`
      : `${table.name} · ${option.name}`;
    for (const ability of option.abilities) {
      for (const phaseId of phasesForAbility(ability)) {
        boards.get(phaseId)?.abilities.push({
          selectionId: pick.heroSelectionId,
          unitName,
          ability,
        });
      }
    }
  }

  const models = isPathToGloryList(list)
    ? learnedManifestationsForList(list, faction)
    : faction.manifestationLores.find(
        (item) => item.id === list.manifestationLoreId,
      )?.manifestations ?? [];
  for (const model of models) {
      const powers = [
        ...(model.summon ? [model.summon] : []),
        ...model.abilities,
      ];
      for (const ability of powers) {
        if (omitFromPhaseBoard(ability, isSpearheadList(list))) {
          continue;
        }
        for (const phaseId of phasesForAbility(ability)) {
          boards.get(phaseId)?.abilities.push({
            selectionId: model.id,
            unitName: model.name,
            ability,
          });
        }
      }
      for (const weapon of model.weapons) {
        const phaseId: PlayPhaseId =
          weapon.kind === "ranged" ? "shooting" : "combat";
        boards.get(phaseId)?.weapons.push({
          selectionId: model.id,
          unitName: model.name,
          weapon,
        });
      }
  }

  return PLAY_PHASES.map((phase) => boards.get(phase.id)!).filter(
    (board) =>
      CORE_PHASE_IDS.has(board.phase.id) ||
      board.abilities.length > 0 ||
      board.weapons.length > 0,
  );
}

function pushLabeledAbilities(
  boards: Map<PlayPhaseId, PhaseBoard>,
  selectionId: string,
  unitName: string,
  abilities: UnitAbility[],
) {
  for (const ability of abilities) {
    if (omitFromPhaseBoard(ability, false)) {
      continue;
    }
    for (const phaseId of phasesForAbility(ability)) {
      boards.get(phaseId)?.abilities.push({
        selectionId,
        unitName,
        ability,
      });
    }
  }
}

/** Profile reminders and universal core rules belong off Spearhead unit rows. */
function omitFromPhaseBoard(ability: UnitAbility, spearhead: boolean): boolean {
  return spearhead && isUniversalCoreAbility(ability.name);
}

function pushEnhancementAbilities(
  list: ArmyList,
  faction: FactionCatalogue,
  boards: Map<PlayPhaseId, PhaseBoard>,
  field: "artefact" | "heroicTrait" | "monstrousTrait" | "visionOfFate",
) {
  const pick = list[field];
  if (!pick) {
    return;
  }
  const options =
    field === "artefact"
      ? faction.artefacts
      : field === "heroicTrait"
        ? faction.heroicTraits
        : field === "monstrousTrait"
          ? (faction.monstrousTraits ?? [])
          : (faction.visionsOfFate ?? []);
  const option = options.find((item) => item.id === pick.optionId);
  if (!option) {
    return;
  }
  const bearer = rosterUnitName(list, faction, pick.heroSelectionId);
  const kindLabel =
    field === "artefact"
      ? "Artefact"
      : field === "heroicTrait"
        ? isSpearheadList(list)
          ? "Enhancement"
          : "Heroic trait"
        : field === "monstrousTrait"
          ? "Monstrous trait"
          : "Vision of Fate";
  const unitName = bearer
    ? `${bearer} · ${kindLabel}`
    : `${kindLabel} · ${option.name}`;

  for (const ability of option.abilities) {
    for (const phaseId of phasesForAbility(ability)) {
      boards.get(phaseId)?.abilities.push({
        selectionId: pick.heroSelectionId,
        unitName,
        ability,
      });
    }
  }
}

function rosterUnitName(
  list: ArmyList,
  faction: FactionCatalogue,
  selectionId: string,
): string | null {
  const selection = getSelection(list, selectionId);
  if (!selection) {
    return null;
  }
  const unit = getListUnit(list, faction, selection.unitId);
  return unit ? selectionDisplayName(selection, unit) : null;
}
