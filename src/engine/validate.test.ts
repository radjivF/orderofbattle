import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { canJoinRegiment, getFaction } from "./queries";
import { pruneOrphanEnhancements, regimentSlotCap, summarize } from "./validate";
import { ensureAllFactions } from "@/engine/data/load";

describe("regimentSlotCap", () => {
  it("allows four slots for the general regiment", () => {
    const list = blankArmy("stormcast-eternals");
    const regimentId = "reg-1";
    list.generalRegimentId = regimentId;
    expect(regimentSlotCap(list, regimentId)).toBe(4);
    expect(regimentSlotCap(list, "other")).toBe(3);
  });
});

describe("summarize", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("flags a regiment without a hero", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const list = {
      ...blankArmy(faction.id),
      regiments: [{ id: "r1", hero: null, units: [] }],
    };
    const totals = summarize(list, faction);
    const issue = totals.issues.find((item) => item.text.includes("needs a hero"));
    expect(issue?.target).toEqual({ area: "add-hero", regimentId: "r1" });
  });

  it("points empty lists at the add-regiment action", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const totals = summarize(blankArmy(faction.id), faction);
    const issue = totals.issues.find((item) =>
      item.text.includes("Add a regiment"),
    );
    expect(issue?.target).toEqual({ area: "add-regiment" });
  });

  it("points missing battle tactics at Options", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: "r1",
        regiments: [
          {
            id: "r1",
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [],
          },
        ],
      },
      faction,
    );
    const issue = totals.issues.find((item) =>
      item.text.includes("battle tactic"),
    );
    expect(issue?.target).toEqual({ area: "options", field: "tactics" });
  });

  it("points over-cap lists at the points field", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const totals = summarize(
      {
        ...blankArmy(faction.id),
        pointsCap: 1,
        generalRegimentId: "r1",
        regiments: [
          {
            id: "r1",
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [],
          },
        ],
      },
      faction,
    );
    const issue = totals.issues.find((item) => item.text.includes("points over"));
    expect(issue?.target).toEqual({ area: "options", field: "points" });
  });

  it("points illegal companions at the unit row", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const companion = faction.units.find(
      (unit) => !unit.hero && !canJoinRegiment(hero, unit, faction),
    );
    expect(companion).toBeTruthy();
    if (!companion) return;

    const companionId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: "r1",
        regiments: [
          {
            id: "r1",
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [{ id: companionId, unitId: companion.id, reinforced: false }],
          },
        ],
      },
      faction,
    );
    const issue = totals.issues.find((item) => item.text.includes("cannot join"));
    expect(issue?.target).toEqual({ area: "unit", selectionId: companionId });
  });

  it("flags duplicate unique units", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unique = faction.units.find((unit) => unit.unique);
    expect(unique).toBeTruthy();
    if (!unique) return;

    const heroId = createId();
    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "r1",
      regiments: [
        {
          id: "r1",
          hero: { id: heroId, unitId: unique.id, reinforced: false },
          units: [{ id: createId(), unitId: unique.id, reinforced: false }],
        },
      ],
    };
    const totals = summarize(list, faction);
    expect(totals.issues.some((issue) => issue.text.includes("unique"))).toBe(
      true,
    );
  });
});

describe("pruneOrphanEnhancements", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("drops artefact picks when the hero is removed", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const heroSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "r1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
      artefact: {
        heroSelectionId,
        optionId: "artefact-1",
        name: "Test artefact",
      },
    };

    const pruned = pruneOrphanEnhancements({
      ...list,
      regiments: [{ id: "r1", hero: null, units: [] }],
    });
    expect(pruned.artefact).toBeNull();
  });
});
