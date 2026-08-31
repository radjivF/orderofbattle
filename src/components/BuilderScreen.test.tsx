import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { act, cleanup, render, screen } from "@/test-utils/render";
import {
  LIST_LANDING_CONTENT_HIDDEN_CLASS,
  LIST_LANDING_CONTENT_VISIBLE_CLASS,
  LIST_OPEN_SPLASH_MS,
} from "@/lib/builderUi";
import { BuilderScreen } from "./BuilderScreen";

const { list, art, listOpen } = vi.hoisted(() => {
  const now = Date.now();
  return {
    list: {
      id: "builder-test-list",
      name: "Test list",
      factionId: "stormcast-eternals",
      pointsCap: 2000,
      formationId: null,
      spellLoreId: null,
      prayerLoreId: null,
      manifestationLoreId: null,
      artefact: null,
      heroicTrait: null,
      monstrousTrait: null,
      visionOfFate: null,
      specialEnhancements: [],
      battleTacticCardIds: [],
      battleTacticStage: {},
      scourgeRealm: "aqshy",
      generalRegimentId: null,
      regiments: [],
      auxiliaries: [],
      regimentOfRenown: null,
      powerBinds: {},
      kind: "matched" as const,
      spearheadId: null,
      regimentAbilityId: null,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    },
    art: {
      src: null as string | null,
      ready: true,
      preload: vi.fn(() => Promise.resolve()),
    },
    listOpen: {
      skipSplash: true,
      splashRequested: false,
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockLists = [list];

vi.mock("@/lib/storage", () => ({
  subscribeArmies: () => () => {},
  getArmiesSnapshot: () => mockLists,
  getArmiesServerSnapshot: () => mockLists,
  recordArmyOpened: vi.fn(),
  saveArmy: vi.fn(),
  appendRegimentWithHero: vi.fn(),
}));

vi.mock("@/lib/listTransition", () => ({
  getListOpenFactionServerSnapshot: () => null,
  getListOpenFactionSnapshot: () => null,
  clearListOpenSplash: vi.fn(),
  clearListCreateSplash: vi.fn(),
  consumeSkipListSplash: () => listOpen.skipSplash,
  getListOpenDisplayNameServerSnapshot: () => null,
  getListOpenDisplayNameSnapshot: () => null,
  getListOpenScourgeServerSnapshot: () => null,
  getListOpenScourgeSnapshot: () => null,
  peekListOpenSplash: () => listOpen.splashRequested,
  peekListNavigationDirection: vi.fn(() => null),
  subscribeListOpenFaction: () => () => {},
}));

vi.mock("./ListFlowShell", () => ({
  useListFlowChrome: () => ({
    setBuilderChrome: vi.fn(),
    setLibraryChrome: vi.fn(),
  }),
  useListFlowDecor: () => ({
    setDecor: vi.fn(),
  }),
}));

vi.mock("@/lib/factionArt", () => ({
  listBackdropArtSrc: () => art.src,
  isBackdropArtReady: () => art.ready,
  preloadBackdropArt: () => art.preload(),
}));

function pendingArt() {
  art.src = "/factions/stormcast-eternals.webp";
  art.ready = false;
  art.preload.mockReturnValue(new Promise(() => {}));
}

function landing() {
  const node = screen
    .getByRole("button", { name: "+ Regiment" })
    .closest(".transition-opacity");
  expect(node).toBeTruthy();
  return node as HTMLElement;
}

describe("BuilderScreen", () => {
  beforeEach(() => {
    cleanup();
    art.src = null;
    art.ready = true;
    art.preload.mockReset();
    art.preload.mockResolvedValue(undefined);
    listOpen.skipSplash = true;
    listOpen.splashRequested = false;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders build pane for an existing list", () => {
    render(<BuilderScreen listId={list.id} />);
    expect(screen.getByText("Battle formation")).toBeInTheDocument();
    expect(landing()).toHaveClass(LIST_LANDING_CONTENT_VISIBLE_CLASS);
  });

  it("shows the list before backdrop art finishes loading", () => {
    pendingArt();

    render(<BuilderScreen listId={list.id} />);

    expect(landing()).toHaveClass(LIST_LANDING_CONTENT_VISIBLE_CLASS);
    expect(landing()).not.toHaveClass(LIST_LANDING_CONTENT_HIDDEN_CLASS);
  });

  it("still shows the list when backdrop preload fails", () => {
    pendingArt();
    const failed = Promise.reject(new Error("art failed"));
    void failed.catch(() => {});
    art.preload.mockReturnValue(failed);

    render(<BuilderScreen listId={list.id} />);

    expect(landing()).toHaveClass(LIST_LANDING_CONTENT_VISIBLE_CLASS);
  });

  it("hides the opening splash after the minimum time even if art is still loading", async () => {
    pendingArt();
    listOpen.skipSplash = false;
    listOpen.splashRequested = true;
    vi.useFakeTimers();

    render(<BuilderScreen listId={list.id} />);
    expect(landing()).toHaveClass(LIST_LANDING_CONTENT_HIDDEN_CLASS);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LIST_OPEN_SPLASH_MS);
    });

    expect(landing()).toHaveClass(LIST_LANDING_CONTENT_VISIBLE_CLASS);
    expect(landing()).not.toHaveClass(LIST_LANDING_CONTENT_HIDDEN_CLASS);
  });

  it("opens the hero picker when Add a regiment to begin is tapped", async () => {
    const user = userEvent.setup();

    render(<BuilderScreen listId={list.id} />);
    await user.click(
      screen.getByRole("button", { name: /Add a regiment to begin/i }),
    );

    expect(
      screen.getByRole("dialog", { name: "Choose a hero" }),
    ).toBeInTheDocument();
  });

  it("still opens the hero picker from + Regiment", async () => {
    const user = userEvent.setup();

    render(<BuilderScreen listId={list.id} />);
    await user.click(screen.getByRole("button", { name: "+ Regiment" }));

    expect(
      screen.getByRole("dialog", { name: "Choose a hero" }),
    ).toBeInTheDocument();
  });
});
