import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { getFaction } from "@/engine/queries";
import { cleanup, render, screen } from "@/test-utils/render";
import { BuilderReady } from "./BuilderReady";

vi.mock("./ListFlowShell", () => ({
  useListFlowChrome: () => ({
    setBuilderChrome: vi.fn(),
    setLibraryChrome: vi.fn(),
  }),
  useListFlowDecor: () => ({
    setDecor: vi.fn(),
  }),
}));

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  return {
    ...actual,
    saveArmy: vi.fn(async () => {}),
  };
});

function khorneListWithHero() {
  const faction = getFaction("blades-of-khorne");
  expect(faction).toBeTruthy();
  if (!faction) {
    throw new Error("missing blades-of-khorne catalogue");
  }
  const hero = faction.units.find(
    (unit) => unit.hero && !unit.categories.includes("WIZARD"),
  );
  expect(hero).toBeTruthy();
  if (!hero) {
    throw new Error("missing khorne hero");
  }
  const list = {
    ...blankArmy(faction.id),
    scourgeRealm: "aqshy" as const,
    battleTacticCardIds: [],
    generalRegimentId: "reg-1",
    regiments: [
      {
        id: "reg-1",
        hero: { id: createId(), unitId: hero.id, reinforced: false },
        units: [],
      },
    ],
  };
  return { faction, list };
}

describe("BuilderReady issue banner", () => {
  beforeEach(() => {
    cleanup();
    HTMLElement.prototype.scrollIntoView = vi.fn();
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

  it("opens Options when the battle tactic warning is tapped", async () => {
    const user = userEvent.setup();
    const { faction, list } = khorneListWithHero();
    render(<BuilderReady list={list} faction={faction} />);

    const banner = screen.getByRole("button", {
      name: /Pick up to 2 battle tactic cards/i,
    });
    await user.click(banner);

    expect(
      screen.getByRole("button", { name: /Options/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Battle tactic cards \(pick up to 2\)/i),
    ).toBeInTheDocument();
  });

  it("opens the hero picker from the empty-list warning, not Options", async () => {
    const user = userEvent.setup();
    const faction = getFaction("blades-of-khorne");
    expect(faction).toBeTruthy();
    if (!faction) {
      throw new Error("missing blades-of-khorne catalogue");
    }
    render(
      <BuilderReady
        list={{ ...blankArmy(faction.id), battleTacticCardIds: [] }}
        faction={faction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Add a regiment to begin/i }),
    );

    expect(
      screen.getByRole("dialog", { name: "Choose a hero" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Options/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
