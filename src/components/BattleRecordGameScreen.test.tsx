import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createBattleRecord,
  setBattleplan,
  setPlayerTacticCards,
  startBattle,
} from "@/engine/gameSession";

vi.mock("@/lib/gameStorage", () => ({
  getGame: vi.fn(async () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = setPlayerTacticCards(game, "you", ["a", "b"]);
    game = setPlayerTacticCards(game, "opponent", ["c", "d"]);
    return startBattle(game);
  }),
  saveGame: vi.fn(async (game) => game),
  deleteGame: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { BattleRecordGameScreen } from "./BattleRecordGameScreen";

describe("BattleRecordGameScreen", () => {
  it("scores mission points one by one and shows twist for underdog", async () => {
    const user = userEvent.setup();
    render(<BattleRecordGameScreen gameId="game-1" />);

    expect(
      await screen.findByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Primary · Into the Fire/)).toBeInTheDocument();
    expect(screen.getByText(/Twist · underdog/)).toBeInTheDocument();
    expect(screen.getByText("Point 1")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Rad scored this point" })[0]!,
    );
    expect(screen.getByText("✓ Rad")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "p.tabular-nums" })).toBeTruthy();
  });
});
