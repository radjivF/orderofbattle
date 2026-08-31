import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogueUnit } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { PickerSheet } from "./PickerSheet";

function unit(overrides: Partial<CatalogueUnit> = {}): CatalogueUnit {
  return {
    id: "unit-1",
    name: "Askurgan Trueblades",
    points: 140,
    hero: false,
    unique: false,
    reinforce: true,
    models: 8,
    categories: [],
    stats: { move: "6\"", health: "2", save: "4+", control: "1" },
    weapons: [],
    abilities: [],
    regimentOptions: [],
    regimentHeroes: [],
    ...overrides,
  };
}

describe("PickerSheet", () => {
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

  it("puts the datasheet control on the left of the row, before points", () => {
    render(
      <PickerSheet
        title="Choose a unit"
        units={[unit()]}
        onPick={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const datasheet = screen.getByRole("button", {
      name: "Askurgan Trueblades datasheet",
    });
    const pick = screen.getByRole("button", { name: /140/ });

    expect(
      datasheet.compareDocumentPosition(pick) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("shows Infantry and Wizard chips, not the faction keyword", () => {
    render(
      <PickerSheet
        title="Choose a unit"
        units={[
          unit({
            categories: ["INFANTRY", "WIZARD", "CASTELITE"],
          }),
        ]}
        onPick={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("INFANTRY")).toBeInTheDocument();
    expect(screen.getByText("WIZARD")).toBeInTheDocument();
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });

  it("hides chips when the unit has no coded keywords", () => {
    render(
      <PickerSheet
        title="Choose a unit"
        units={[unit({ categories: ["CASTELITE"] })]}
        onPick={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("INFANTRY")).toBeNull();
    expect(screen.queryByText("HERO")).toBeNull();
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });
});
