import { describe, expect, it } from "vitest";
import {
  coreRulesForPhase,
  isUniversalCoreAbility,
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
