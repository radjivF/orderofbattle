import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { getFaction } from "./queries";
import { pruneOrphanEnhancements, regimentSlotCap, summarize } from "./validate";

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
  it("flags a regiment without a hero", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const list = {
      ...blankArmy(faction.id),
      regiments: [{ id: "r1", hero: null, units: [] }],
    };
    const totals = summarize(list, faction);
    expect(totals.issues.some((issue) => issue.text.includes("needs a hero"))).toBe(
      true,
    );
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
