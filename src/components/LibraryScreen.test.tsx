import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import { blankTowArmy } from "@/engine/tow/listFactories";
import type { StoredList } from "@/engine/storedList";
import { cleanup, render, screen } from "@/test-utils/render";
import { LibraryScreen } from "./LibraryScreen";
import { setActiveMenu } from "@/lib/activeMenu";

const armyStore = vi.hoisted(() => ({ items: [] as StoredList[] }));
const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/dashboard",
}));
const listNav = vi.hoisted(() => ({
  goBack: vi.fn(),
  goForward: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
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
  blankTowArmy: vi.fn(),
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
    navigation.replace.mockClear();
    listNav.goForward.mockReset();
    localStorage.clear();
    setActiveMenu("aos");
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

  it("keeps My lists on screen while Battle record is opening", () => {
    setActiveMenu("tow");
    render(<LibraryScreen />);

    expect(screen.getByRole("heading", { name: "My lists" }));
    expect(screen.getByRole("button", { name: "New list" }));
    expect(screen.getByRole("button", { name: "Make your first list" }));
    expect(screen.queryByText(/Open Battle record/i)).toBeNull();

    cleanup();
    navigation.replace.mockClear();
    setActiveMenu("tactics");
    render(<LibraryScreen />);

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "My lists" }));
    expect(screen.queryByText(/Open Battle record from the menu/i)).toBeNull();
    expect(screen.getByRole("button", { name: "New list" }));
    expect(screen.getByRole("button", { name: "List options" }));
  });

  it("does not steal the homepage or My lists after Battle record was last opened", () => {
    setActiveMenu("tactics");
    render(<LibraryScreen />);

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "My lists" }));

    cleanup();
    navigation.pathname = "/";
    navigation.replace.mockClear();
    setActiveMenu("tactics");
    render(<LibraryScreen />);

    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("hides Age of Sigmar lists when Old World is selected", () => {
    armyStore.items = [blankArmy("stormcast-eternals", "Sigmar host")];
    setActiveMenu("tow");
    render(<LibraryScreen />);

    expect(screen.queryByRole("link", { name: "Open Sigmar host" })).toBeNull();
    expect(screen.getByRole("button", { name: "Make your first list" }));
  });

  it("lists Empire armies on the Old World library", () => {
    armyStore.items = [blankTowArmy("the-empire-of-man", "Altdorf")];
    setActiveMenu("tow");
    render(<LibraryScreen />);

    expect(screen.getByRole("link", { name: "Open Altdorf" }));
    expect(screen.getByText("The Empire of Man"));
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
