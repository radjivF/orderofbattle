import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogueUnit } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { DatasheetSheet } from "./DatasheetSheet";

function unit(overrides: Partial<CatalogueUnit> = {}): CatalogueUnit {
  return {
    id: "unit-1",
    name: "Liberator-Prime",
    points: 110,
    hero: true,
    unique: false,
    reinforce: false,
    models: 1,
    categories: ["HERO", "INFANTRY", "CASTELITE"],
    stats: { move: "5\"", health: "5", save: "3+", control: "2" },
    weapons: [],
    abilities: [],
    regimentOptions: [],
    regimentHeroes: [],
    ...overrides,
  };
}

describe("DatasheetSheet unit type", () => {
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

  it("shows type chips with the stats, not a Keywords heading", () => {
    render(<DatasheetSheet sheet={unit()} onClose={vi.fn()} />);

    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Keywords" })).toBeNull();
    expect(screen.queryByText("Keywords")).toBeNull();

    const types = screen.getByRole("list", { name: "Unit type" });
    expect(types).toHaveTextContent("HERO");
    expect(types).toHaveTextContent("INFANTRY");
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });

  it("hides type chips when there are no battlefield types", () => {
    render(
      <DatasheetSheet sheet={unit({ categories: ["CASTELITE"] })} onClose={vi.fn()} />,
    );

    expect(screen.queryByRole("list", { name: "Unit type" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Keywords" })).toBeNull();
  });
});
