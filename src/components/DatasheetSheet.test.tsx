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

describe("DatasheetSheet keywords", () => {
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

  it("shows each keyword as its own tag, not a comma list", () => {
    render(<DatasheetSheet sheet={unit()} onClose={vi.fn()} />);

    const keywords = screen.getByRole("list", { name: "Keywords" });
    expect(keywords).toHaveTextContent("HERO");
    expect(keywords).toHaveTextContent("INFANTRY");
    expect(keywords).toHaveTextContent("CASTELITE");
    expect(screen.queryByText("HERO, INFANTRY, CASTELITE")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("hides the keywords block when there are none", () => {
    render(
      <DatasheetSheet sheet={unit({ categories: [] })} onClose={vi.fn()} />,
    );

    expect(screen.queryByRole("heading", { name: "Keywords" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Keywords" })).toBeNull();
  });
});
