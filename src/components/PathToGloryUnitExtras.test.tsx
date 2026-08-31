import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getByRole("button", { name: "Full-On Attack" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Battle Fury" })).toBeInTheDocument();
    const pair = screen.getByRole("group", { name: /aspiring/i });
    expect(pair.className).toContain("grid-cols-2");
  });

  it("lets you collapse Path so the abilities close", async () => {
    const user = userEvent.setup();
    render(
      <PathToGloryUnitExtras
        selection={attackerPath}
        packIds={["ascension"]}
        showBattleWounds={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/path abilities/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /path of the attacker/i }));
    expect(screen.queryByText(/path abilities/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Full-On Attack" })).not.toBeInTheDocument();
  });
});
