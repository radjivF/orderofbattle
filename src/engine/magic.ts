import { parsePickOneChoices } from "@/lib/ruleText";
import { armyRoster } from "./phases";
import { findLearnedSpell, isPathToGloryList } from "./pathToGlory";
import { getListUnit, unitHasKeyword } from "./queries";
import type {
  ArmyList,
  CatalogueUnit,
  FactionCatalogue,
  UnitAbility,
} from "./types";

/** Friendly roster bind, free-text enemy note, or nothing to track. */
export type PowerBindRole = "target" | "enemy" | "none";

export type PowerBindRule = {
  role: PowerBindRole;
  /** True when the text asks for a Hero (not a generic unit). */
  heroesOnly: boolean;
  /** Max friendly units that can be bound (from "pick up to N" / 10+ clauses). */
  maxTargets: number;
};

export function powerBindKey(kind: "spell" | "prayer", name: string): string {
  return `${kind}:${name}`;
}

/** Persisted pick among "choose 1 of the following" effect options. */
export function powerChoiceKey(bindKey: string): string {
  return `choice:${bindKey}`;
}

const POWER_BIND_TARGET_SEP = ",";

/** True when the ability has the Unlimited keyword (spells/prayers castable more than once). */
export function powerIsUnlimited(power: UnitAbility): boolean {
  return /\bunlimited\b/i.test(power.keywords);
}

