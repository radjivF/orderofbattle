import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import {
  createBattleRecord,
  finishBattle,
  setBattleplan,
  setRoundFirstPlayer,
  setRoundVp,
  startBattle,
} from "@/engine/gameSession";
import * as gameStorage from "@/lib/gameStorage";
import type { StoredList } from "@/engine/storedList";

const armyStore: { items: StoredList[] } = { items: [] };
const armyListeners = new Set<() => void>();
const push = vi.fn();

vi.mock("@/lib/gameStorage", () => ({
  getGame: vi.fn(),
  saveGame: vi.fn(async (game) => game),
  deleteGame: vi.fn(async () => undefined),
}));

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    armyListeners.add(onStoreChange);
    onStoreChange();
    return () => {
      armyListeners.delete(onStoreChange);
    };
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => armyStore.items,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("./IosNavSlide", () => ({
  useListNav: () => ({ goBack: () => push("/battle-record") }),
}));

vi.mock("./BuilderReady", () => ({
  BuilderReady: ({ list }: { list: { name: string } }) => (
    <p>Play mode · {list.name}</p>
  ),
}));

import { BattleRecordGameScreen } from "./BattleRecordGameScreen";

function activeFixture(
  overrides: {
    yourListId?: string;
    opponentListId?: string;
    yourArmy?: string;
    opponentArmy?: string;
    firstPlayer?: "you" | "opponent";
    yourTacticCardIds?: string[];
    opponentTacticCardIds?: string[];
    skipRoundVp?: boolean;
  } = {},
) {
  let game = createBattleRecord({
    yourName: "Rad",
    yourArmy: overrides.yourArmy ?? "Stormcast",
    opponentName: "Alex",
    opponentArmy: overrides.opponentArmy ?? "Khorne",
    allowDoubleTurn: true,
    yourListId: overrides.yourListId,
    opponentListId: overrides.opponentListId,
    yourTacticCardIds: overrides.yourTacticCardIds,
    opponentTacticCardIds: overrides.opponentTacticCardIds,
  });
  game = setBattleplan(game, "into-the-fire");
  game = startBattle(game);
  if (overrides.firstPlayer) {
    game = setRoundFirstPlayer(game, 0, overrides.firstPlayer);
  }
  if (!overrides.skipRoundVp) {
    game = setRoundVp(game, 0, "you", 5);
    game = setRoundVp(game, 0, "opponent", 2);
  }
  return game;
}

