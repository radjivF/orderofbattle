import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils/render";
import { LibraryScreen } from "./LibraryScreen";

const lists: never[] = [];

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
  getArmiesSnapshot: () => lists,
  getArmiesServerSnapshot: () => lists,
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

vi.mock("./ListFlowShell", () => ({
  useListFlowChrome: () => ({
    setBuilderChrome: vi.fn(),
    setLibraryChrome: vi.fn(),
  }),
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

describe("LibraryScreen", () => {
  it("shows empty-library call to action without page-title chrome", () => {
    render(<LibraryScreen />);
    expect(screen.queryByRole("heading", { name: "My lists" })).toBeNull();
    expect(screen.queryByRole("button", { name: "List options" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Make your first list" }),
    ).toBeInTheDocument();
  });
});
