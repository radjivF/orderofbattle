import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import {
  addHiddenPhaseSelection,
  hiddenSelectionIdsForPhase,
  hideSelectionFromPhase,
  playAfterDamage,
} from "./playHide";

describe("addHiddenPhaseSelection", () => {
  it("keeps the first hide when a second unit is hidden", () => {
    const first = addHiddenPhaseSelection({}, "movement", "hero-1");
    const next = addHiddenPhaseSelection(first, "movement", "unit-2");
    expect(next.movement).toEqual(["hero-1", "unit-2"]);
  });
});

describe("hideSelectionFromPhase", () => {
  it("keeps the first hidden unit when another is hidden", () => {
    const heroId = createId();
    const unitId = createId();
    const list = {
      ...blankArmy("cities-of-sigmar"),
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: heroId,
            unitId: "hero",
            reinforced: false,
            play: { damage: 8 },
          },
          units: [
            {
              id: unitId,
              unitId: "troop",
              reinforced: false,
              play: { damage: 10 },
            },
          ],
        },
      ],
    };

    const afterFirst = hideSelectionFromPhase(list, heroId, "movement");
    const afterSecond = hideSelectionFromPhase(afterFirst, unitId, "movement");

    expect(hiddenSelectionIdsForPhase(afterSecond, "movement")).toEqual([
      heroId,
      unitId,
    ]);
  });

  it("drops a phase hide when the unit is revived", () => {
    const heroId = createId();
    const hero = {
      id: heroId,
      unitId: "hero",
      reinforced: false,
      play: { damage: 8, removedFromPhases: ["movement"] },
    };
    const revived = playAfterDamage(hero, 0, {
      id: "hero",
      name: "Fusil-Major",
      points: 0,
      models: 1,
      hero: true,
      unique: false,
      reinforce: false,
      stats: { move: "5\"", health: "8", save: "4+", control: "2" },
      categories: [],
      weapons: [],
      abilities: [],
      regimentOptions: [],
      regimentHeroes: [],
    });
    expect(revived.removedFromPhases).toBeUndefined();
    expect(revived.damage).toBe(0);
  });
});
