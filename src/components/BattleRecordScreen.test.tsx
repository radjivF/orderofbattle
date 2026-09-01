import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createBattleRecord,
  setBattleplan,
  setRoundVp,
  startBattle,
} from "@/engine/gameSession";

const games: ReturnType<typeof createBattleRecord>[] = [];

vi.mock("@/lib/gameStorage", () => ({
  subscribeGames: (listener: () => void) => {
    listener();
    return () => undefined;
  },
  getGamesSnapshot: () => games,
  getGamesServerSnapshot: () => games,
  saveGame: vi.fn(async (game) => game),
  deleteGame: vi.fn(async (id: string) => {
    const index = games.findIndex((game) => game.id === id);
    if (index >= 0) games.splice(index, 1);
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

const listNav = vi.hoisted(() => ({
  goBack: vi.fn(),
  goForward: vi.fn(),
}));

vi.mock("./IosNavSlide", () => ({
  useListNav: () => listNav,
}));

vi.mock("./BattleRecordCreateSheet", () => ({
  BattleRecordCreateSheet: ({
    open,
    onCreated,
  }: {
    open: boolean;
    onCreated: (game: { id: string }) => void;
  }) =>
    open ? (
      <button type="button" onClick={() => onCreated({ id: "game-created" })}>
        Finish create
      </button>
    ) : null,
}));

import { deleteGame } from "@/lib/gameStorage";
import { BattleRecordScreen } from "./BattleRecordScreen";

function seededGame() {
  let game = createBattleRecord({
    yourName: "Rad",
    yourArmy: "Stormcast",
    opponentName: "Alex",
    opponentArmy: "Khorne",
    allowDoubleTurn: true,
  });
  game = { ...game, id: "game-delete-me" };
  game = setBattleplan(game, "into-the-fire");
  game = startBattle(game);
  game = setRoundVp(game, 0, "you", 10);
  game = setRoundVp(game, 0, "opponent", 10);
  return game;
}

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

afterEach(() => {
  cleanup();
  games.length = 0;
  listNav.goForward.mockReset();
  vi.clearAllMocks();
  document.body.removeAttribute("style");
});

describe("BattleRecordScreen", () => {
  it("keeps Battle record on one line, flush with the cards", () => {
    games.push(seededGame());
    render(<BattleRecordScreen />);

    const heading = screen.getByRole("heading", { name: "Battle record" });
    expect(heading.className).toContain("whitespace-nowrap");
    expect(heading.parentElement?.firstElementChild).toBe(heading);

    const titleColumn = heading.parentElement?.parentElement;
    const main = titleColumn?.nextElementSibling;
    expect(titleColumn?.className).toContain("px-3");
    expect(main?.tagName).toBe("MAIN");
    expect(main?.className).toContain("px-3");
    expect(main?.className).not.toContain("px-5");
  });

  it("shows a large score on each game card", () => {
    games.push(seededGame());
    render(<BattleRecordScreen />);

    const score = screen.getByText("10 – 10");
    expect(score.className).toMatch(/text-(2|3|4)xl/);
  });

  it("deletes a game after confirm from the card", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    games.push(seededGame());
    render(<BattleRecordScreen />);

    await user.click(
      screen.getByRole("button", { name: "Delete Rad vs Alex" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Delete battle" });
    expect(
      within(dialog).getByText(/Rad vs Alex/),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: /^Delete$/ }),
    );

    expect(deleteGame).toHaveBeenCalledWith("game-delete-me");
  });

  it("slides the battle in like opening a list", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    games.push(seededGame());
    render(<BattleRecordScreen />);

    await user.click(screen.getByRole("link", { name: /Rad vs Alex/ }));

    expect(listNav.goForward).toHaveBeenCalledWith(
      "/battle-record/game-delete-me",
    );
    expect(screen.getByRole("link", { name: /Rad vs Alex/ })).toHaveAttribute(
      "href",
      "/battle-record/game-delete-me",
    );
  });

  it("opens the battle from the status line, not only the title", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    games.push(seededGame());
    render(<BattleRecordScreen />);

    await user.click(screen.getByText(/In progress/i));

    expect(listNav.goForward).toHaveBeenCalledWith(
      "/battle-record/game-delete-me",
    );
  });

  it("slides a new battle in like opening a card", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<BattleRecordScreen />);

    await user.click(
      screen.getAllByRole("button", { name: "New battle record" })[0]!,
    );
    await user.click(screen.getByRole("button", { name: "Finish create" }));

    expect(listNav.goForward).toHaveBeenCalledWith("/battle-record/game-created");
  });
});
