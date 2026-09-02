import { describe, expect, it } from "vitest";
import { getFaction } from "../queries";
import { blankPathToGlory } from "../listFactories";
import { canBeWarlord, getWarlordSelection, initializeWarlordState, isWarlord } from "./warlord";
import { createId } from "@/lib/id";
import type { Selection } from "../types";

describe("warlord", () => {
  it("rejects unique heroes as warlord", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unique = faction.units.find((unit) => unit.hero && unit.unique);
    expect(unique).toBeTruthy();
    if (!unique) return;

    const selection: Selection = {
      id: createId(),
      unitId: unique.id,
      reinforced: false,
    };

    expect(canBeWarlord(unique, selection, faction)).toBe(false);
  });

  it("rejects reinforced heroes as warlord", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && unit.models === 1);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const selection: Selection = {
      id: createId(),
      unitId: hero.id,
      reinforced: true,
    };

    expect(canBeWarlord(hero, selection, faction)).toBe(false);
  });

  it("rejects heroes over 350 pts as warlord", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const expensive = faction.units.find(
      (unit) => unit.hero && unit.models === 1 && unit.points > 350,
    );
    expect(expensive).toBeTruthy();
    if (!expensive) return;

    const selection: Selection = {
      id: createId(),
      unitId: expensive.id,
      reinforced: false,
    };

    expect(canBeWarlord(expensive, selection, faction)).toBe(false);
  });

  it("allows eligible heroes as warlord", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const eligible = faction.units.find(
      (unit) =>
        unit.hero &&
        !unit.unique &&
        unit.models === 1 &&
        unit.points <= 350,
    );
    expect(eligible).toBeTruthy();
    if (!eligible) return;

    const selection: Selection = {
      id: createId(),
      unitId: eligible.id,
      reinforced: false,
    };

    expect(canBeWarlord(eligible, selection, faction)).toBe(true);
  });

  it("allows Anvil of Apotheosis as warlord despite unique flag", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;
    expect(anvil.unique).toBe(true);
    expect(anvil.models).toBe(1);

    const selection: Selection = {
      id: createId(),
      unitId: anvil.id,
      reinforced: false,
    };

    expect(canBeWarlord(anvil, selection, faction)).toBe(true);
  });

  it("allows Sons of Behemat heroes at any points level", () => {
    const faction = getFaction("sons-of-behemat");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const mega = faction.units.find(
      (unit) => unit.hero && unit.points > 350,
    );
    expect(mega).toBeTruthy();
    if (!mega) return;

    const selection: Selection = {
      id: createId(),
      unitId: mega.id,
      reinforced: false,
    };

    expect(canBeWarlord(mega, selection, faction)).toBe(true);
  });

  it("gets warlord selection from list", () => {
    const list = blankPathToGlory("stormcast-eternals", "ascension");
    expect(getWarlordSelection(list)).toBeNull();

    const heroId = createId();
    list.pathToGlory!.warlordSelectionId = heroId;
    list.regiments = [
      {
        id: "reg-1",
        hero: { id: heroId, unitId: "unit-1", reinforced: false },
        units: [],
      },
    ];

    const warlord = getWarlordSelection(list);
    expect(warlord).toBeTruthy();
    expect(warlord?.id).toBe(heroId);
  });

  it("checks if selection is warlord", () => {
    const list = blankPathToGlory("stormcast-eternals", "ascension");
    const heroId = createId();
    list.pathToGlory!.warlordSelectionId = heroId;

    expect(isWarlord(list, heroId)).toBe(true);
    expect(isWarlord(list, "other-id")).toBe(false);
  });

  it("initializes warlord with first Path and aspiring ability", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((u) => 
      u.name.startsWith("Anvil of Apotheosis") && u.hero
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const list = blankPathToGlory(faction.id, "ascension");
    const selection: Selection = {
      id: createId(),
      unitId: anvil.id,
      reinforced: false,
    };

    const initialized = initializeWarlordState(list, anvil, selection);
    
    expect(initialized.pathToGlory?.renown).toBe(5);
    expect(initialized.pathToGlory?.pathId).toBeTruthy();
    expect(initialized.pathToGlory?.pathId).not.toBeNull();
    expect(initialized.pathToGlory?.pathOptionIds).toHaveLength(1);
  });

  it("keeps existing Path when initializing warlord", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((u) => u.hero && u.models === 1 && !u.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const list = blankPathToGlory(faction.id, "ascension");
    const existingPathId = "path-of-the-warrior";
    const existingOptionId = "some-option";
    const selection: Selection = {
      id: createId(),
      unitId: hero.id,
      reinforced: false,
      pathToGlory: {
        renown: 3,
        pathId: existingPathId,
        pathOptionIds: [existingOptionId],
        battleWoundId: null,
        scarId: null,
      },
    };

    const initialized = initializeWarlordState(list, hero, selection);
    
    expect(initialized.pathToGlory?.renown).toBeGreaterThanOrEqual(5);
    expect(initialized.pathToGlory?.pathId).toBe(existingPathId);
    expect(initialized.pathToGlory?.pathOptionIds).toEqual([existingOptionId]);
  });
});
