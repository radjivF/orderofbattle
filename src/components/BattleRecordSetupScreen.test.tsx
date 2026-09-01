import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { battleplanLayouts } from "@/engine/battleplanLayout";
import { battleTacticsForRealm } from "@/engine/data/load";
import {
  createBattleRecord,
  setBattleplan,
  setPlayerTacticCards,
  type GameSession,
} from "@/engine/gameSession";
import { blankArmy } from "@/engine/listFactories";
import type { StoredList } from "@/engine/storedList";

const armyStore: { items: StoredList[] } = { items: [] };

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    onStoreChange();
    return () => undefined;
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => armyStore.items,
}));

import { BattleRecordSetupScreen } from "./BattleRecordSetupScreen";

function SetupHarness({ initial }: { initial: GameSession }) {
  const [game, setGame] = useState(initial);
  return (
    <BattleRecordSetupScreen
      game={game}
      onChange={(next) =>
        setGame((prev) => (typeof next === "function" ? next(prev) : next))
      }
      onBack={() => undefined}
    />
  );
}

afterEach(() => {
  cleanup();
  armyStore.items = [];
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

  it("aligns the back button with the title and the match card gutter", () => {
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
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );

    const back = screen.getByRole("button", { name: "Back to Battle record" });
    expect(back.parentElement?.className).toContain("min-h-11");
    expect(back.parentElement?.className).toContain("items-center");
    expect(back.parentElement?.parentElement?.className).toContain("px-3");
    expect(screen.getByRole("main").className).toContain("px-3");
    expect(screen.getByRole("heading", { name: "Set up battle" }).className).toContain(
      "leading-none",
    );
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

  it("copies battle tactics from the linked list when the game has none", async () => {
    const aqshy = battleTacticsForRealm("aqshy");
    const list = {
      ...blankArmy("sylvaneth", "Radjiv"),
      battleTacticCardIds: [aqshy[0]!.id, aqshy[1]!.id],
      scourgeRealm: "aqshy" as const,
    };
    armyStore.items = [list];
    const game = createBattleRecord({
      yourName: "Radjiv",
      yourArmy: list.name,
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      yourListId: list.id,
    });

    render(<SetupHarness initial={game} />);

    const section = screen
      .getByRole("heading", { name: /Radjiv · battle tactics/ })
      .closest("section")!;
    await waitFor(() => {
      expect(
        within(section).getByRole("checkbox", { name: aqshy[0]!.name }),
      ).toBeChecked();
    });
    expect(
      within(section).getByRole("checkbox", { name: aqshy[1]!.name }),
    ).toBeChecked();
    expect(
      within(section).getByRole("checkbox", { name: aqshy[2]!.name }),
    ).toBeDisabled();
  });

  it("keeps prefilled tactics from another realm checked and lets you swap", async () => {
    const user = userEvent.setup();
    const ghyran = battleTacticsForRealm("ghyran");
    const first = ghyran[0]!;
    const second = ghyran[1]!;
    const third = ghyran[2]!;
    const game = createBattleRecord({
      yourName: "Radjiv",
      yourArmy: "Sylvaneth",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      yourTacticCardIds: [first.id, second.id],
    });

    render(<SetupHarness initial={game} />);

    const section = screen
      .getByRole("heading", { name: /Radjiv · battle tactics/ })
      .closest("section")!;
    const firstBox = within(section).getByRole("checkbox", {
      name: first.name,
    });
    const secondBox = within(section).getByRole("checkbox", {
      name: second.name,
    });
    const thirdBox = within(section).getByRole("checkbox", {
      name: third.name,
    });
    expect(firstBox).toBeChecked();
    expect(secondBox).toBeChecked();
    expect(firstBox).toBeEnabled();
    expect(thirdBox).toBeDisabled();

    await user.click(firstBox);
    expect(firstBox).not.toBeChecked();
    expect(thirdBox).toBeEnabled();
    await user.click(thirdBox);
    expect(thirdBox).toBeChecked();
    expect(secondBox).toBeChecked();
  });
});
