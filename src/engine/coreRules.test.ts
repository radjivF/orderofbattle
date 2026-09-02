import { describe, expect, it } from "vitest";
import {
  CORE_KEYWORD_RULES,
  CORE_RULE_GROUPS,
  SCOURGE_AQSHY_RULES,
  coreRuleMentionsQuery,
  coreRulesForPhase,
  extraCoreKeywords,
  isUniversalCoreAbility,
  lookupCoreRule,
  warscrollAbilities,
} from "./coreRules";
import { getSpearhead } from "./spearhead";

describe("universal core rules", () => {
  it("keeps Run, Retreat, and Ward off the warscroll", () => {
    expect(isUniversalCoreAbility("WARD SAVE")).toBe(true);
    expect(isUniversalCoreAbility("Run")).toBe(true);
    expect(isUniversalCoreAbility("SKEWERED")).toBe(false);
  });

  it("filters leaked core rules from Beast-skewer Killbow", () => {
    const box = getSpearhead("kruleboyz-swampskulka-gang");
    const unit = box?.units.find((item) => item.name === "Beast-skewer Killbow");
    expect(unit).toBeTruthy();
    if (!unit) return;

    const names = warscrollAbilities(unit).map((item) => item.name);
    expect(names).toEqual(["SKEWERED"]);
    expect(names).not.toContain("RUN");
    expect(names).not.toContain("RETREAT");
    expect(names).not.toContain("WARD SAVE");
    expect(names).not.toContain("SNEAKY SNEAKIN’");
    expect(names).not.toContain("NOTORIOUS BOSSES");
    expect(names).not.toContain("SACRED RITES");
    expect(names).not.toContain("RESURRECTION");

    const effect = warscrollAbilities(unit)[0]?.effect ?? "";
    expect(effect).toMatch(/Beast-skewer Bolts/i);
    expect(effect).not.toMatch(/NORMAL MOVE/i);
    expect(effect).not.toMatch(/Kragnos/i);
    expect(effect).not.toMatch(/Universal Core Abilities/i);
  });

  it("places Run and Retreat on Movement, Ward on Shooting and Combat", () => {
    expect(coreRulesForPhase("movement").map((rule) => rule.name)).toEqual([
      "Normal Move",
      "Run",
      "Retreat",
    ]);
    expect(coreRulesForPhase("shooting").map((rule) => rule.name)).toContain(
      "Ward Save",
    );
    expect(coreRulesForPhase("combat").map((rule) => rule.name)).toEqual([
      "Fight",
      "Ward Save",
    ]);
    expect(coreRulesForPhase("passive")).toEqual([]);
  });
});

