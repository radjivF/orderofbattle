import type { PlayPhaseId } from "./phases";

/** Universal core commands (Wahapedia / AoS 4th Core Rules). */
export type CoreCommand = {
  id: string;
  name: string;
  cost: number;
  timing: string;
  declare: string;
  effect: string;
  keywords?: string;
};

/**
 * Core commands available in each Play phase tab.
 * All-out Attack / Defence appear in both shooting and combat (ATTACK reactions).
 */
export const CORE_COMMANDS_BY_PHASE: Record<PlayPhaseId, CoreCommand[]> = {
  passive: [],
  start: [],
  hero: [
    {
      id: "rally",
      name: "Rally",
      cost: 1,
      timing: "Any Hero Phase",
      declare: "Pick a friendly unit that is not in combat to use this ability.",
      effect:
        "Make 6 rally rolls of D6. For each 4+, you receive 1 rally point. Rally points can be spent in the following ways: For each rally point spent, Heal (1) that unit. You can spend a number of rally points equal to the Health characteristic of that unit to return a slain model to that unit. You can spend the rally points in any combination of the above. Unspent rally points are then lost.",
    },
    {
      id: "magical-intervention",
      name: "Magical Intervention",
      cost: 1,
      timing: "Enemy Hero Phase",
      declare: "Pick a friendly WIZARD or PRIEST to use this ability.",
      effect:
        "That friendly unit can use a SPELL or PRAYER ability (as appropriate) as if it were your hero phase. If you do so, subtract 1 from casting rolls or chanting rolls made as part of that ability.",
    },
  ],
  movement: [
    {
      id: "redeploy",
      name: "Redeploy",
      cost: 1,
      timing: "Enemy Movement Phase",
      declare: "Pick a friendly unit that is not in combat to use this ability.",
      effect:
        'Each model in that unit can move up to D6". That move cannot pass through or end within the combat range of an enemy unit.',
      keywords: "Move, Run",
    },
    {
      id: "at-the-double",
      name: "At the Double",
      cost: 1,
      timing: "Reaction: You declared a RUN ability",
      declare: "Used by the unit using that RUN ability.",
      effect:
        "Do not make a run roll as part of that RUN ability. Instead, add 6\" to that unit's Move characteristic to determine the distance each model in that unit can move as part of that RUN ability.",
    },
  ],
  shooting: [
    {
      id: "covering-fire",
      name: "Covering Fire",
      cost: 1,
      timing: "Enemy Shooting Phase",
      declare:
        "Pick a friendly unit that did not use a RUN ability this turn and that is not in combat to use this ability, then pick the closest enemy unit (to that unit) that can be picked as the target of shooting attacks to be the target. You cannot pick MANIFESTATIONS or faction terrain features as the target of this ability.",
      effect:
        "Resolve shooting attacks for the unit using this ability against the target. You must subtract 1 from the hit rolls for those attacks.",
      keywords: "Shoot, Attack",
    },
    {
      id: "all-out-attack",
      name: "All-out Attack",
      cost: 1,
      timing: "Reaction: You declared an ATTACK ability",
      declare: "Used by the unit using that ATTACK ability.",
      effect:
        "Add 1 to hit rolls for attacks made as part of that ATTACK ability. This also affects weapons that have the Companion weapon ability. For the rest of the turn, subtract 1 from save rolls for the unit using this ability.",
    },
    {
      id: "all-out-defence",
      name: "All-out Defence",
      cost: 1,
      timing: "Reaction: Opponent declared an ATTACK ability",
      declare: "Used by a unit targeted by that ATTACK ability.",
      effect:
        "Add 1 to save rolls for that unit until that ATTACK ability has been resolved.",
    },
  ],
  charge: [
    {
      id: "counter-charge",
      name: "Counter-charge",
      cost: 2,
      timing: "Enemy Charge Phase",
      declare: "Pick a friendly unit that is not in combat to use this ability.",
      effect:
        "That unit can use a CHARGE ability as if it were your charge phase.",
    },
    {
      id: "forward-to-victory",
      name: "Forward to Victory",
      cost: 1,
      timing: "Reaction: You declared a CHARGE ability",
      declare: "Used by the unit using that CHARGE ability.",
      effect: "You can re-roll the charge roll.",
    },
  ],
  combat: [
    {
      id: "all-out-attack",
      name: "All-out Attack",
      cost: 1,
      timing: "Reaction: You declared an ATTACK ability",
      declare: "Used by the unit using that ATTACK ability.",
      effect:
        "Add 1 to hit rolls for attacks made as part of that ATTACK ability. This also affects weapons that have the Companion weapon ability. For the rest of the turn, subtract 1 from save rolls for the unit using this ability.",
    },
    {
      id: "all-out-defence",
      name: "All-out Defence",
      cost: 1,
      timing: "Reaction: Opponent declared an ATTACK ability",
      declare: "Used by a unit targeted by that ATTACK ability.",
      effect:
        "Add 1 to save rolls for that unit until that ATTACK ability has been resolved.",
    },
  ],
  end: [
    {
      id: "power-through",
      name: "Power Through",
      cost: 1,
      timing: "End of Any Turn",
      declare:
        "Pick a friendly unit that charged this turn to use this ability, then you must pick an enemy unit in combat with it to be the target. The target must have a lower Health characteristic than the unit using this ability.",
      effect:
        "Inflict D3 mortal damage on the target. Then, the unit using this ability can move a distance up to its Move characteristic. It can pass through and end that move within the combat ranges of enemy units that were in combat with it at the start of the move, but not those of other enemy units. It does not have to end the move in combat.",
      keywords: "Move",
    },
  ],
};

export function coreCommandsForPhase(phaseId: PlayPhaseId): CoreCommand[] {
  return CORE_COMMANDS_BY_PHASE[phaseId] ?? [];
}

export function isCommandAbility(kind: string): boolean {
  return kind.trim().toLowerCase() === "command";
}

/** CP cost for a warscroll/trait Command ability (defaults to 1). */
export function commandAbilityCost(ability: {
  kind: string;
  cost?: string;
}): number | null {
  if (!isCommandAbility(ability.kind)) {
    return null;
  }
  const raw = ability.cost?.trim();
  if (!raw) {
    return 1;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Shown behind the Universal commands info control — not inline on mobile. */
export const UNIVERSAL_COMMAND_RULES =
  "You generate 4 CP each battle round (underdog +1). One command per unit per phase; each command once per army per phase. Cost is shown on each command.";

