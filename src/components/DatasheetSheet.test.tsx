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

  it("shows every keyword as a pill below the stats card, including faction names", () => {
    render(<DatasheetSheet sheet={unit()} onClose={vi.fn()} />);

    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keywords" })).toBeInTheDocument();

    const keywords = screen.getByRole("list", { name: "Keywords" });
    expect(keywords).toHaveTextContent("HERO");
    expect(keywords).toHaveTextContent("INFANTRY");
    expect(keywords).toHaveTextContent("CASTELITE");
  });

  it("keeps Wizard rank and hides Ward", () => {
    render(
      <DatasheetSheet
        sheet={unit({
          categories: ["HERO", "WIZARD (1)", "WARD (6+)", "CASTELITE"],
        })}
        onClose={vi.fn()}
      />,
    );

    const keywords = screen.getByRole("list", { name: "Keywords" });
    expect(keywords).toHaveTextContent("WIZARD (1)");
    expect(keywords).toHaveTextContent("CASTELITE");
    expect(keywords).not.toHaveTextContent("WARD");
  });
});
