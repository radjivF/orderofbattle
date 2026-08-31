import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createBattleRecord,
  setRoundVp,
} from "@/engine/gameSession";
import { BattleRecordGameScreen } from "./BattleRecordGameScreen";

vi.mock("@/lib/gameStorage", () => ({
  getGame: vi.fn(async () =>
    setRoundVp(
      createBattleRecord({
        yourName: "Rad",
        opponentName: "Alex",
        battleplanId: "into-the-fire",
        allowDoubleTurn: true,
        yourTacticCardIds: ["a", "b"],
        opponentTacticCardIds: ["c", "d"],
      }),
      0,
      "you",
      3,
    ),
  ),
  saveGame: vi.fn(async (game) => game),
  deleteGame: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("BattleRecordGameScreen", () => {
  it("shows both player totals and turn controls", async () => {
    const user = userEvent.setup();
    render(<BattleRecordGameScreen gameId="game-1" />);

    expect(await screen.findByRole("heading", { name: /Rad vs Alex/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Battle round" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase Rad VP" }));
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
  });
});
