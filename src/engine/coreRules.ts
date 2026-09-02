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

export type CoreRuleEntry = {
  id: string;
  name: string;
  effect: string;
};

export type CoreKeywordUnit = {
  hero?: boolean;
  models?: number;
  categories?: string[];
};

/** Keyword pills and the Core Rules library — not Spearhead phase reminders. */
export const CORE_KEYWORD_RULES: readonly CoreRuleEntry[] = [
  {
    id: "guarded-hero",
    name: "Guarded Hero",
    effect:
      "Every Hero that is not a Monster or a War Machine has this passive ability. If this Hero is within the combat range of a friendly unit that is not a Hero, subtract 1 from hit rolls for shooting attacks that target this Hero, and if this Hero is Infantry, it cannot be picked as the target of shooting attacks made by units more than 12\" from it.",
  },
  {
    id: "champion",
    name: "Champion",
    effect:
      "Add 1 to the Attacks characteristic of weapons used by champions in this unit.",
  },
  {
    id: "strike-first",
    name: "Strike-first",
    effect:
      "If there are any Strike-first units in combat once any non-Fight combat phase abilities have been used, no other unit can be picked to use a Fight ability until those units have fought. After that, the active player picks the next unit to fight. If a unit has both Strike-first and Strike-last, treat it as if it had neither.",
  },
  {
    id: "strike-last",
    name: "Strike-last",
    effect:
      "A Strike-last unit in combat cannot be picked to use a Fight ability while there is any unit in combat that does not have Strike-last and has not yet used a Fight ability. If a unit has both Strike-first and Strike-last, treat it as if it had neither.",
  },
  {
    id: "fly",
    name: "Fly",
    effect:
      "As this unit moves, it ignores other models, terrain features and the combat ranges of enemy units. It cannot end that move in combat unless the ability that allowed it to move says otherwise. Ignore any vertical distance this unit moves.",
  },
  {
    id: "hero",
    name: "Hero",
    effect:
      "This unit is a Hero. Heroes can take artefacts and heroic traits, and they use Hero-phase abilities.",
  },
  {
    id: "infantry",
    name: "Infantry",
    effect: "This unit is Infantry — foot troops that hold ground and fight in formation.",
  },
  {
    id: "cavalry",
    name: "Cavalry",
    effect: "This unit is Cavalry — mounted troops that move quickly across the battlefield.",
  },
  {
    id: "monster",
    name: "Monster",
    effect:
      "This unit is a Monster. Monsters are not guarded Heroes, and they use Monster abilities such as Battle Damaged.",
  },
  {
    id: "beast",
    name: "Beast",
    effect: "This unit is a Beast — a living creature rather than a ranked formation.",
  },
  {
    id: "war-machine",
    name: "War Machine",
    effect: "This unit is a War Machine — a crew-served engine of war.",
  },
  {
    id: "wizard",
    name: "Wizard",
    effect:
      "This unit is a Wizard. The number in brackets is its power level for casting and unbinding spells.",
  },
  {
    id: "priest",
    name: "Priest",
    effect:
      "This unit is a Priest. The number in brackets is its power level for chanting prayers.",
  },
  {
    id: "anti-x",
    name: "Anti-X (+1 Rend)",
    effect:
      "Add 1 to this weapon’s Rend characteristic if the target has the keyword after ‘Anti-’ or fulfils the condition after ‘Anti-’. Multiples are cumulative: a weapon with Anti-charge (+1 Rend) and Anti-Hero (+1 Rend) adds 2 to Rend against a Hero that charged this turn.",
  },
  {
    id: "charge-damage",
    name: "Charge (+1 Damage)",
    effect:
      "Add 1 to this weapon’s Damage characteristic if the attacking unit charged this turn.",
  },
  {
    id: "companion",
    name: "Companion",
    effect:
      "This weapon is not affected by abilities used by a friendly unit that affect the Attacks characteristic or the attack sequence.",
  },
  {
    id: "crit-2-hits",
    name: "Crit (2 Hits)",
    effect:
      "If an attack made with this weapon scores a critical hit, that attack scores 2 hits on the target unit instead of 1. Make a wound roll for each hit.",
  },
  {
    id: "crit-auto-wound",
    name: "Crit (Auto-wound)",
    effect:
      "If an attack made with this weapon scores a critical hit, that attack automatically wounds the target. Make a save roll as normal.",
  },
  {
    id: "crit-mortal",
    name: "Crit (Mortal)",
    effect:
      "If an attack made with this weapon scores a critical hit, that attack inflicts mortal damage on the target unit equal to the Damage characteristic of that weapon and the attack sequence ends.",
  },
  {
    id: "shoot-in-combat",
    name: "Shoot in Combat",
    effect:
      "This weapon can be used to make shooting attacks even if the attacking unit is in combat.",
  },
  {
    id: "terrain-cover",
    name: "Cover",
    effect:
      "Subtract 1 from hit rolls for attacks that target a unit that is behind or wholly on this terrain feature, unless that unit charged this turn or has the Fly keyword.",
  },
  {
    id: "terrain-impassable",
    name: "Impassable",
    effect:
      "Models cannot move across, be set up on or end moves on any part of this terrain feature.",
  },
  {
    id: "terrain-obscuring",
    name: "Obscuring",
    effect:
      "While every model in a unit that is not a Monster or War Machine and does not have Fly is within 1\" of this terrain feature, that unit is only visible to enemy units within its combat range, and the Range characteristic of its ranged weapons is halved (rounding down).",
  },
  {
    id: "terrain-place-of-power",
    name: "Place of Power",
    effect:
      "Heroes within 3\" of this terrain feature can use the ‘Activate Place of Power’ ability.",
  },
  {
    id: "terrain-unstable",
    name: "Unstable",
    effect:
      "Models can move across this terrain feature but cannot be set up on or end any type of move on any part of it that is more than 1\" tall.",
  },
];

