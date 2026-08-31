import type { PlayPhaseId } from "./phases";
import type { UnitAbility } from "./types";

export type CorePhaseRule = {
  id: string;
  name: string;
  timing: string;
  declare: string;
  effect: string;
};

/** Monster warscroll reminder — skip without treating it as the core-rules trailer. */
const BATTLE_DAMAGED = "battle damaged";

/** Names leaked onto Spearhead warscrolls from Wahapedia core-rules / command blocks. */
const LEAKED_WARSCROLL_ABILITY_NAMES = new Set([
  "ward save",
  "normal move",
  "run",
  "retreat",
  "charge",
  "shoot",
  "fight",
  "unbind",
  "banish manifestation",
  "fly",
  "mystic shield",
  "sacred rites",
  "resurrection",
  "deploy faction terrain",
  "champion",
  "rally",
  "redeploy",
  "at the double",
  "covering fire",
  "all-out attack",
  "all-out defence",
  "counter-charge",
  "forward to victory",
  "power through",
  "magical intervention",
]);

export function isUniversalCoreAbility(name: string): boolean {
  const key = name.trim().toLowerCase();
  return key === BATTLE_DAMAGED || LEAKED_WARSCROLL_ABILITY_NAMES.has(key);
}

const WARSCROLL_TEXT_CUT =
  /KEYWORDS|Universal Core Abilities|\b\d+\.\d+\s+[A-Z]|keyword is used in the following|ezstandalone\./i;

const WARSCROLL_DUMP_MARK =
  /Universal Core Abilities|keyword is used in the following/i;

/** Drop Wahapedia core-rules and keyword-index dumps that trail real ability text. */
export function sanitizeWarscrollText(text: string): string {
  if (!text) {
    return "";
  }
  return text.split(WARSCROLL_TEXT_CUT)[0].replace(/\s+/g, " ").trim();
}

function isLeakedExtractedAbility(
  ability: UnitAbility,
  alreadyKept: boolean,
): boolean {
  const blob = `${ability.declare} ${ability.effect}`;
  if (/heroic trait/i.test(blob)) {
    return true;
  }
  return alreadyKept && WARSCROLL_DUMP_MARK.test(blob);
}

/**
 * Keep this warscroll’s own abilities. Stop at leaked CORE abilities
 * (Run, Ward Save, Sacred Rites, …) that Wahapedia appends after the sheet.
 */
export function warscrollAbilities(unit: {
  hero?: boolean;
  points?: number;
  abilities: UnitAbility[];
}): UnitAbility[] {
  if (unit.points !== 0) {
    return unit.abilities;
  }
  const out: UnitAbility[] = [];
  for (const ability of unit.abilities) {
    const key = ability.name.trim().toLowerCase();
    if (key === BATTLE_DAMAGED) {
      continue;
    }
    if (LEAKED_WARSCROLL_ABILITY_NAMES.has(key)) {
      break;
    }
    if (isLeakedExtractedAbility(ability, out.length > 0)) {
      continue;
    }
    const cleaned = {
      ...ability,
      declare: sanitizeWarscrollText(ability.declare),
      effect: sanitizeWarscrollText(ability.effect),
    };
    if (cleaned.declare || cleaned.effect || cleaned.timing) {
      out.push(cleaned);
    }
  }
  return out;
}

const WARD_SAVE: CorePhaseRule = {
  id: "ward-save",
  name: "Ward Save",
  timing: "Passive",
  declare: "",
  effect:
    "In step 1 of the damage sequence, make a ward roll of D6 for each damage point in this unit’s damage pool. If the roll equals or exceeds this unit’s ward value, remove that damage point. If a unit has more than one ward, only the lowest value applies.",
};

/** Universal core abilities shown once per phase — not on each warscroll. */
export const CORE_RULES_BY_PHASE: Record<PlayPhaseId, CorePhaseRule[]> = {
  passive: [],
  start: [],
  hero: [],
  movement: [
    {
      id: "normal-move",
      name: "Normal Move",
      timing: "Your Movement Phase",
      declare: "Pick a friendly unit that is not in combat to use this ability.",
      effect:
        "That unit can move a distance up to its Move characteristic. It cannot move into combat during that move.",
    },
    {
      id: "run",
      name: "Run",
      timing: "Your Movement Phase",
      declare: "Pick a friendly unit that is not in combat to use this ability.",
      effect:
        "Make a run roll of D6. That unit can move a distance up to its Move characteristic plus the run roll. It cannot move into combat, and cannot use a Shoot or Charge ability later this turn.",
    },
    {
      id: "retreat",
      name: "Retreat",
      timing: "Your Movement Phase",
      declare: "Pick a friendly unit that is in combat to use this ability.",
      effect:
        "Inflict D3 mortal damage on that unit. It can move a distance up to its Move characteristic. It can move through enemy combat ranges but cannot end that move in combat.",
    },
  ],
  shooting: [
    {
      id: "shoot",
      name: "Shoot",
      timing: "Your Shooting Phase",
      declare:
        "Pick a friendly unit that has not used a Run or Retreat ability this turn. Then pick one or more enemy units as the targets of its shooting attacks.",
      effect:
        "Resolve shooting attacks against the target unit(s). Models cannot shoot while their unit is in combat unless a weapon or ability says otherwise.",
    },
    WARD_SAVE,
  ],
  charge: [
    {
      id: "charge",
      name: "Charge",
      timing: "Your Charge Phase",
      declare:
        "Pick a friendly unit that is not in combat and has not used a Run or Retreat ability this turn. Then make a charge roll of 2D6.",
      effect:
        "That unit can move a distance up to the charge roll. It can move through enemy combat ranges and must end within ½\" of a visible enemy unit. If it does, it has charged.",
    },
  ],
  combat: [
    {
      id: "fight",
      name: "Fight",
      timing: "Any Combat Phase",
      declare:
        "Pick a friendly unit that is in combat or that charged this turn. That unit can pile in. Then, if it is in combat, pick one or more enemy units as the targets of its combat attacks.",
      effect: "Resolve combat attacks against the target unit(s).",
    },
    WARD_SAVE,
  ],
  end: [],
};

export function coreRulesForPhase(phaseId: PlayPhaseId): CorePhaseRule[] {
  return CORE_RULES_BY_PHASE[phaseId] ?? [];
}
