import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@/test-utils/render";
import { BuilderScreen } from "./BuilderScreen";

const { list } = vi.hoisted(() => {
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
  consumeSkipListSplash: vi.fn(() => true),
  getListOpenDisplayNameServerSnapshot: () => null,
  getListOpenDisplayNameSnapshot: () => null,
  getListOpenScourgeServerSnapshot: () => null,
  getListOpenScourgeSnapshot: () => null,
  peekListOpenSplash: vi.fn(() => false),
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
  listBackdropArtSrc: () => null,
  isBackdropArtReady: () => true,
  preloadBackdropArt: vi.fn(() => Promise.resolve()),
}));

describe("BuilderScreen", () => {
  beforeEach(() => {
    cleanup();
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

  it("renders build pane for an existing list", () => {
    render(<BuilderScreen listId={list.id} />);
    expect(screen.getByText("Battle formation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Regiment" })).toBeInTheDocument();
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
