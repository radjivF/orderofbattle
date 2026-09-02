import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { addTowUnit, blankTowArmy } from "@/engine/tow/listFactories";
import type { TowList } from "@/engine/tow/types";
import { cleanup, render, screen, within } from "@/test-utils/render";
import { TowBuilderScreen } from "./TowBuilderScreen";

const armyStore = vi.hoisted(() => {
  const store: {
    list: TowList | null;
    items: TowList[];
    set: (list: TowList | null) => void;
  } = {
    list: null,
    items: [],
    set(list) {
      store.list = list;
      store.items = list ? [list] : [];
    },
  };
  return store;
});

const chrome = vi.hoisted(() => ({
  enterPlay: null as (() => void) | null,
}));

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    onStoreChange();
    return () => {};
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => armyStore.items,
  saveArmy: vi.fn(async (list: TowList) => {
    armyStore.set(list);
    return list;
  }),
}));

vi.mock("./ListFlowShell", () => ({
  useListFlowChrome: () => ({
    setBuilderChrome: (
      next: { enterPlay?: () => void } | null,
    ) => {
      chrome.enterPlay = next?.enterPlay ?? null;
    },
    setLibraryChrome: vi.fn(),
  }),
  useListFlowDecor: () => ({
    setDecor: vi.fn(),
  }),
}));

function stubMatchMedia() {
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
}

function renderList(list: TowList) {
  armyStore.set(list);
  return render(<TowBuilderScreen listId={list.id} />);
}

async function expandUnit(name: string) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByRole("button", { name: `Expand ${name}` }));
  return user;
}

