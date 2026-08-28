import { describe, expect, it } from "vitest";
import { battleTactics } from "./data/load";
import {
  getFaction,
  unitsForPicker,
  unitsForRealm,
} from "./queries";
import { blankArmy } from "@/lib/storage";
import { createId } from "@/lib/id";
import { pruneOrphanEnhancements, summarize } from "./validate";

describe("unitsForPicker", () => {
  it("lists core and SoA sheets separately", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const picker = unitsForPicker(faction);
    const realm = unitsForRealm(faction, null);
    expect(picker.length).toBeGreaterThan(realm.length);
    expect(
      picker.some((unit) => unit.name.includes("Scourge of Aqshy")),
    ).toBe(true);
    expect(
      picker.some(
        (unit) =>
          unit.name === "Stormstrike Palladors (Scourge of Aqshy)",
      ),
    ).toBe(true);
  });
});

describe("battle tactic cards", () => {
  it("warns when none picked and flags more than two", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const empty = summarize(blankArmy(faction.id), faction);
    expect(
      empty.issues.some((issue) =>
        issue.text.includes("battle tactic cards"),
      ),
    ).toBe(true);

    const ids = battleTactics.slice(0, 3).map((card) => card.id);
    const tooMany = summarize(
      { ...blankArmy(faction.id), battleTacticCardIds: ids },
      faction,
    );
    expect(
      tooMany.issues.some((issue) =>
        issue.text.includes("Maximum two battle tactic cards"),
      ),
    ).toBe(true);
  });
});

describe("special enhancements", () => {
  it("prunes picks when bearer is removed", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    expect(table).toBeTruthy();
    if (!table) return;

    const regimentId = createId();
    const heroId = createId();
    const unitId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: heroId, unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: companion.id, reinforced: false }],
        },
      ],
      specialEnhancements: [
        {
          tableId: table.id,
          heroSelectionId: unitId,
          optionId: table.options[0].id,
        },
      ],
    };

    const pruned = pruneOrphanEnhancements({
      ...list,
      regiments: [
        {
          id: regimentId,
          hero: list.regiments[0].hero,
          units: [],
        },
      ],
    });
    expect(pruned.specialEnhancements).toEqual([]);
  });
});

describe("mixed scourge sheets", () => {
  it("flags core and Scourge of Aqshy warscrolls in the same army", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const core = faction.units.find(
      (unit) => unit.name === "Stormstrike Palladors",
    );
    const soa = faction.units.find(
      (unit) => unit.name === "Stormstrike Palladors (Scourge of Aqshy)",
    );
    expect(core && soa).toBeTruthy();
    if (!core || !soa) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const regimentId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [
              { id: createId(), unitId: core.id, reinforced: false },
              { id: createId(), unitId: soa.id, reinforced: false },
            ],
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" &&
          issue.text.includes("Cannot mix") &&
          issue.text.includes("Scourge of Aqshy"),
      ),
    ).toBe(true);
  });
});