export type CoreRuleGroup = {
  id: string;
  name: string;
  rules: readonly CoreRuleEntry[];
};

const CORE_RULE_GROUP_IDS: readonly { id: string; name: string; ids: readonly string[] }[] = [
  {
    id: "abilities",
    name: "Abilities",
    ids: ["guarded-hero", "champion", "strike-first", "strike-last", "fly"],
  },
  {
    id: "unit-types",
    name: "Unit types",
    ids: [
      "hero",
      "infantry",
      "cavalry",
      "beast",
      "monster",
      "war-machine",
      "wizard",
      "priest",
    ],
  },
  {
    id: "weapon-abilities",
    name: "Weapon abilities",
    ids: [
      "anti-x",
      "charge-damage",
      "companion",
      "crit-2-hits",
      "crit-auto-wound",
      "crit-mortal",
      "shoot-in-combat",
    ],
  },
  {
    id: "terrain",
    name: "Terrain",
    ids: [
      "terrain-cover",
      "terrain-impassable",
      "terrain-obscuring",
      "terrain-place-of-power",
      "terrain-unstable",
    ],
  },
];

const KEYWORD_RULES_BY_ID = new Map(
  CORE_KEYWORD_RULES.map((rule) => [rule.id, rule]),
);

/**
 * Reading order for the Core Rules library. A flat list of 25 keywords mixes
 * unit types with weapon abilities, so group them for scanning. Entries are the
 * same objects as CORE_KEYWORD_RULES so keyword-pill lookups stay in sync.
 */
export const CORE_RULE_GROUPS: readonly CoreRuleGroup[] =
  CORE_RULE_GROUP_IDS.map((group) => ({
    id: group.id,
    name: group.name,
    rules: group.ids.map((id) => {
      const rule = KEYWORD_RULES_BY_ID.get(id);
      if (!rule) {
        throw new Error(`Unknown core rule id in group ${group.id}: ${id}`);
      }
      return rule;
    }),
  }));