describe("TowBuilderScreen", () => {
  afterEach(() => cleanup());

  it("keeps Old World force-org headings and skips AoS play boards", () => {
    stubMatchMedia();
    renderList(blankTowArmy("the-empire-of-man", "Altdorf host", 2000));

    expect(screen.getByRole("heading", { name: "Characters" }));
    expect(screen.getByRole("heading", { name: "Core" }));
    expect(screen.getByRole("heading", { name: "Special" }));
    expect(screen.getByRole("heading", { name: "Rare" }));
    expect(screen.queryByRole("tab", { name: "Phases" })).toBeNull();
    expect(screen.queryByText("Battle formation")).toBeNull();
  });

  it("offers Options for the points limit, without AoS lores or tactics", async () => {
    stubMatchMedia();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = renderList(
      blankTowArmy("the-empire-of-man", "Altdorf host", 2000),
    );

    const options = screen.getByRole("button", { name: "Options" });
    expect(options).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Points"));
    expect(screen.queryByText("Spell lore")).toBeNull();
    expect(screen.queryByText("Battle tactics")).toBeNull();
    expect(screen.queryByText("Points limit")).toBeNull();

    await user.click(options);
    expect(options).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Points limit"));

    await user.click(screen.getByRole("button", { name: "1,500" }));
    rerender(<TowBuilderScreen listId={armyStore.list!.id} />);

    expect(armyStore.list?.pointsCap).toBe(1500);
  });

  it("adds State Troops from Core with a model count on the slot", async () => {
    stubMatchMedia();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = renderList(
      blankTowArmy("the-empire-of-man", "Altdorf host", 2000),
    );

    await user.click(screen.getByRole("button", { name: "+ Core" }));
    await user.click(screen.getByRole("button", { name: "State Troops" }));
    rerender(<TowBuilderScreen listId={armyStore.list!.id} />);

    expect(screen.getByRole("heading", { name: "State Troops" }));
    expect(screen.getByLabelText("State Troops models")).toHaveTextContent(
      "10",
    );
    expect(
      screen.getByRole("button", { name: "Expand State Troops" }),
    );
    expect(screen.queryByRole("combobox", { name: "Weapons" })).toBeNull();
  });

  it("shows a character as a parchment regiment card with a profile, not a checkbox wall", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Altdorf host", 2000),
      "captain-of-the-empire",
    );
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);
    const user = await expandUnit("Captain of the Empire");

    expect(
      screen.getByRole("heading", { name: "Captain of the Empire" }),
    );
    expect(screen.getByText(/WS 5/));
    expect(screen.getByText(/W 2/));
    expect(screen.getByText("General"));
    expect(screen.queryByRole("button", { name: "General" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove Captain of the Empire" }),
    );
    expect(
      screen.queryByRole("checkbox", { name: /Great Weapon/i }),
    ).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Weapons" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Equip" }));
    expect(
      screen.getByRole("dialog", { name: "Captain of the Empire forge" }),
    );
    await user.click(screen.getByRole("button", { name: /Great Weapon/i }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    rerender(<TowBuilderScreen listId={list!.id} />);

    expect(screen.getByText(/Great Weapon/));
  });

  it("treats Crossbow or Handgun as one Weapons pick, not two checkboxes", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "state-missile-troops",
    );
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);
    const user = await expandUnit("State Missile Troops");

    expect(screen.getByRole("checkbox", { name: /Musician/ }));
    expect(screen.queryByRole("checkbox", { name: /Crossbow/ })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Handgun/ })).toBeNull();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Weapons" }),
      "handgun",
    );
    rerender(<TowBuilderScreen listId={list!.id} />);

    expect(screen.getByRole("combobox", { name: "Weapons" })).toHaveValue(
      "handgun",
    );
    expect(screen.queryByRole("checkbox", { name: /Handgun/ })).toBeNull();
  });

  it("names a second character as general from the card kicker", async () => {
    stubMatchMedia();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const withCaptain = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "captain-of-the-empire",
    );
    const list = addTowUnit(withCaptain!, "grand-master");
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);

    await user.click(screen.getByRole("button", { name: "Make general" }));
    rerender(<TowBuilderScreen listId={list!.id} />);

    expect(screen.getAllByText("General")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Make general" }));
    expect(screen.queryByRole("button", { name: "General" })).toBeNull();
  });

  it("puts model − count + beside the title, and delete only inside expand", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "teutogen-guard",
    );
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    const datasheet = screen.getByRole("button", {
      name: "Teutogen Guard datasheet",
    });
    const expand = screen.getByRole("button", {
      name: "Expand Teutogen Guard",
    });
    const fewer = screen.getByRole("button", { name: "Fewer Teutogen Guard" });
    const more = screen.getByRole("button", { name: "More Teutogen Guard" });
    expect(
      datasheet.compareDocumentPosition(expand) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      expand.compareDocumentPosition(fewer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      fewer.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByLabelText("Teutogen Guard models")).toHaveTextContent(
      "5",
    );
    expect(
      screen.queryByRole("button", { name: "Remove Teutogen Guard" }),
    ).toBeNull();

    await user.click(more);
    rerender(<TowBuilderScreen listId={list!.id} />);
    expect(screen.getByLabelText("Teutogen Guard models")).toHaveTextContent(
      "6",
    );

    await user.click(
      screen.getByRole("button", { name: "Expand Teutogen Guard" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remove Teutogen Guard" }),
    );
    expect(screen.getByRole("heading", { name: "Teutogen Guard" }));
    await user.click(
      screen.getByRole("button", { name: "Confirm remove Teutogen Guard" }),
    );
    rerender(<TowBuilderScreen listId={list!.id} />);
    expect(screen.queryByRole("heading", { name: "Teutogen Guard" })).toBeNull();
  });

  it("hides character delete until the card is expanded", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("wood-elf-realms", "Athel Loren", 2000),
      "orion-the-king-in-the-woods",
    );
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    expect(
      screen.getByRole("button", {
        name: "Orion, the King in the Woods datasheet",
      }),
    );
    expect(
      screen.queryByRole("button", {
        name: "Remove Orion, the King in the Woods",
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: "Fewer Orion, the King in the Woods",
      }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "Expand Orion, the King in the Woods",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Remove Orion, the King in the Woods",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Confirm remove Orion, the King in the Woods",
      }),
    );
    rerender(<TowBuilderScreen listId={list!.id} />);
    expect(
      screen.queryByRole("heading", {
        name: "Orion, the King in the Woods",
      }),
    ).toBeNull();
  });

  it("starts units collapsed with name, profile, models, and points", () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "teutogen-guard",
    );
    expect(list).toBeTruthy();
    renderList(list!);

    expect(screen.getByRole("heading", { name: "Teutogen Guard" }));
    expect(screen.getByText(/WS 4/));
    expect(screen.getByLabelText("Teutogen Guard models")).toHaveTextContent(
      "5",
    );
    expect(screen.getByText(/65 pts/));
    expect(
      screen.getByRole("button", { name: "Expand Teutogen Guard" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox", { name: /First Knight/ })).toBeNull();
  });

  it("puts command options on one wrapping row when expanded", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "teutogen-guard",
    );
    expect(list).toBeTruthy();
    renderList(list!);
    await expandUnit("Teutogen Guard");

    expect(screen.getByRole("checkbox", { name: /Standard Bearer/ }));
    expect(screen.getByRole("checkbox", { name: /Musician/ }));
    expect(screen.getByRole("checkbox", { name: /First Knight/ }));
    const card = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "TowUnitCard.tsx"),
      "utf8",
    );
    expect(card).toContain("flex-wrap");
  });

  it("opens a State Troops datasheet with special rules, like Age of Sigmar", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "state-troops",
    );
    expect(list).toBeTruthy();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderList(list!);

    await user.click(
      screen.getByRole("button", { name: "State Troops datasheet" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "State Troops datasheet",
    });
    expect(
      within(dialog).getByRole("heading", { name: "State Troops" }),
    );
    expect(within(dialog).getByText("Close Order"));
    const rule = within(dialog).getByRole("button", { name: /Close Order/i });
    expect(rule).toHaveAttribute("aria-expanded", "false");
    await user.click(rule);
    expect(within(dialog).getByText(/Close Order formation/i));
    expect(screen.queryByRole("tab", { name: "Phases" })).toBeNull();
  });

  it("opens the datasheet from Play instead of listing every rule on the card", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "state-troops",
    );
    expect(list).toBeTruthy();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderList(list!);

    act(() => {
      chrome.enterPlay?.();
    });

    expect(screen.queryByRole("button", { name: /Close Order/i })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "State Troops datasheet" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "State Troops datasheet",
    });
    const rule = within(dialog).getByRole("button", { name: /Close Order/i });
    expect(rule).toHaveAttribute("aria-expanded", "false");
    await user.click(rule);
    expect(within(dialog).getByText(/Close Order formation/i));
    expect(screen.queryByRole("tab", { name: "Phases" })).toBeNull();
  });

  it("hides Join on Orion because he cannot leave his hounds", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("wood-elf-realms", "Athel Loren", 2000),
      "orion-the-king-in-the-woods",
    );
    expect(list).toBeTruthy();
    renderList(list!);
    await expandUnit("Orion, the King in the Woods");

    expect(screen.queryByRole("button", { name: "Join" })).toBeNull();
  });

  it("offers Join on an Empire captain who can join a regiment", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "captain-of-the-empire",
    );
    expect(list).toBeTruthy();
    renderList(list!);
    await expandUnit("Captain of the Empire");

    expect(screen.getByRole("button", { name: "Join" }));
  });

  it("lets a Glade Lord take a Forest Dragon from the Equip forge with mount stats", async () => {
    stubMatchMedia();
    const list = addTowUnit(
      blankTowArmy("wood-elf-realms", "Athel Loren", 2000),
      "glade-lord",
    );
    expect(list).toBeTruthy();
    const { rerender } = renderList(list!);
    const user = await expandUnit("Glade Lord");

    expect(screen.queryByRole("combobox", { name: "Mounts" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Equip" }));

    const forge = screen.getByRole("dialog", { name: "Glade Lord forge" });
    expect(within(forge).getByRole("heading", { name: "Mounts" }));
    await user.click(
      within(forge).getByRole("button", { name: /^Forest Dragon/ }),
    );
    expect(within(forge).getByText(/Forest Dragon profile/i));
    expect(within(forge).getAllByText(/T \(\+3\)/).length).toBeGreaterThan(0);
    expect(within(forge).getAllByText(/Terror/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Done" }));
    rerender(<TowBuilderScreen listId={list!.id} />);
    expect(screen.getByText(/Forest Dragon/));
  });

  it("tracks character wounds and troop models with the AoS play stepper", () => {
    stubMatchMedia();
    const withCaptain = addTowUnit(
      blankTowArmy("the-empire-of-man", "Host", 2000),
      "captain-of-the-empire",
    );
    const list = addTowUnit(withCaptain!, "state-troops");
    expect(list).toBeTruthy();
    renderList(list!);

    act(() => {
      chrome.enterPlay?.();
    });

    expect(screen.getByText(/hp/i));
    expect(screen.getByText(/models/i));
    expect(screen.queryByText(/Wounds \d/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Options" })).toBeNull();
  });

  it("uses parchment regiment cards instead of dark ink panels", () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const card = readFileSync(path.join(dir, "TowUnitCard.tsx"), "utf8");
    expect(card).toContain("bg-parchment");
    expect(card).toContain("text-parchment-ink");
    expect(card).not.toContain("bg-ink-raised");
    const screen = readFileSync(path.join(dir, "TowBuilderScreen.tsx"), "utf8");
    expect(screen).toContain("TOW_CATEGORY_ROW_CLASS");
    expect(screen).toContain("TOW_CATEGORY_HEADING_CLASS");
  });
});
