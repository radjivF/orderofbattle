import { getListUnit, getRegimentOfRenown } from "./queries";
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
      unit,
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

  const formation = faction.formations.find(
    (item) => item.id === list.formationId,
  );
  if (formation) {
    pushLabeledAbilities(
      boards,
      formation.id,
      `Battle formation · ${formation.name}`,
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
    for (const ability of entry.unit.abilities) {
      if (omitFromPhaseBoard(ability)) {
        continue;
      }
      for (const phaseId of phasesForAbility(ability)) {
        boards.get(phaseId)?.abilities.push({
          selectionId: entry.selectionId,
          unitName: entry.unit.name,
          ability,
        });
      }
    }
    for (const weapon of entry.unit.weapons) {
      const phaseId: PlayPhaseId =
        weapon.kind === "ranged" ? "shooting" : "combat";
      boards.get(phaseId)?.weapons.push({
        selectionId: entry.selectionId,
        unitName: entry.unit.name,
        weapon,
      });
    }
  }

  pushEnhancementAbilities(list, faction, boards, "artefact");
  pushEnhancementAbilities(list, faction, boards, "heroicTrait");
  pushEnhancementAbilities(list, faction, boards, "monstrousTrait");
  pushEnhancementAbilities(list, faction, boards, "visionOfFate");

  const lore = faction.manifestationLores.find(
    (item) => item.id === list.manifestationLoreId,
  );
  if (lore) {
    for (const model of lore.manifestations) {
      const powers = [
        ...(model.summon ? [model.summon] : []),
        ...model.abilities,
      ];
      for (const ability of powers) {
        if (omitFromPhaseBoard(ability)) {
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
    if (omitFromPhaseBoard(ability)) {
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

/** Profile reminders belong on the unit card / datasheet, not phase boards. */
function omitFromPhaseBoard(ability: UnitAbility): boolean {
  return ability.name.toLowerCase() === "battle damaged";
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
        ? "Heroic trait"
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
  for (const regiment of list.regiments) {
    if (regiment.hero?.id === selectionId) {
      return getListUnit(list, faction, regiment.hero.unitId)?.name ?? null;
    }
    for (const slot of regiment.units) {
      if (slot.id === selectionId) {
        return getListUnit(list, faction, slot.unitId)?.name ?? null;
      }
    }
  }
  for (const slot of list.auxiliaries) {
    if (slot.id === selectionId) {
      return getListUnit(list, faction, slot.unitId)?.name ?? null;
    }
  }
  for (const slot of list.regimentOfRenown?.units ?? []) {
    if (slot.id === selectionId) {
      return getListUnit(list, faction, slot.unitId)?.name ?? null;
    }
  }
  return null;
}
