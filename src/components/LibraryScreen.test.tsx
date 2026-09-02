import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import type { ArmyList } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { LibraryScreen } from "./LibraryScreen";

const armyStore = vi.hoisted(() => ({ items: [] as ArmyList[] }));
const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
const listNav = vi.hoisted(() => ({
  goBack: vi.fn(),
  goForward: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => navigation.pathname,
}));

vi.mock("./IosNavSlide", () => ({
  useListNav: () => listNav,
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

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element -- test stub for next/image
    return <img alt={alt} />;
  },
}));

vi.mock("@/lib/storage", () => ({
  subscribeArmies: (onStoreChange: () => void) => {
    onStoreChange();
    return () => {};
  },
  getArmiesSnapshot: () => armyStore.items,
  getArmiesServerSnapshot: () => armyStore.items,
  blankArmy: vi.fn(),
  blankSpearhead: vi.fn(),
  deleteArmy: vi.fn(),
  duplicateArmy: vi.fn(),
  importArmies: vi.fn(),
  saveArmy: vi.fn(),
}));

vi.mock("@/lib/listTransition", () => ({
  rememberListCreate: vi.fn(),
  rememberListNavigation: vi.fn(),
  rememberListOpen: vi.fn(),
  peekListCreateSplash: vi.fn(() => false),
  subscribeListOpenFaction: (cb: () => void) => {
    cb();
    return () => {};
  },
}));

vi.mock("@/lib/librarySort", () => ({
  subscribeLibrarySort: (cb: () => void) => {
    cb();
    return () => {};
  },
  getLibrarySortSnapshot: () => "recent",
  getLibrarySortServerSnapshot: () => "recent",
  setLibrarySortMode: vi.fn(),
  sortLibraryLists: (items: unknown[]) => items,
}));

async function openExportPicker() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByRole("button", { name: "List options" }));
  await user.click(screen.getByRole("button", { name: "Export" }));
  return user;
}

function sheetScroll() {
  const dialog = screen.getByRole("dialog", { name: "List options" });
  return dialog.querySelector(".modal-sheet-scroll");
}

describe("LibraryScreen", () => {
  beforeEach(() => {
    cleanup();
    armyStore.items = [];
    navigation.pathname = "/dashboard";
    listNav.goForward.mockReset();
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

  it("puts options left of My lists, New list on the right, and keeps the empty-library CTA", () => {
    render(<LibraryScreen />);
    const heading = screen.getByRole("heading", { name: "My lists" });
    const options = screen.getByRole("button", { name: "List options" });
    const add = screen.getByRole("button", { name: "New list" });

    expect(options.className).not.toContain("ios-liquid-glass");
    expect(options.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(heading.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByRole("button", { name: "Make your first list" }));
  });

  it("does not show the free-app pitch on My lists", () => {
    render(<LibraryScreen />);
    expect(
      screen.queryByRole("heading", { name: "This app is free. It stays free." }),
    ).toBeNull();
  });

  it("scrolls sort with the import paste field instead of pinning it", async () => {
    render(<LibraryScreen />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(screen.getByRole("button", { name: "List options" }));

    const scroll = sheetScroll();
    expect(scroll).not.toBeNull();
    expect(scroll).toContainElement(screen.getByText("Sort lists by"));
    expect(scroll).toContainElement(
      screen.getByRole("group", { name: "Sort lists" }),
    );
    expect(scroll).toContainElement(
      screen.getByRole("textbox", { name: "List to import" }),
    );
    expect(scroll).toContainElement(
      screen.getByRole("group", { name: "Import or export lists" }),
    );
    expect(scroll).toContainElement(
      screen.getByRole("button", { name: "Choose file" }),
    );
    for (const importControl of screen.getAllByRole("button", { name: "Import" })) {
      expect(scroll).toContainElement(importControl);
    }

    const chooseFile = screen.getByRole("button", { name: "Choose file" });
    const importAction = screen
      .getAllByRole("button", { name: "Import" })
      .find((button) => button.parentElement === chooseFile.parentElement);
    expect(importAction).toBeDefined();
    expect(chooseFile.parentElement?.className).toContain("ios-sheet-actions");
  });

  it("scrolls sort with the empty export picker", async () => {
    render(<LibraryScreen />);
    await openExportPicker();

    const scroll = sheetScroll();
    expect(scroll).not.toBeNull();
    expect(scroll).toContainElement(screen.getByText("Sort lists by"));
    expect(scroll).toContainElement(
      screen.getByText("No lists to export yet."),
    );
  });

  it("tells you to pick a list when Continue is pressed with none selected", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Test list")];
    render(<LibraryScreen />);
    const user = await openExportPicker();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select a list to export it.",
    );
    expect(screen.queryByRole("heading", { name: "Export list" })).toBeNull();
  });

  it("clears the empty-selection alert after a list is chosen and Continue proceeds", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Test list")];
    render(<LibraryScreen />);
    const user = await openExportPicker();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("checkbox", { name: "Export Test list" }));
    expect(screen.queryByRole("alert")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Export list" }));
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("resets export when the sheet is closed instead of offering Back", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Test list")];
    render(<LibraryScreen />);
    const user = await openExportPicker();

    await user.click(screen.getByRole("checkbox", { name: "Export Test list" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Export list" }));

    await user.click(screen.getByRole("button", { name: "Close list options" }));
    expect(screen.queryByRole("dialog", { name: "List options" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "List options" }));
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByText("Choose one or more lists to export."));
    expect(screen.queryByRole("heading", { name: "Export list" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Export Test list" })).not.toBeChecked();
  });

  it("presses the list card when opening list details", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Sigmar host")];
    render(<LibraryScreen />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const open = screen.getByRole("link", { name: "Open Sigmar host" });
    const card = open.closest("article");

    expect(card).not.toHaveAttribute("data-opening");
    await user.click(open);
    expect(card).toHaveAttribute("data-opening", "true");
  });

  it("starts the list slide on press instead of waiting for the route", async () => {
    const list = blankArmy("stormcast-eternals", "Sigmar host");
    armyStore.items = [list];
    render(<LibraryScreen />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(screen.getByRole("link", { name: "Open Sigmar host" }));
    expect(listNav.goForward).toHaveBeenCalledWith(`/lists/${list.id}`);
  });

  it("does not press the card when duplicating", async () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Sigmar host")];
    render(<LibraryScreen />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const card = screen
      .getByRole("link", { name: "Open Sigmar host" })
      .closest("article");

    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(card).not.toHaveAttribute("data-opening");
  });

  it("releases the press when returning to My lists", async () => {
    const list = blankArmy("stormcast-eternals", "Sigmar host");
    armyStore.items = [list];
    const { rerender } = render(<LibraryScreen />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const card = screen
      .getByRole("link", { name: "Open Sigmar host" })
      .closest("article");

    await user.click(screen.getByRole("link", { name: "Open Sigmar host" }));
    expect(card).toHaveAttribute("data-opening", "true");

    navigation.pathname = `/lists/${list.id}`;
    rerender(<LibraryScreen />);
    expect(card).toHaveAttribute("data-opening", "true");

    navigation.pathname = "/dashboard";
    rerender(<LibraryScreen />);
    expect(card).not.toHaveAttribute("data-opening");
  });
});
