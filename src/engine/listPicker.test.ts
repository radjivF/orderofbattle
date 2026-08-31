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
});
