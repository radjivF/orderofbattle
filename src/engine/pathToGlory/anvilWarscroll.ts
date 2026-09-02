import type { UnitWeapon } from "../types";

export function bumpStat(value: string, delta: number): string {
  if (!delta) {
    return value;
  }
  const match = value.match(/^(-?\d+)/);
  if (!match) {
    return value;
  }
  const next = Number(match[1]) + delta;
  return `${next}${value.slice(match[1].length)}`;
}

function normalizeKeyword(value: string): string {
  return value.replace(/[*^=]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function hasCategory(categories: string[], keyword: string): boolean {
  const key = normalizeKeyword(keyword);
  return categories.some(
    (item) =>
      item.toUpperCase() === key ||
      item.toUpperCase().startsWith(`${key} `) ||
      item.toUpperCase().startsWith(`${key} (`),
  );
}

function addCategory(categories: string[], keyword: string): string[] {
  const next = normalizeKeyword(keyword);
  if (!next) {
    return categories;
  }
  const family = next.replace(/\s*\(.+\)$/, "");
  if (family === "WARD" || family === "WIZARD" || family === "PRIEST") {
    return [
      ...categories.filter((item) => !item.toUpperCase().startsWith(family)),
      next,
    ];
  }
  if (categories.some((item) => item.toUpperCase() === next)) {
    return categories;
  }
  return [...categories, next];
}

function replaceCategory(
  categories: string[],
  from: string,
  into: string[],
): string[] {
  const drop = normalizeKeyword(from);
  return into.reduce(
    (next, keyword) => addCategory(next, keyword),
    categories.filter((item) => item.toUpperCase() !== drop),
  );
}

function isCompanionWeapon(weapon: UnitWeapon): boolean {
  return /\bcompanion\b/i.test(weapon.ability);
}

function appendWeaponAbility(weapon: UnitWeapon, extra: string): UnitWeapon {
  const label = extra.replace(/\s+/g, " ").trim();
  if (!label) {
    return weapon;
  }
  const parts = weapon.ability
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "-");
  if (parts.some((part) => part.toLowerCase() === label.toLowerCase())) {
    return weapon;
  }
  return { ...weapon, ability: [...parts, label].join(", ") };
}

function patchMeleeWeapons(
  weapons: UnitWeapon[],
  patch: (weapon: UnitWeapon) => UnitWeapon,
  nonCompanion: boolean,
): UnitWeapon[] {
  return weapons.map((weapon) => {
    if (weapon.kind !== "melee") {
      return weapon;
    }
    if (nonCompanion && isCompanionWeapon(weapon)) {
      return weapon;
    }
    return patch(weapon);
  });
}

function splitKeywordList(blob: string): string[] {
  return blob
    .split(/\s*(?:,|\band\b)\s*/i)
    .map(normalizeKeyword)
    .filter((item) => item && item !== "THE");
}

function remainderIsEmpty(text: string): boolean {
  return text.replace(/[•·.,;:\-–—\s]/g, "").length === 0;
}

function matches(text: string, pattern: RegExp): boolean {
  return new RegExp(pattern.source, pattern.flags.replace("g", "")).test(text);
}

/** Fold warscroll-only forge text into keywords/weapons. Keep true abilities. */
export function applyWarscrollInstruction(
  effect: string,
  categories: string[],
  weapons: UnitWeapon[],
): { keep: boolean; categories: string[]; weapons: UnitWeapon[] } {
  let text = effect.replace(/\s+/g, " ").trim();
  let nextCategories = categories;
  let nextWeapons = weapons;

  const consume = (pattern: RegExp, apply?: () => void) => {
    if (!matches(text, pattern)) {
      return;
    }
    apply?.();
    text = text.replace(pattern, " ").replace(/\s+/g, " ").trim();
  };

  consume(/^(Infantry|Cavalry|Monster|Non-Wizard|Non-Priest) only\.\s*/i);
  consume(/\s*and the following regiment options:[^.]*\.?/i);
  consume(
    /Add the ['‘’"]?.+?['’"]? weapon(?: and the ['‘’"]?.+?['’"]? ability)? to your hero's warscroll\.?/i,
  );
  consume(
    /In addition, make the following changes to your hero's warscroll:?/i,
  );
  consume(/•\s*Change the (Move|Health|Save|Control) characteristic to [^.]+\./gi);
  consume(
    /Replace the (\w+) keyword with the following keywords:\s*([^.]+)\./gi,
    () => {
      for (const match of effect.matchAll(
        /Replace the (\w+) keyword with the following keywords:\s*([^.]+)\./gi,
      )) {
        nextCategories = replaceCategory(
          nextCategories,
          match[1],
          splitKeywordList(match[2]),
        );
      }
    },
  );
  consume(/Replace the (\w+) keyword with the (\w+) keyword\.?/gi, () => {
    for (const match of effect.matchAll(
      /Replace the (\w+) keyword with the (\w+) keyword\.?/gi,
    )) {
      nextCategories = replaceCategory(nextCategories, match[1], [match[2]]);
    }
  });
  consume(/In addition, change your hero's[^.]*\.?/i);
  consume(/change their Save characteristic to [^.,]+\.?/gi);
  consume(/replace (?:their|your hero's) melee weapon with [^.]+/gi);
  consume(/If your hero is a Monster, your hero has Fly\.?/i, () => {
    if (hasCategory(nextCategories, "MONSTER")) {
      nextCategories = addCategory(nextCategories, "FLY");
    }
  });
  consume(
    /If your hero is Cavalry\^*,?\s*add \d+" to your hero's Move characteristic\.?/i,
  );
  consume(/Your hero has Fly\.?/i, () => {
    nextCategories = addCategory(nextCategories, "FLY");
  });
  consume(/Your hero has the Fly keyword\.?/i, () => {
    nextCategories = addCategory(nextCategories, "FLY");
  });
  consume(/Your hero (?:has|gains)(?: the)? (.+?) keywords?/i, () => {
    const match = effect.match(
      /Your hero (?:has|gains)(?: the)? (.+?) keywords?/i,
    );
    if (!match) {
      return;
    }
    const blob = match[1].replace(
      /\s+and the following regiment options:.*$/i,
      "",
    );
    for (const keyword of splitKeywordList(blob)) {
      nextCategories = addCategory(nextCategories, keyword);
    }
  });
  consume(
    /Your hero's non-Companion melee weapons have (Charge \([^)]+\)|Crit \([^)]+\))\.?/i,
    () => {
      const match = effect.match(
        /Your hero's non-Companion melee weapons have (Charge \([^)]+\)|Crit \([^)]+\))\.?/i,
      );
      if (match) {
        nextWeapons = patchMeleeWeapons(
          nextWeapons,
          (weapon) => appendWeaponAbility(weapon, match[1]),
          true,
        );
      }
    },
  );
  consume(
    /Your hero's melee weapons have (Charge \([^)]+\)|Crit \([^)]+\))\.?/i,
    () => {
      const match = effect.match(
        /Your hero's melee weapons have (Charge \([^)]+\)|Crit \([^)]+\))\.?/i,
      );
      if (match) {
        nextWeapons = patchMeleeWeapons(
          nextWeapons,
          (weapon) => appendWeaponAbility(weapon, match[1]),
          false,
        );
      }
    },
  );
  consume(
    /Your hero has (Wizard \(\d+\)|Priest \(\d+\)|Ward \([^)]+\))\.?/i,
    () => {
      const match = effect.match(
        /Your hero has (Wizard \(\d+\)|Priest \(\d+\)|Ward \([^)]+\))\.?/i,
      );
      if (match) {
        nextCategories = addCategory(nextCategories, match[1]);
      }
    },
  );
  consume(
    /Add (\d+) to the Attacks characteristic of your hero's melee weapons\.?/i,
    () => {
      const match = effect.match(
        /Add (\d+) to the Attacks characteristic of your hero's melee weapons\.?/i,
      );
      const delta = Number(match?.[1] ?? 0);
      if (delta) {
        nextWeapons = patchMeleeWeapons(
          nextWeapons,
          (weapon) => ({ ...weapon, attacks: bumpStat(weapon.attacks, delta) }),
          false,
        );
      }
    },
  );
  consume(/Add \d+"? to your hero's Move characteristic\.?/gi);
  consume(/Add \d+ to your hero's (Health|Control) characteristic\.?/gi);
  consume(/Change your hero's Move characteristic to [^.]+\./gi);
  consume(/their Move characteristic is [^.]+\./gi);
  consume(/Your hero's Save characteristic is [^.]+\./gi);
  consume(/If your hero has a .+ War Form, this upgrade costs .+?\./i);
  consume(/The Wound characteristic of your hero's (.+) is (\d+)\./i, () => {
    const match = effect.match(
      /The Wound characteristic of your hero's (.+) is (\d+)\./i,
    );
    if (!match) {
      return;
    }
    const name = match[1].trim();
    const wound = `${match[2]}+`;
    nextWeapons = nextWeapons.map((weapon) =>
      weapon.name.toLowerCase() === name.toLowerCase()
        ? { ...weapon, wound }
        : weapon,
    );
  });

  text = text.replace(/^In addition,?\s*/i, "").trim();
  return {
    keep: !remainderIsEmpty(text),
    categories: nextCategories,
    weapons: nextWeapons,
  };
}
