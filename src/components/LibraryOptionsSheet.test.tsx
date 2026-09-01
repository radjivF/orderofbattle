import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import { LibraryOptionsSheet } from "./LibraryOptionsSheet";

vi.mock("@/lib/storage", () => ({
  importArmies: vi.fn(),
}));

describe("LibraryOptionsSheet", () => {
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

  it("does not put Battle record in list options", () => {
    render(
      <LibraryOptionsSheet
        open
        lists={[]}
        sortMode="recent"
        onSortModeChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /Battle record/i }),
    ).toBeNull();
    expect(screen.queryByText("Games")).toBeNull();
    expect(screen.getByRole("dialog", { name: "List options" }));
    expect(screen.getByText("Sort lists by"));
  });
});
