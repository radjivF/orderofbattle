import { describe, expect, it } from "vitest";
import { getFaction, listRegimentsOfRenown } from "./queries";
import { blankArmy } from "@/lib/storage";
import { createId } from "@/lib/id";
import { summarize } from "./validate";

describe("list drops", () => {
  it("counts zero drops on an empty list", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const totals = summarize(blankArmy(faction.id), faction);
    expect(totals.drops).toBe(0);
  });

  it("counts each regiment, auxiliary, and regiment of renown as a drop", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find((unit) => !unit.hero && !unit.unique);
    const rors = listRegimentsOfRenown(faction.id);
    expect(hero && companion && rors[0]).toBeTruthy();
    if (!hero || !companion || !rors[0]) return;

    const regimentId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [],
          },
        ],
        auxiliaries: [
          { id: createId(), unitId: companion.id, reinforced: false },
        ],
        regimentOfRenown: {
          renownId: rors[0].id,
          units: rors[0].units.map((unit) => ({
            id: createId(),
            unitId: unit.id,
            reinforced: false,
          })),
        },
      },
      faction,
    );

    expect(totals.drops).toBe(3);
  });
});
