import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils/render";
import { PathToGloryUnitExtras } from "./PathToGloryUnitExtras";

const attackerPath = {
  id: "hero-1",
  unitId: "unit-1",
  reinforced: false,
  pathToGlory: {
    renown: 5,
    pathId: "path-of-the-attacker",
    pathOptionIds: [],
    battleWoundId: null,
    scarId: null,
    anvilRankId: null,
    anvilPickIds: [],
  },
};

describe("PathToGloryUnitExtras Path", () => {
  it("puts Aspiring abilities beside each other as a pick-one pair", () => {
    render(
      <PathToGloryUnitExtras
        selection={attackerPath}
        packIds={["ascension"]}
        showBattleWounds={false}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /full-on attack/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /battle fury/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/add 1 to hit rolls for attacks made by units this phase/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/charge abilities even if it used a run ability/i),
    ).toBeInTheDocument();
    const pair = screen.getByRole("group", { name: /aspiring/i });
    expect(pair.className).toContain("grid-cols-2");
  });

});