describe("core rule lookup", () => {
  it("explains Guarded Hero and Eruption of Fury, not Ward Save", () => {
    expect(lookupCoreRule("Guarded Hero")?.effect).toMatch(/12"/);
    expect(lookupCoreRule("GUARDED HERO")?.name).toBe("Guarded Hero");
    expect(lookupCoreRule("Eruption of Fury")?.effect).toMatch(/rage dice/i);
    expect(lookupCoreRule("Fight Through the Pain")?.effect).toMatch(/damage pool/i);
    expect(lookupCoreRule("Fight Through the Pain")?.effect).not.toMatch(/strike-last/i);
    expect(lookupCoreRule("STRIKE-LAST")?.name).toBe("Strike-last");
    expect(lookupCoreRule("Strike-first")?.effect).toMatch(/Fight/i);
    expect(lookupCoreRule("STRIKE-LAST")?.effect).toMatch(/cannot be picked/i);
    expect(lookupCoreRule("STRIKE-FIRST")?.effect).toMatch(/neither/i);
    expect(lookupCoreRule("Companion")?.effect).toMatch(/friendly/i);
    expect(lookupCoreRule("Anti-Hero")?.name).toBe("Anti-X (+1 Rend)");
    expect(lookupCoreRule("Anti-charge (+1 Rend)")?.effect).toMatch(/Rend/i);
    expect(lookupCoreRule("Charge (+1 Damage)")?.effect).toMatch(/charged/i);
    expect(lookupCoreRule("Crit (2 Hits)")?.effect).toMatch(/2 hits/i);
    expect(lookupCoreRule("Crit (Auto-wound)")?.effect).toMatch(/automatically/i);
    expect(lookupCoreRule("Crit (Mortal)")?.effect).toMatch(/mortal/i);
    expect(lookupCoreRule("Shoot in Combat")?.effect).toMatch(/combat/i);
    expect(lookupCoreRule("Fly")?.effect).toMatch(/combat ranges/i);
    expect(lookupCoreRule("Guarded Hero")?.effect).toMatch(/not a Hero/i);
    expect(lookupCoreRule("Raising the Heat")?.effect).toMatch(/attacker/i);
    expect(lookupCoreRule("Raising the Heat")?.effect).toMatch(/defender/i);
    expect(lookupCoreRule("Simmering Rage")?.effect).toMatch(/lost/i);
    expect(lookupCoreRule("Eruption of Fury")?.effect).toMatch(/up to 3/i);
    expect(lookupCoreRule("Eruption of Fury")?.effect).toMatch(/combat attacks/i);
    expect(lookupCoreRule("Activate Place of Power")?.effect).toMatch(/Ignite Fury/i);
    expect(CORE_KEYWORD_RULES.map((rule) => rule.name)).toEqual(
      expect.arrayContaining([
        "Strike-first",
        "Strike-last",
        "Companion",
        "Anti-X (+1 Rend)",
        "Charge (+1 Damage)",
        "Crit (2 Hits)",
        "Crit (Auto-wound)",
        "Crit (Mortal)",
        "Shoot in Combat",
      ]),
    );
    expect(lookupCoreRule("HERO")?.effect).toMatch(/Hero/i);
    expect(lookupCoreRule("WIZARD (1)")?.name).toBe("Wizard");
    expect(lookupCoreRule("Ward Save")).toBeUndefined();
    expect(lookupCoreRule("WARD (6+)")).toBeUndefined();
    expect(lookupCoreRule("CASTELITE")).toBeUndefined();
    expect(CORE_KEYWORD_RULES.map((rule) => rule.name)).toContain("Guarded Hero");
    expect(CORE_KEYWORD_RULES.map((rule) => rule.name)).not.toContain("Ward Save");
    expect(SCOURGE_AQSHY_RULES.map((rule) => rule.name)).toEqual([
      "Raising the Heat",
      "Simmering Rage",
      "Eruption of Fury",
      "Fight Through the Pain",
      "Activate Place of Power",
    ]);
  });

  it("adds Guarded Hero to non-monster heroes and Champion to multi-model units", () => {
    expect(
      extraCoreKeywords({
        hero: true,
        models: 1,
        categories: ["HERO", "INFANTRY"],
      }),
    ).toEqual(["Guarded Hero"]);
    expect(
      extraCoreKeywords({
        hero: true,
        models: 1,
        categories: ["HERO", "MONSTER"],
      }),
    ).toEqual([]);
    expect(
      extraCoreKeywords({
        hero: true,
        models: 1,
        categories: ["HERO", "WAR MACHINE"],
      }),
    ).toEqual([]);
    expect(
      extraCoreKeywords({
        hero: false,
        models: 10,
        categories: ["INFANTRY"],
      }),
    ).toEqual(["Champion"]);
  });
});

describe("core rule groups", () => {
  it("sorts the keyword rules into four reading groups", () => {
    expect(CORE_RULE_GROUPS.map((group) => group.name)).toEqual([
      "Abilities",
      "Unit types",
      "Weapon abilities",
      "Terrain",
    ]);

    const byName = new Map(
      CORE_RULE_GROUPS.map((group) => [
        group.name,
        group.rules.map((rule) => rule.name),
      ]),
    );
    expect(byName.get("Abilities")).toEqual([
      "Guarded Hero",
      "Champion",
      "Strike-first",
      "Strike-last",
      "Fly",
    ]);
    expect(byName.get("Unit types")).toEqual([
      "Hero",
      "Infantry",
      "Cavalry",
      "Beast",
      "Monster",
      "War Machine",
      "Wizard",
      "Priest",
    ]);
    expect(byName.get("Weapon abilities")).toEqual([
      "Anti-X (+1 Rend)",
      "Charge (+1 Damage)",
      "Companion",
      "Crit (2 Hits)",
      "Crit (Auto-wound)",
      "Crit (Mortal)",
      "Shoot in Combat",
    ]);
    expect(byName.get("Terrain")).toEqual([
      "Cover",
      "Impassable",
      "Obscuring",
      "Place of Power",
      "Unstable",
    ]);
  });

  it("covers every keyword rule exactly once", () => {
    const grouped = CORE_RULE_GROUPS.flatMap((group) => group.rules);
    const ids = grouped.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice().sort()).toEqual(
      CORE_KEYWORD_RULES.map((rule) => rule.id).slice().sort(),
    );
  });

  it("reuses the catalogue entries so pill lookups stay in sync", () => {
    const guarded = CORE_RULE_GROUPS[0]?.rules[0];
    expect(guarded).toBe(lookupCoreRule("Guarded Hero"));
  });
});

describe("core rule search", () => {
  it("matches a phrase in the effect, ignoring case", () => {
    const heat = SCOURGE_AQSHY_RULES.find((rule) => rule.name === "Raising the Heat");
    expect(heat).toBeTruthy();
    expect(coreRuleMentionsQuery(heat!, "Deployment Phase")).toBe(true);
    expect(coreRuleMentionsQuery(heat!, "deployment phase")).toBe(true);
    expect(coreRuleMentionsQuery(heat!, "")).toBe(false);
    expect(coreRuleMentionsQuery(heat!, "   ")).toBe(false);
    expect(coreRuleMentionsQuery(heat!, "xyzzy")).toBe(false);
  });

  it("matches the rule name as well as the effect", () => {
    const guarded = CORE_KEYWORD_RULES.find((rule) => rule.name === "Guarded Hero");
    expect(coreRuleMentionsQuery(guarded!, "Guarded Hero")).toBe(true);
    expect(coreRuleMentionsQuery(guarded!, "Fly")).toBe(false);
  });
});
