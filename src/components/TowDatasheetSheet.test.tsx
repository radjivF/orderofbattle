import { afterEach, describe, expect, it, vi } from "vitest";
import { getTowFaction } from "@/engine/tow/queries";
import { cleanup, render, screen, within } from "@/test-utils/render";
import { TowDatasheetSheet } from "./TowDatasheetSheet";

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

describe("TowDatasheetSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists unit-only special rules apart from common Old World rules", async () => {
    stubMatchMedia();
    const dryads = getTowFaction("wood-elf-realms")?.units.find(
      (unit) => unit.id === "dryads",
    );
    expect(dryads).toBeTruthy();
    render(<TowDatasheetSheet unit={dryads!} onClose={vi.fn()} />);

    const sheet = screen.getByRole("dialog", { name: "Dryads datasheet" });
    const unitHeading = within(sheet).getByRole("heading", {
      name: "Special rules",
    });
    const commonHeading = within(sheet).getByRole("heading", {
      name: "Common rules",
    });
    expect(
      unitHeading.compareDocumentPosition(commonHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const unitSection = unitHeading.closest("section");
    const commonSection = commonHeading.closest("section");
    expect(unitSection).toBeTruthy();
    expect(commonSection).toBeTruthy();
    expect(within(unitSection!).getByText("Tree Spirit"));
    expect(within(unitSection!).queryByText("Fear")).toBeNull();
    expect(within(commonSection!).getByText("Fear"));
    expect(within(commonSection!).queryByText("Tree Spirit")).toBeNull();
  });
});
