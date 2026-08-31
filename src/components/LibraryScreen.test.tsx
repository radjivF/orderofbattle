import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { blankArmy } from "@/engine/listFactories";
import type { ArmyList } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { LibraryScreen } from "./LibraryScreen";

const armyStore = vi.hoisted(() => ({ items: [] as ArmyList[] }));

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

describe("LibraryScreen", () => {
  beforeEach(() => {
    cleanup();
    armyStore.items = [];
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
});
