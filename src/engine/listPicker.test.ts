import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "./listFactories";
import { dropEnhancements, pickerUnitsFor, takenUniqueBases } from "./listPicker";
import { getFaction } from "./queries";
import { ensureAllFactions } from "@/engine/data/load";

describe("listPicker", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
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
  });
});
