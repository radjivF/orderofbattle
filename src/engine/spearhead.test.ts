import { describe, expect, it } from "vitest";
import { isUniversalCoreAbility, warscrollAbilities } from "./coreRules";
import {
  catalogueForList,
  getSpearhead,
  isSpearheadList,
  listSpearheads,
} from "./spearhead";
import { blankArmy, blankSpearhead } from "@/lib/storage";
import { builderPlayTabs, playPhaseShowsCommandTab } from "@/lib/builderUi";

describe("spearhead warscrolls", () => {
  it("does not turn a matched list into Spearhead", () => {
    expect(isSpearheadList(blankArmy("cities-of-sigmar"))).toBe(false);
  });

  it("builds a Spearhead roster from the box, not matched-play units", () => {
    const list = blankSpearhead("cities-of-sigmar-fusil-platoon");
    expect(list.kind).toBe("spearhead");
    expect(isSpearheadList(list)).toBe(true);
    expect(list.spearheadId).toBe("cities-of-sigmar-fusil-platoon");
    expect(catalogueForList(list)?.id).toBe("cities-of-sigmar-fusil-platoon");
    expect(catalogueForList(list)?.game).toMatch(/Spearhead/i);
    expect(list.regiments[0]?.hero).toBeTruthy();
    expect(builderPlayTabs(true, false).map((item) => item.value)).not.toContain(
      "magic",
    );
    expect(playPhaseShowsCommandTab(true)).toBe(false);
  });

  it("includes ranged and melee weapons on Fusil-Major on Ogor Warhulk", () => {
    const box = getSpearhead("cities-of-sigmar-fusil-platoon");
    expect(box).toBeTruthy();
    if (!box) return;

    const unit = box.units.find((item) => item.name === "Fusil-Major on Ogor Warhulk");
    expect(unit).toBeTruthy();
    if (!unit) return;

    const ranged = unit.weapons.find((weapon) => weapon.kind === "ranged");
    const melee = unit.weapons.find((weapon) => weapon.kind === "melee");
    expect(ranged?.name).toBe("Long Fusil");
    expect(ranged?.range).toBe("24\"");
    expect(melee?.name).toBe("Warhulk's Mace");

    const mark = unit.abilities.find((ability) => ability.name === "MARK TARGETS");
    expect(mark?.effect).toMatch(/Add 1 to hit rolls/i);
    expect(mark?.effect).not.toMatch(/KEYWORDS/i);
  });

  it("keeps core rules, army traits, and keyword dumps off every Spearhead warscroll", () => {
    const leaked = [
      "NOTORIOUS BOSSES",
      "SNEAKY SNEAKIN’",
      "SACRED RITES",
      "RESURRECTION",
      "NORMAL MOVE",
      "RUN",
      "RETREAT",
      "WARD SAVE",
    ];
    for (const box of listSpearheads()) {
      const rosterIds = new Set(box.roster.map((item) => item.unitId));
      for (const unit of box.units) {
        const abilities = warscrollAbilities(unit);
        const names = abilities.map((item) => item.name);
        if (rosterIds.has(unit.id) && unit.weapons.length > 0) {
          expect(
            abilities.length,
            `${box.id} ${unit.name} has no warscroll ability`,
          ).toBeGreaterThan(0);
        }
        for (const name of leaked) {
          expect(names, `${box.id} ${unit.name}`).not.toContain(name);
        }
        for (const ability of abilities) {
          expect(
            isUniversalCoreAbility(ability.name),
            `${box.id} ${unit.name} ${ability.name}`,
          ).toBe(false);
          expect(ability.effect).not.toMatch(/Universal Core Abilities/i);
          expect(ability.effect).not.toMatch(/keyword is used in the following/i);
          expect(ability.effect).not.toMatch(/EXAMPLE PRAYER/i);
        }
      }
    }
  });
});
