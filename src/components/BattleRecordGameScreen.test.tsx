import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createBattleRecord,
  finishBattle,
  setBattleplan,
  setRoundVp,
  startBattle,
} from "@/engine/gameSession";
import * as gameStorage from "@/lib/gameStorage";

vi.mock("@/lib/gameStorage", () => ({
  getGame: vi.fn(),
  saveGame: vi.fn(async (game) => game),
  deleteGame: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { BattleRecordGameScreen } from "./BattleRecordGameScreen";

function activeFixture() {
  let game = createBattleRecord({
    yourName: "Rad",
    yourArmy: "Stormcast",
    opponentName: "Alex",
    opponentArmy: "Khorne",
    allowDoubleTurn: true,
  });
  game = setBattleplan(game, "into-the-fire");
  game = startBattle(game);
  game = setRoundVp(game, 0, "you", 5);
  game = setRoundVp(game, 0, "opponent", 2);
  return game;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BattleRecordGameScreen", () => {
  it("scores mission points one by one and shows twist for underdog", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());

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

  it("shows a battle timeline with turns and Done", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    const timeline = await screen.findByRole("navigation", {
      name: "Battle timeline",
    });
    expect(timeline).toHaveTextContent("T1");
    expect(timeline).toHaveTextContent("T5");
    expect(
      screen.getByRole("button", { name: "Done" }),
    ).toBeInTheDocument();
  });

  it("Done finishes the battle and shows the recap with score share actions", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<BattleRecordGameScreen gameId="game-1" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(
      await screen.findByRole("heading", { name: /\(\d+\s*[–-]\s*\d+\).*Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Into the Fire/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Primary mission/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Battle tactics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\d+\s*VP/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Copy result" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save picture" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(gameStorage.saveGame).toHaveBeenCalled();
      const saved = vi.mocked(gameStorage.saveGame).mock.calls.at(-1)?.[0];
      expect(saved?.status).toBe("done");
    });

    await user.click(screen.getByRole("button", { name: "Copy result" }));
    expect(writeText).toHaveBeenCalled();
    expect(writeText.mock.calls[0]![0]).toMatch(/Into the Fire/);
  });

  it("opens the recap when the stored battle is already done", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      finishBattle(activeFixture()),
    );
    render(<BattleRecordGameScreen gameId="game-done" />);

    expect(
      await screen.findByRole("heading", { name: /\(\d+\s*[–-]\s*\d+\).*Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("Edit battle from recap reopens live scoring", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      finishBattle(activeFixture()),
    );
    render(<BattleRecordGameScreen gameId="game-done" />);

    expect(
      await screen.findByRole("heading", {
        name: /\(\d+\s*[–-]\s*\d+\).*Rad vs Alex/,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit battle" }));

    expect(
      await screen.findByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Battle timeline" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    await waitFor(() => {
      const saved = vi.mocked(gameStorage.saveGame).mock.calls.at(-1)?.[0];
      expect(saved?.status).toBe("active");
    });
  });

  it("Edit setup lets you change battleplan on an active battle", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(screen.getByText(/Primary · Into the Fire/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit setup" }));
    expect(
      await screen.findByRole("heading", { name: "Set up battle" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Choose battleplan"),
      "seize-the-embers",
    );
    await user.click(screen.getByRole("button", { name: "Back to battle" }));

    expect(
      await screen.findByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Primary · Seize the Embers/)).toBeInTheDocument();
    await waitFor(() => {
      const saved = vi.mocked(gameStorage.saveGame).mock.calls.at(-1)?.[0];
      expect(saved?.battleplanId).toBe("seize-the-embers");
      expect(saved?.status).toBe("active");
    });
  });

  it("hides who-went-first when priority tracking is off", async () => {
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: false,
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    vi.mocked(gameStorage.getGame).mockResolvedValue(game);

    render(<BattleRecordGameScreen gameId="game-no-init" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    expect(screen.queryByText("Who went first")).not.toBeInTheDocument();
    expect(screen.queryByText("Double turn")).not.toBeInTheDocument();
  });

  it("shows who-went-first when priority tracking is on", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    expect(screen.getByText("Who went first")).toBeInTheDocument();
  });
});
