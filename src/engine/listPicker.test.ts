import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy, blankPathToGlory } from "./listFactories";
import { dropEnhancements, pickerUnitsFor, takenUniqueBases } from "./listPicker";
import { getFaction } from "./queries";

describe("listPicker", () => {
  it("tracks unique bases across the roster", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unique = faction.units.find((unit) => unit.unique);
    expect(unique).toBeTruthy();
    if (!unique) return;

    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "r1",
          hero: { id: createId(), unitId: unique.id, reinforced: false },
          units: [],
        },
      ],
    };

    expect(takenUniqueBases(list, faction).size).toBe(1);
  });

  it("drops enhancements tied to a removed hero", () => {
    const list = blankArmy("stormcast-eternals");
    const heroSelectionId = createId();
    const pruned = dropEnhancements(
      {
        ...list,
        heroicTrait: {
          heroSelectionId,
          optionId: "trait-1",
        },
      },
      heroSelectionId,
    );
    expect(pruned.heroicTrait).toBeNull();
  });

  it("returns hero picker units", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const units = pickerUnitsFor(blankArmy(faction.id), faction, {
      kind: "hero",
    });
    expect(units?.length).toBeGreaterThan(0);
    expect(
      units?.some((unit) => unit.name.startsWith("Anvil of Apotheosis")),
    ).toBe(false);
  });

  it("shows Anvil of Apotheosis only on Path to Glory lists", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    expect(anvil?.pathToGloryOnly).toBe(true);
    expect(anvil?.anvilRanks?.length).toBeGreaterThanOrEqual(3);

    const list = blankPathToGlory(faction.id, "ascension");
    const units = pickerUnitsFor(list, faction, { kind: "hero" });
    expect(
      units?.some((unit) => unit.id === anvil?.id),
    ).toBe(true);
  });

  it("hides Scourge-of-* units from Path to Glory pickers", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const scourgeUnit = faction.units.find((unit) =>
      unit.name.includes("(Scourge of"),
    );
    expect(scourgeUnit).toBeTruthy();

    const ptgList = blankPathToGlory(faction.id, "ascension");
    const ptgUnits = pickerUnitsFor(ptgList, faction, { kind: "hero" });
    expect(
      ptgUnits?.some((unit) => unit.name.includes("(Scourge of")),
    ).toBe(false);

    const matchedList = blankArmy(faction.id);
    const matchedUnits = pickerUnitsFor(matchedList, faction, { kind: "hero" });
    expect(
      matchedUnits?.some((unit) => unit.name.includes("(Scourge of")),
    ).toBe(true);
  });

  it("returns legal units for Anvil of Apotheosis regiment slots", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: anvil.id, reinforced: false },
          units: [],
        },
      ],
    };

    const companions = pickerUnitsFor(list, faction, {
      kind: "unit",
      regimentId: "reg-1",
    });
    expect(companions).toBeTruthy();
    expect(companions!.length).toBeGreaterThan(0);
    expect(
      companions?.some((unit) => unit.name.includes("Liberators")),
    ).toBe(true);
  });

  it("returns legal units for Soulblight Anvil regiment slots", () => {
    const faction = getFaction("soulblight-gravelords");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: anvil.id, reinforced: false },
          units: [],
        },
      ],
    };

    const companions = pickerUnitsFor(list, faction, {
      kind: "unit",
      regimentId: "reg-1",
    });
    expect(companions).toBeTruthy();
    expect(companions!.length).toBeGreaterThan(0);
    expect(
      companions?.some((unit) => 
        unit.categories.includes("SOULBLIGHT GRAVELORDS") &&
        !unit.hero
      ),
    ).toBe(true);
  });

  it("returns legal Troggoth units for Gloomspite Troggoth Anvil", () => {
    const faction = getFaction("gloomspite-gitz");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name === "Anvil of Apotheosis: Troggoth Hero",
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: anvil.id, reinforced: false },
          units: [],
        },
      ],
    };

    const companions = pickerUnitsFor(list, faction, {
      kind: "unit",
      regimentId: "reg-1",
    });
    expect(companions).toBeTruthy();
    expect(companions!.length).toBeGreaterThan(0);
    expect(
      companions?.some((unit) => unit.categories.includes("TROGGOTH")),
    ).toBe(true);
    expect(
      companions?.some((unit) => unit.name.includes("Troggoth")),
    ).toBe(true);
  });

  it("returns legal Grot units for Gloomspite Grot Anvil", () => {
    const faction = getFaction("gloomspite-gitz");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name === "Anvil of Apotheosis: Grot Hero",
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: anvil.id, reinforced: false },
          units: [],
        },
      ],
    };

    const companions = pickerUnitsFor(list, faction, {
      kind: "unit",
      regimentId: "reg-1",
    });
    expect(companions).toBeTruthy();
    expect(companions!.length).toBeGreaterThan(0);
    expect(
      companions?.some((unit) => 
        unit.categories.includes("GLOOMSPITE GITZ") &&
        !unit.hero
      ),
    ).toBe(true);
  });
});
