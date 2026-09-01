import { describe, expect, it } from "vitest";
import {
  BATTLEPLAN_IDS,
  battleplanLayouts,
  getBattleplanLayout,
  missionPrimaryPoints,
  scoringLineVp,
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

  it("exposes full victory-point and twist text for each battleplan", () => {
    for (const layout of battleplanLayouts) {
      expect(layout.primaryScoring.length).toBeGreaterThanOrEqual(2);
      for (const line of layout.primaryScoring) {
        expect(line.toLowerCase()).toMatch(/victory points|score /);
      }
      expect(layout.twistEffect.length).toBeGreaterThan(40);
      expect(layout.twistEffect).not.toMatch(
        /Follow the battleplan twist rules/,
      );
    }
  });

  it("uses the printed victory points on each scoring line", () => {
    expect(scoringLineVp("Score 3 victory points if you control at least 1 objective.")).toBe(3);
    expect(scoringLineVp("Score 4 victory points if you control more objectives than your opponent.")).toBe(4);
    expect(
      scoringLineVp(
        "Score 7 victory points if there are no objectives on the battlefield.",
      ),
    ).toBe(7);
    expect(
      scoringLineVp(
        "From the second battle round onwards, score 4 victory points if you control an objective.",
      ),
    ).toBe(4);

    const intoTheFire = getBattleplanLayout("into-the-fire")!;
    expect(missionPrimaryPoints(intoTheFire).map((point) => point.vp)).toEqual([
      3, 3, 4,
    ]);
  });
});
