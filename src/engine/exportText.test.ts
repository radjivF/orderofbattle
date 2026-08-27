import { describe, expect, it } from "vitest";
import {
  exportArmyListText,
  exportFileName,
} from "@/engine/exportText";
import { getFaction, heroesOf, unitsForRealm } from "@/engine/queries";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";

describe("exportArmyListText", () => {
  it("formats a list with regiment, points, and formation", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = heroesOf(faction)[0];
    const companion = unitsForRealm(faction, null).find(
      (unit) => !unit.hero && unit.points > 0,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id, "Hammerhost", 2000),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: hero.id,
            reinforced: false,
          },
          units: [
            {
              id: createId(),
              unitId: companion.id,
              reinforced: Boolean(companion.reinforce),
            },
          ],
        },
      ],
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Hammerhost");
    expect(text).toContain(faction.name);
    expect(text).toContain("Regiment 1 — General");
    expect(text).toContain(hero.name);
    expect(text).toContain(companion.name);
    expect(text).toMatch(/\d+ \/ 2[,.]?000 pts/);
    expect(text).toContain("— Order of Battle");
  });

  it("sanitizes download filenames", () => {
    expect(exportFileName("My Cool List!")).toBe("My-Cool-List.txt");
    expect(exportFileName("   ")).toBe("army-list.txt");
  });
});
