import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { battleplanLayouts } from "@/engine/battleplanLayout";
import { battleTacticsForRealm } from "@/engine/data/load";
import {
  createBattleRecord,
  setBattleplan,
  setPlayerTacticCards,
} from "@/engine/gameSession";
import { BattleRecordSetupScreen } from "./BattleRecordSetupScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BattleRecordSetupScreen", () => {
  it("lists battleplans and keeps Start game disabled until a plan is chosen", async () => {
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
    const planSelect = screen.getByLabelText("Choose battleplan");
    expect(planSelect.tagName).toBe("SELECT");
    expect(
      screen.getByRole("button", { name: "Start game" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Still need a battleplan/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/2 tactics for/),
    ).not.toBeInTheDocument();

    await user.selectOptions(planSelect, "into-the-fire");
    expect(onChange).toHaveBeenCalled();
    const update = onChange.mock.calls.at(-1)?.[0];
    const next =
      typeof update === "function" ? update(game) : update;
    expect(next.battleplanId).toBe("into-the-fire");
  });

  it("starts the battle with only a battleplan and no tactics", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");

    render(
      <BattleRecordSetupScreen
        game={game}
        onChange={onChange}
        onBack={() => undefined}
      />,
    );

    const start = screen.getByRole("button", { name: "Start game" });
    expect(start).toBeEnabled();
    await user.click(start);
    const update = onChange.mock.calls.at(-1)?.[0];
    const next =
      typeof update === "function" ? update(game) : update;
    expect(next.status).toBe("active");
  });

  it("still starts when tactics are set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const cards = battleTacticsForRealm("aqshy");
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");
    game = setPlayerTacticCards(game, "you", [cards[0]!.id, cards[1]!.id]);
    game = setPlayerTacticCards(game, "opponent", [
      cards[2]!.id,
      cards[3]!.id,
    ]);

    render(
      <BattleRecordSetupScreen
        game={game}
        onChange={onChange}
        onBack={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start game" }));
    const update = onChange.mock.calls.at(-1)?.[0];
    const next =
      typeof update === "function" ? update(game) : update;
    expect(next.status).toBe("active");
  });

  it("places Start and Cancel centered in the main flow, not a fixed footer", () => {
    const game = setBattleplan(
      createBattleRecord({
        yourName: "Rad",
        yourArmy: "Stormcast",
        opponentName: "Alex",
        opponentArmy: "Khorne",
        allowDoubleTurn: true,
      }),
      "into-the-fire",
    );

    const { container } = render(
      <BattleRecordSetupScreen
        game={game}
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );

    expect(
      container.querySelector(".fixed.inset-x-0.bottom-0"),
    ).toBeNull();

    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("button", { name: "Start game" }),
    ).toBeEnabled();
    expect(
      within(main).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("Choose random picks a battleplan from the list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    const targetIndex = 3;
    vi.spyOn(Math, "random").mockReturnValue(
      (targetIndex + 0.5) / battleplanLayouts.length,
    );

    render(
      <BattleRecordSetupScreen
        game={game}
        onChange={onChange}
        onBack={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Choose random" }));

    const update = onChange.mock.calls.at(-1)?.[0];
    const next =
      typeof update === "function" ? update(game) : update;
    expect(next.battleplanId).toBe(battleplanLayouts[targetIndex]!.id);
  });

  it("Choose random still works when a battleplan is already selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    render(
      <BattleRecordSetupScreen
        game={game}
        onChange={onChange}
        onBack={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Choose random" }));

    const update = onChange.mock.calls.at(-1)?.[0];
    const next =
      typeof update === "function" ? update(game) : update;
    const lastId = battleplanLayouts.at(-1)!.id;
    expect(next.battleplanId).toBe(lastId);
  });

  it("collapses tactic detail text until Show details is pressed", async () => {
    const user = userEvent.setup();
    const cards = battleTacticsForRealm("aqshy");
    const blazing = cards.find((card) => card.name === "Blazing Onslaught");
    expect(blazing?.setup).toBeTruthy();

    render(
      <BattleRecordSetupScreen
        game={createBattleRecord({
          yourName: "Rad",
          yourArmy: "Stormcast",
          opponentName: "Alex",
          opponentArmy: "Khorne",
          allowDoubleTurn: true,
        })}
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );

    expect(screen.queryByText(blazing!.setup)).not.toBeInTheDocument();
    expect(screen.queryByText(/Master of Arms/)).not.toBeInTheDocument();

    const show = screen.getAllByRole("button", {
      name: "Show Blazing Onslaught details",
    })[0]!;
    expect(show).toHaveAttribute("aria-expanded", "false");
    await user.click(show);

    expect(screen.getByText(blazing!.setup)).toBeInTheDocument();
    expect(screen.getByText(/Master of Arms/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Hide Blazing Onslaught details",
      }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(
      screen.getByRole("button", {
        name: "Hide Blazing Onslaught details",
      }),
    );
    expect(screen.queryByText(blazing!.setup)).not.toBeInTheDocument();
  });
});