/** Parse stored bind value into one or more roster selection ids. */
export function parsePowerBindTargets(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(POWER_BIND_TARGET_SEP)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function serializePowerBindTargets(ids: string[]): string | null {
  const unique = [...new Set(ids.filter(Boolean))];
  return unique.length > 0 ? unique.join(POWER_BIND_TARGET_SEP) : null;
}

/** Highest number of targets the spell/prayer text allows (default 1). */
export function powerBindMaxTargets(power: UnitAbility): number {
  const text = `${power.declare} ${power.effect}`.replace(/\s+/g, " ");
  const counts = [1];
  for (const match of text.matchAll(/pick up to (\d+)/gi)) {
    const count = Number(match[1]);
    if (Number.isFinite(count) && count > 0) {
      counts.push(count);
    }
  }
  return Math.max(...counts);
}

export type EffectChoiceOption = {
  id: string;
  label: string;
};

export type EffectChoiceBlock = {
  preface: string;
  options: EffectChoiceOption[];
};

/**
 * Split "Pick 1 of the following…" effect text into selectable options.
 * Returns null when the effect is a plain (non-choice) paragraph.
 */
export function parseEffectChoices(effect: string): EffectChoiceBlock | null {
  const parsed = parsePickOneChoices(effect.replace(/\s+/g, " ").trim());
  if (!parsed) {
    return null;
  }
  return {
    preface: parsed.preface,
    options: parsed.items.map((label, index) => ({
      id: String(index),
      label,
    })),
  };
}

export function powerBindRule(power: UnitAbility): PowerBindRule {
  const text = `${power.declare} ${power.effect}`.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();

  // Only lasting buffs/debuffs need attribution, not one-shot damage/heals.
  if (!isLastingEffect(lower)) {
    return { role: "none", heroesOnly: false, maxTargets: 1 };
  }

  const castSplit = lower.split(
    /to (?:cast this spell|chant this prayer)/i,
  );
  const afterCast = castSplit[1] ?? lower;

  // First friendly/enemy pick after cast. Ignore the caster clause.
  const firstPick = afterCast.match(
    /pick (?:up to \d+ )?(?:a |an )?(?:visible )?(friendly|enemy)\s+([^.]+?)(?: to be the targets?|,| then |$)/i,
  );

  if (!firstPick) {
    return { role: "none", heroesOnly: false, maxTargets: 1 };
  }

  const side = (firstPick[1] ?? "").toLowerCase();
  const clause = firstPick[2] ?? "";

  if (side === "friendly") {
    return {
      role: "target",
      heroesOnly: clauseHeroesOnly(clause),
      maxTargets: powerBindMaxTargets(power),
    };
  }

  if (side === "enemy") {
    return { role: "enemy", heroesOnly: false, maxTargets: 1 };
  }

  return { role: "none", heroesOnly: false, maxTargets: 1 };
}

/** True for persistent modifiers (−1 hit/wound, +attacks, Strike-last, etc.). */
function isLastingEffect(lower: string): boolean {
  if (/until the (start|end) of/.test(lower)) {
    return true;
  }
  // Catalogue typos like "Unit the start of your next turn"
  if (/\bunite? the (start|end) of/.test(lower)) {
    return true;
  }
  if (/for the rest of (the|this|your) turn/.test(lower)) {
    return true;
  }
  if (/strike-(first|last)/.test(lower)) {
    return true;
  }
  if (
    /(subtract|add) \d+[\s\S]{0,80}(hit|wound|save|charge|run|control|attacks|damage|rend|move)/.test(
      lower,
    )
  ) {
    return true;
  }
  if (/halve[\s\S]{0,40}(move|charge|run)/.test(lower)) {
    return true;
  }
  if (/ward\s*\(/.test(lower)) {
    return true;
  }
  if (/crit\s*\(/.test(lower)) {
    return true;
  }
  if (/cannot use (run|charge|commands|shoot)/.test(lower)) {
    return true;
  }
  if (/ignore (positive )?modifiers/.test(lower)) {
    return true;
  }
  if (/not visible to enemy/.test(lower)) {
    return true;
  }
  return false;
}

function clauseHeroesOnly(clause: string): boolean {
  const lower = clause.toLowerCase();
  if (/\bunits?\b/.test(lower)) {
    return false;
  }
  return /\bheroes?\b/.test(lower);
}

export function unitMatchesBindRule(
  unit: CatalogueUnit,
  rule: PowerBindRule,
): boolean {
  if (rule.role !== "target") {
    return false;
  }
  if (rule.heroesOnly && !unit.hero && !unitHasKeyword(unit, "HERO")) {
    return false;
  }
  return true;
}

export type BindCandidate = {
  selectionId: string;
  unit: CatalogueUnit;
};

export function powerBindCandidates(
  list: ArmyList,
  faction: FactionCatalogue,
  power: UnitAbility,
): BindCandidate[] {
  const rule = powerBindRule(power);
  if (rule.role !== "target") {
    return [];
  }
  const rows: BindCandidate[] = [];
  for (const entry of armyRoster(list, faction)) {
    if (!unitMatchesBindRule(entry.unit, rule)) {
      continue;
    }
    rows.push({ selectionId: entry.selectionId, unit: entry.unit });
  }
  return rows;
}

export function boundUnitName(
  list: ArmyList,
  faction: FactionCatalogue,
  selectionId: string | null | undefined,
): string | null {
  if (!selectionId) {
    return null;
  }
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

export type CombatModifierNote = {
  /** Friendly selection the lasting effect is on; null for enemy notes. */
  selectionId: string | null;
  enemyLabel?: string;
  powerName: string;
  kind: "spell" | "prayer";
  /** Short combat reminder, e.g. "−1 wound". */
  summary: string;
};

/** Lasting spell/prayer binds to surface on Play combat / shooting boards. */
export function combatModifierNotes(
  list: ArmyList,
  faction: FactionCatalogue,
): CombatModifierNote[] {
  const binds = list.powerBinds ?? {};
  const notes: CombatModifierNote[] = [];

  for (const [key, value] of Object.entries(binds)) {
    if (!value || key.startsWith("choice:")) {
      continue;
    }
    const parsedKey = /^(spell|prayer):(.+)$/.exec(key);
    if (!parsedKey) {
      continue;
    }
    const kind = parsedKey[1] as "spell" | "prayer";
    const powerName = parsedKey[2] ?? "";
    const power = findBoundPower(list, faction, kind, powerName);
    if (!power) {
      continue;
    }
    const rule = powerBindRule(power);
    if (rule.role === "none") {
      continue;
    }

    let effectText = power.effect;
    const choiceId = binds[powerChoiceKey(key)];
    if (choiceId != null) {
      const choices = parseEffectChoices(power.effect);
      const option = choices?.options.find((item) => item.id === choiceId);
      if (option) {
        effectText = option.label;
      }
    }

    const summary =
      combatModifierSummary(effectText) ||
      effectText.replace(/\s+/g, " ").trim().slice(0, 72);

    if (rule.role === "target") {
      for (const selectionId of parsePowerBindTargets(value)) {
        notes.push({
          selectionId,
          powerName,
          kind,
          summary,
        });
      }
    } else {
      notes.push({
        selectionId: null,
        enemyLabel: value,
        powerName,
        kind,
        summary,
      });
    }
  }

  return notes;
}

function findBoundPower(
  list: ArmyList,
  faction: FactionCatalogue,
  kind: "spell" | "prayer",
  name: string,
): UnitAbility | undefined {
  const lores =
    kind === "spell" ? faction.spellLores : faction.prayerLores;
  const loreId = kind === "spell" ? list.spellLoreId : list.prayerLoreId;
  const lore = lores.find((item) => item.id === loreId);
  const fromLore = lore?.powers.find((power) => power.name === name);
  if (fromLore) {
    return fromLore;
  }
  if (kind === "spell" && isPathToGloryList(list)) {
    const learned = findLearnedSpell(list, faction, name);
    if (learned) {
      return learned;
    }
  }
  for (const entry of armyRoster(list, faction)) {
    const match = entry.unit.abilities.find(
      (ability) =>
        ability.name === name &&
        ability.kind.toLowerCase() === kind,
    );
    if (match) {
      return match;
    }
  }
  return undefined;
}

/** Pull short combat-relevant chips from lasting effect text. */
export function combatModifierSummary(effect: string): string | null {
  const bits: string[] = [];
  const text = effect.replace(/\s+/g, " ").trim();

  for (const match of text.matchAll(
    /(subtract|add) (\d+) from (hit|wound) rolls[^.]*/gi,
  )) {
    const sign = match[1]?.toLowerCase() === "add" ? "+" : "−";
    const stat = match[3]?.toLowerCase() === "hit" ? "hit" : "wound";
    bits.push(`${sign}${match[2]} ${stat}`);
  }
  for (const match of text.matchAll(
    /(subtract|add) (\d+) to the Attacks characteristic[^.]*/gi,
  )) {
    const sign = match[1]?.toLowerCase() === "add" ? "+" : "−";
    bits.push(`${sign}${match[2]} Atk`);
  }
  if (/strike-last/i.test(text)) {
    bits.push("Strike-last");
  }
  if (/strike-first/i.test(text)) {
    bits.push("Strike-first");
  }
  if (/ward\s*\((\d+\+)\)/i.test(text)) {
    const ward = /ward\s*\((\d+\+)\)/i.exec(text);
    if (ward?.[1]) {
      bits.push(`Ward (${ward[1]})`);
    }
  }

  if (bits.length === 0) {
    return null;
  }
  return [...new Set(bits)].join(" · ");
}