/** Season rules for Scourge of Aqshy (General’s Handbook 2026–27) — fury level and rage dice. */
export const SCOURGE_AQSHY_RULES: readonly CoreRuleEntry[] = [
  {
    id: "raising-the-heat",
    name: "Raising the Heat",
    effect:
      "Once per battle, in the deployment phase: if you are the attacker, set your fury level to 1; if you are the defender, set your fury level to 2.",
  },
  {
    id: "simmering-rage",
    name: "Simmering Rage",
    effect:
      "Once per turn, at the start of the battle round, you must use this ability. Gain a number of rage dice equal to your fury level. At the end of the battle round, any unspent rage dice are lost.",
  },
  {
    id: "eruption-of-fury",
    name: "Eruption of Fury",
    effect:
      "Once per turn, at the end of any turn: pick a friendly unit and an enemy unit in combat with it, then pick 1 melee weapon that friendly unit is armed with and spend up to 3 rage dice. Resolve that many combat attacks with that weapon. Those attacks cannot score critical hits. Instead, for each unmodified hit roll of 6, inflict D3 mortal damage on each enemy unit in combat with the unit using this ability and your opponent increases their fury level by 1, to a maximum of 7. For each unmodified hit roll of 1, allocate D3 mortal damage to the unit using this ability after the damage sequence; ward rolls cannot be made for that damage. Rage dice do not add to the weapon’s Attacks characteristic.",
  },
  {
    id: "fight-through-the-pain",
    name: "Fight Through the Pain",
    effect:
      "Before allocating damage to a friendly unit, spend any number of rage dice. For each die spent, reduce your fury level by 1 (minimum 0), then roll a dice: on a 3+, remove 1 damage from that unit’s damage pool.",
  },
  {
    id: "activate-place-of-power",
    name: "Activate Place of Power",
    effect:
      "Once per turn, at the start of any turn: pick a friendly Hero within 3\" of any Place of Power and roll a dice. On a 1, inflict D3 mortal damage on that Hero. On a 2+, pick 1 — Ignite Fury: gain 2 rage dice, then increase your fury level by 2, to a maximum of 7. Channel Wrath: if that Hero is a Wizard or Priest, add 1 to its casting or chanting rolls for the rest of the turn. Dizzying Rage: for the rest of the turn, if that Hero is not a Wizard or Priest, it can use ‘Unbind’ or ‘Banish Manifestation’ as if it had Wizard (1).",
  },
];

const CORE_RULE_CATALOG: readonly CoreRuleEntry[] = [
  ...CORE_KEYWORD_RULES,
  ...SCOURGE_AQSHY_RULES,
];

function catalogKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Warscrolls write ranks and variants in brackets: "WIZARD (2)", "Crit (Mortal)". */
function bareKey(name: string): string {
  return catalogKey(name).replace(/\s*\([^)]*\)$/, "");
}

const ANTI_X_KEY = "anti-x (+1 rend)";

const CORE_RULES_BY_KEY = new Map(
  CORE_RULE_CATALOG.map((rule) => [catalogKey(rule.name), rule]),
);

for (const rule of CORE_RULE_CATALOG) {
  const key = bareKey(rule.name);
  if (!CORE_RULES_BY_KEY.has(key)) {
    CORE_RULES_BY_KEY.set(key, rule);
  }
}

export function lookupCoreRule(name: string): CoreRuleEntry | undefined {
  const key = catalogKey(name);
  if (!key) {
    return undefined;
  }
  if (key.startsWith("anti-")) {
    return CORE_RULES_BY_KEY.get(ANTI_X_KEY);
  }
  return CORE_RULES_BY_KEY.get(key) ?? CORE_RULES_BY_KEY.get(bareKey(name));
}

function hasCategory(
  categories: string[] | undefined,
  name: string,
): boolean {
  const needle = name.toUpperCase();
  return (categories ?? []).some((item) => {
    const key = item.trim().toUpperCase();
    return (
      key === needle ||
      key.startsWith(`${needle} `) ||
      key.startsWith(`${needle}(`)
    );
  });
}

/** Guarded Hero on Heroes that are not Monsters or War Machines; Champion on multi-model units. */
export function extraCoreKeywords(unit: CoreKeywordUnit): string[] {
  const extra: string[] = [];
  const isHero = Boolean(unit.hero) || hasCategory(unit.categories, "HERO");
  const isMonster =
    hasCategory(unit.categories, "MONSTER") ||
    hasCategory(unit.categories, "WAR MACHINE");
  if (isHero && !isMonster) {
    extra.push("Guarded Hero");
  }
  if ((unit.models ?? 1) > 1) {
    extra.push("Champion");
  }
  return extra;
}

export function coreRuleMentionsQuery(
  rule: { name: string; effect: string },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return false;
  }
  return `${rule.name} ${rule.effect}`.toLowerCase().includes(needle);
}
