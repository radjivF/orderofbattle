import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { armyRoster, CORE_PLAY_PHASES } from "./phases";
import { getFaction } from "./queries";
import { ensureAllFactions } from "@/engine/data/load";

describe("CORE_PLAY_PHASES", () => {
  it("lists army through end phases in order", () => {
    expect(CORE_PLAY_PHASES.map((phase) => phase.id)).toEqual([
      "passive",
      "hero",
      "movement",
      "shooting",
      "charge",
      "combat",
      "end",
    ]);
  });
});

describe("armyRoster", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("includes hero and companion selections", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const heroSelectionId = createId();
    const unitSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [
            { id: unitSelectionId, unitId: companion.id, reinforced: false },
          ],
        },
      ],
    };

    const roster = armyRoster(list, faction);
    expect(roster.map((entry) => entry.selectionId)).toEqual([
      heroSelectionId,
      unitSelectionId,
    ]);
    expect(roster.map((entry) => entry.unit.name)).toEqual([
      "Arch-Revenant",
      "Treelord",
    ]);
  });
});
