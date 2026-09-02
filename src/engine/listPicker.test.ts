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

  it("excludes TROGGOTH units from Da King's Gitz (Army of Renown) PTG auxiliaries", () => {
    const daKingsFaction = getFaction("gloomspite-gitz-da-king-s-gitz");
    expect(daKingsFaction).toBeTruthy();
    if (!daKingsFaction) return;

    const ptgList = blankPathToGlory(daKingsFaction.id, "ascension");

    const auxUnits = pickerUnitsFor(ptgList, daKingsFaction, { kind: "aux" });
    expect(auxUnits).toBeTruthy();
    expect(
      auxUnits?.some((unit) => unit.name === "Dankhold Troggoth"),
    ).toBe(false);
    expect(
      auxUnits?.some((unit) => unit.name === "Fellwater Troggoths"),
    ).toBe(false);
    expect(
      auxUnits?.some((unit) => unit.name === "Rockgut Troggoths"),
    ).toBe(false);

    // Base gloomspite-gitz should still show TROGGOTHs (not globally hidden)
    const baseFaction = getFaction("gloomspite-gitz");
    expect(baseFaction).toBeTruthy();
    if (!baseFaction) return;

    const baseList = blankPathToGlory(baseFaction.id, "ascension");
    const baseAuxUnits = pickerUnitsFor(baseList, baseFaction, { kind: "aux" });
    expect(baseAuxUnits).toBeTruthy();
    expect(
      baseAuxUnits?.some((unit) => unit.name === "Dankhold Troggoth"),
    ).toBe(true);
    expect(
      baseAuxUnits?.some((unit) => unit.name === "Fellwater Troggoths"),
    ).toBe(true);
  });

  it("blocks non-TROGGOTH units when Gloomspite PTG already has TROGGOTHs", () => {
    const faction = getFaction("gloomspite-gitz");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const troggUnit = faction.units.find((u) =>
      u.categories.includes("TROGGOTH"),
    );
    expect(troggUnit).toBeTruthy();
    if (!troggUnit) return;

    const ptgList = {
      ...blankPathToGlory(faction.id, "ascension"),
      auxiliaries: [
        { id: createId(), unitId: troggUnit.id, reinforced: false },
      ],
    };

    const auxUnits = pickerUnitsFor(ptgList, faction, { kind: "aux" });
    expect(auxUnits).toBeTruthy();
    // Should only show TROGGOTH units
    expect(auxUnits?.every((u) => u.categories.includes("TROGGOTH"))).toBe(
      true,
    );
  });

  it("blocks TROGGOTH units when Gloomspite PTG already has grot units", () => {
    const faction = getFaction("gloomspite-gitz");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const grotUnit = faction.units.find(
      (u) =>
        u.categories.includes("GLOOMSPITE GITZ") &&
        !u.categories.includes("TROGGOTH") &&
        !u.hero,
    );
    expect(grotUnit).toBeTruthy();
    if (!grotUnit) return;

    const ptgList = {
      ...blankPathToGlory(faction.id, "ascension"),
      auxiliaries: [
        { id: createId(), unitId: grotUnit.id, reinforced: false },
      ],
    };

    const auxUnits = pickerUnitsFor(ptgList, faction, { kind: "aux" });
    expect(auxUnits).toBeTruthy();
    // Should not show any TROGGOTH units
    expect(auxUnits?.some((u) => u.categories.includes("TROGGOTH"))).toBe(
      false,
    );
  });
});
