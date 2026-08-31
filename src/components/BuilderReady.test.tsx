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

  it("leaves the empty-list warning as status, not a control", () => {
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

    expect(screen.getByText("Add a regiment to begin.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Add a regiment to begin/i }),
    ).toBeNull();
  });
});