afterEach(() => {
  cleanup();
  armyStore.items = [];
  armyListeners.clear();
  push.mockClear();
  vi.restoreAllMocks();
});

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("BattleRecordGameScreen", () => {
  it("scrolls to the top when starting the battle from setup", async () => {
    const user = userEvent.setup();
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
    });
    game = setBattleplan(game, "into-the-fire");
    vi.mocked(gameStorage.getGame).mockResolvedValue(game);
    const scrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
      writable: true,
    });

    render(<BattleRecordGameScreen gameId="game-1" />);
    await screen.findByRole("heading", { name: "Set up battle" });
    await user.click(screen.getByRole("button", { name: "Start game" }));

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it("keeps underdog fixed for the turn even after scoring catches up", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({ skipRoundVp: true }),
    );

    render(<BattleRecordGameScreen gameId="game-1" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    expect(screen.getByText("No underdog while scores are tied")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Rad scored point 1" }),
    );
    expect(screen.getByText("No underdog while scores are tied")).toBeInTheDocument();
    expect(screen.queryByText(/Assigned to Alex \(underdog\)/)).toBeNull();
  });

  it("scores mission points one by one and shows twist for underdog", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({ skipRoundVp: true }),
    );

    render(<BattleRecordGameScreen gameId="game-1" />);

    expect(
      await screen.findByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Primary · Into the Fire/)).toBeInTheDocument();
    expect(screen.getByText(/Twist · underdog/)).toBeInTheDocument();
    expect(screen.getByText("Point 1 · 3 VP")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rad scored point 1" }),
    ).toHaveTextContent(
      "Score 3 victory points if you control at least 1 objective.",
    );

    await user.click(
      screen.getByRole("button", { name: "Rad scored point 1" }),
    );
    expect(
      screen.getByRole("button", { name: "Rad scored point 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(/Turn score · Rad 3 · Alex 0/),
    ).toBeInTheDocument();
  });

  it("adds completed tactic stages to the match total", async () => {
    const user = userEvent.setup();
    let game = createBattleRecord({
      yourName: "Rad",
      yourArmy: "Stormcast",
      opponentName: "Alex",
      opponentArmy: "Khorne",
      allowDoubleTurn: true,
      yourTacticCardIds: ["7865-8113-df4e-f70a"],
    });
    game = setBattleplan(game, "into-the-fire");
    game = startBattle(game);
    vi.mocked(gameStorage.getGame).mockResolvedValue(game);

    render(<BattleRecordGameScreen gameId="game-tactics" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(screen.getByText("Flanking Firestorm")).toBeInTheDocument();
    expect(screen.queryByText(/5 tactics/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Mark Affray done" }),
    );

    expect(await screen.findByText(/5 tactics/)).toBeInTheDocument();
    expect(screen.getByText("5", { selector: "p.tabular-nums" })).toBeTruthy();
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

  it("keeps both players on the same name, score, and extras rows", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    const board = await screen.findByRole("region", { name: "Match score" });
    const grid = board.firstElementChild;
    expect(grid?.className).toContain("grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]");
    expect(grid?.className).not.toContain("items-end");
    expect(board.querySelector(":scope > div > .sr-only")).toBeNull();
    expect(board.querySelectorAll("p.tabular-nums")).toHaveLength(2);
    const cells = grid ? [...grid.children] : [];
    expect(cells[0]?.className).toContain("col-start-1");
    expect(cells[2]?.className).toContain("col-start-3");
    expect(within(board).getByText("vs").className).toContain("col-start-2");
    expect(within(board).getByText("vs").className).toContain("self-center");
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

  it("scrolls to top when starting the battle from setup", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      writable: true,
      value: scrollTo,
    });

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
    vi.mocked(gameStorage.getGame).mockResolvedValue(game);

    render(<BattleRecordGameScreen gameId="game-setup" />);
    await screen.findByRole("heading", { name: "Set up battle" });
    await user.click(screen.getByRole("button", { name: "Start game" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Rad vs Alex/ }),
      ).toBeInTheDocument();
    });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("puts back next to the match title and returns to Battle record", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    const title = await screen.findByRole("heading", { name: /Rad vs Alex/ });
    const back = screen.getByRole("button", { name: "Back to Battle record" });
    expect(title.parentElement).toContainElement(back);
    expect(screen.getByRole("main").className).toContain("px-3");
    expect(screen.getByRole("main").className).not.toContain("px-5");
    await user.click(back);
    expect(push).toHaveBeenCalledWith("/battle-record");
  });

  it("uses a discreet Edit control instead of a full-width Edit setup button", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    const title = await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(
      screen.queryByRole("button", { name: "Edit setup" }),
    ).not.toBeInTheDocument();
    const edit = screen.getByRole("button", { name: "Edit" });
    expect(edit.className).toContain("bg-ink/50");
    expect(edit.className).toContain("border-sigmarite/70");
    expect(edit.className).not.toContain("ios-liquid-glass");
    expect(edit.className).not.toMatch(/\bw-full\b/);
    expect(title.parentElement).toContainElement(edit);
    const back = screen.getByRole("button", { name: "Back to Battle record" });
    expect(title.parentElement).toContainElement(back);
  });

  it("Edit opens setup where match settings can change army and initiative", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      await screen.findByRole("heading", { name: "Set up battle" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByLabelText("Your army")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Priority and double turn" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Yours painted")).toBeInTheDocument();
  });

  it("slides setup in over the live game and slides it back out", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const setupTitle = await screen.findByRole("heading", {
      name: "Set up battle",
    });
    expect(
      screen.getByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(setupTitle.closest(".list-flow-track")?.className).toContain(
        "list-flow-track--detail",
      );
    });

    await user.click(screen.getByRole("button", { name: "Back to battle" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Set up battle" }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: /Rad vs Alex/ }),
    ).toBeInTheDocument();
  });

  it("Edit setup lets you change battleplan on an active battle", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(screen.getByText(/Primary · Into the Fire/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
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

  it("opens Play as a full-page sheet from the army name when a linked list exists", async () => {
    const user = userEvent.setup();
    const yourList = blankArmy("stormcast-eternals");
    yourList.id = "list-you";
    yourList.name = "My Stormcast";
    armyStore.items = [yourList];

    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({
        yourListId: "list-you",
        opponentListId: "list-gone",
        yourArmy: "My Stormcast",
      }),
    );
    render(<BattleRecordGameScreen gameId="game-play" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(
      screen.getByRole("button", { name: "Play Rad" }),
    ).toHaveTextContent("My Stormcast");
    expect(
      screen.getByRole("button", { name: "Play Rad" }).querySelector("svg"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Play Alex" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play Rad" }));
    expect(push).not.toHaveBeenCalled();
    const sheet = await screen.findByRole("dialog", { name: "Play Rad" });
    expect(sheet).toHaveTextContent("Play mode · My Stormcast");
    expect(
      screen.getByRole("button", { name: "Close play" }),
    ).toBeInTheDocument();
    expect(sheet.querySelector(".modal-grabber")).not.toBeNull();
    expect(sheet.querySelector("img")).not.toBeNull();

    armyStore.items = [{ ...yourList, name: "Damaged Stormcast" }];
    armyListeners.forEach((notify) => notify());
    expect(
      await screen.findByText("Play mode · Damaged Stormcast"),
    ).toBeInTheDocument();
  });

  it("offers Play when the army name uniquely matches a saved list", async () => {
    const yourList = blankArmy("stormcast-eternals");
    yourList.id = "list-you";
    yourList.name = "My Maggotkin of Nurgle";
    armyStore.items = [yourList];

    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({ yourArmy: "My Maggotkin of Nurgle" }),
    );
    render(<BattleRecordGameScreen gameId="game-name" />);

    await screen.findByRole("heading", { name: /Rad vs Alex/ });
    expect(
      screen.getByRole("button", { name: "Play Rad" }),
    ).toHaveTextContent("My Maggotkin of Nurgle");
    expect(
      screen.getByRole("button", { name: "Play Rad" }).querySelector("svg"),
    ).not.toBeNull();
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

  it("shows Double turn only when last round's second player goes first", async () => {
    const user = userEvent.setup();
    let game = activeFixture({ skipRoundVp: true });
    game = setRoundFirstPlayer(game, 0, "you");
    game = setRoundFirstPlayer(game, 1, "opponent");
    game = setRoundFirstPlayer(game, 2, "opponent");
    vi.mocked(gameStorage.getGame).mockResolvedValue(game);

    render(<BattleRecordGameScreen gameId="game-double" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    await user.click(screen.getByRole("button", { name: "T2" }));
    expect(screen.getByText("Double turn")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "T3" }));
    expect(screen.queryByText("Double turn")).not.toBeInTheDocument();
  });

  it("shows who-went-first when priority tracking is on", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(activeFixture());
    render(<BattleRecordGameScreen gameId="game-1" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    expect(screen.getByText("Who went first")).toBeInTheDocument();
  });

  it("orders turn tabs by who went first and keeps scoring per player", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({
        firstPlayer: "opponent",
        skipRoundVp: true,
        yourTacticCardIds: ["7865-8113-df4e-f70a"],
        opponentTacticCardIds: ["7d3c-b9b7-6412-d44e"],
      }),
    );
    render(<BattleRecordGameScreen gameId="game-tabs" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    const tabs = screen.getByRole("tablist", { name: "Turn players" });
    expect(tabs.className).toContain("ios-tab-underline--spread");
    const tabButtons = within(tabs).getAllByRole("tab");
    expect(tabButtons.map((tab) => tab.textContent)).toEqual(["Alex", "Rad"]);
    await waitFor(() => {
      expect(tabButtons[0]).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByText("Blazing Onslaught")).toBeInTheDocument();
    expect(screen.queryByText("Flanking Firestorm")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rad scored point 1" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Alex scored point 1" }));
    expect(
      screen.getByText(/Turn score · Rad 0 · Alex 3/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Rad" }));
    expect(screen.getByText("Flanking Firestorm")).toBeInTheDocument();
    expect(screen.queryByText("Blazing Onslaught")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rad scored point 1" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("puts the new first player first when who-went-first changes", async () => {
    const user = userEvent.setup();
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({ firstPlayer: "opponent" }),
    );
    render(<BattleRecordGameScreen gameId="game-flip" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    const firstTabs = within(
      screen.getByRole("tablist", { name: "Turn players" }),
    ).getAllByRole("tab");
    expect(firstTabs.map((tab) => tab.textContent)).toEqual(["Alex", "Rad"]);

    await user.click(screen.getByRole("button", { name: "Rad" }));

    const flipped = within(
      screen.getByRole("tablist", { name: "Turn players" }),
    ).getAllByRole("tab");
    expect(flipped.map((tab) => tab.textContent)).toEqual(["Rad", "Alex"]);
    expect(flipped[0]).toHaveAttribute("aria-selected", "true");
  });

  it("still shows you-then-opponent tabs when priority tracking is off", async () => {
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

    render(<BattleRecordGameScreen gameId="game-no-init-tabs" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    const tabs = within(
      screen.getByRole("tablist", { name: "Turn players" }),
    ).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Rad", "Alex"]);
    expect(screen.queryByText("Who went first")).not.toBeInTheDocument();
  });

  it("hides the tactics block when the active player has none", async () => {
    vi.mocked(gameStorage.getGame).mockResolvedValue(
      activeFixture({ skipRoundVp: true }),
    );
    render(<BattleRecordGameScreen gameId="game-no-tac" />);
    await screen.findByRole("heading", { name: /Rad vs Alex/ });

    expect(screen.getByRole("tablist", { name: "Turn players" })).toBeTruthy();
    expect(screen.queryByText(/tactics/i)).not.toBeInTheDocument();
  });
});
