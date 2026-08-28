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
    expect(text).toMatch(/2[,.]?000 pts · \d+ used/);
    expect(text).toContain("=== Order of Battle ===");
    expect(text).toContain("Built with Order of Battle");
    expect(text).not.toContain("Validation");
  });

  it("sanitizes download filenames", () => {
    expect(exportFileName("My Cool List!")).toBe("My-Cool-List.txt");
    expect(exportFileName("   ")).toBe("army-list.txt");
  });

  it("marks reinforced units and lists auxiliaries", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = heroesOf(faction)[0];
    const companion = unitsForRealm(faction, null).find(
      (unit) => !unit.hero && unit.reinforce && unit.points > 0,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id, "Export Aux", 2000),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
      auxiliaries: [
        {
          id: createId(),
          unitId: companion.id,
          reinforced: true,
        },
      ],
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Auxiliaries");
    expect(text).toContain("reinforced");
    expect(text).toContain(companion.name);
  });
});
