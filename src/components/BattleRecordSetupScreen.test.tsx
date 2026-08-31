import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createBattleRecord } from "@/engine/gameSession";
import { BattleRecordSetupScreen } from "./BattleRecordSetupScreen";

describe("BattleRecordSetupScreen", () => {
  it("lists battleplans and requires tactics before start", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });

    render(
      <BattleRecordSetupScreen
        game={game}
        onChange={onChange}
        onBack={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Set up battle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Into the Fire/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start game" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Into the Fire/ }));
    expect(onChange).toHaveBeenCalled();
  });
});
