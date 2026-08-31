import { describe, expect, it } from "vitest";
import {
  BATTLEPLAN_IDS,
  battleplanLayouts,
  getBattleplanLayout,
} from "./battleplanLayout";

describe("Scourge of Aqshy battleplan layouts", () => {
  it("has exactly twelve battleplans", () => {
    expect(battleplanLayouts).toHaveLength(12);
    expect(BATTLEPLAN_IDS).toHaveLength(12);
  });

  it("covers every catalog id with a layout", () => {
    for (const id of BATTLEPLAN_IDS) {
      const layout = getBattleplanLayout(id);
      expect(layout, `missing layout for ${id}`).toBeDefined();
      expect(layout!.id).toBe(id);
      expect(layout!.name.length).toBeGreaterThan(0);
      expect([1, 2]).toContain(layout!.table);
    }
  });

  it("each layout has board size, territories, and at least one objective", () => {
    for (const layout of battleplanLayouts) {
      expect(layout.board.width).toBeGreaterThan(0);
      expect(layout.board.height).toBeGreaterThan(0);
      expect(layout.territories.attacker.length).toBeGreaterThanOrEqual(3);
      expect(layout.territories.defender.length).toBeGreaterThanOrEqual(3);
      expect(layout.objectives.length).toBeGreaterThan(0);
      for (const obj of layout.objectives) {
        expect(obj.x).toBeGreaterThanOrEqual(0);
        expect(obj.x).toBeLessThanOrEqual(layout.board.width);
        expect(obj.y).toBeGreaterThanOrEqual(0);
        expect(obj.y).toBeLessThanOrEqual(layout.board.height);
      }
    }
  });

  it("names match the GHB 2026–27 Scourge of Aqshy set", () => {
    const names = battleplanLayouts.map((p) => p.name).sort();
    expect(names).toEqual(
      [
        "Avalanche of Ash",
        "Bloodstained Coasts",
        "Caverns of Slaughter",
        "Curse of the Gnaw",
        "Escape from the Coast",
        "Hidden Under Ash-Clouds",
        "Into the Fire",
        "Power of the Realms",
        "Seize the Embers",
        "Treacherous Ground",
        "Warped Ruins",
        "What’s Yours Is Ours",
      ].sort(),
    );
  });
});
