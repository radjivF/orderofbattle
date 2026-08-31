import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogueUnit } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { SlotLine } from "./RegimentCardSlots";

function unit(overrides: Partial<CatalogueUnit> = {}): CatalogueUnit {
  return {
    id: "unit-1",
    name: "Liberator-Prime",
    points: 110,
    hero: true,
    unique: false,
    reinforce: false,
    models: 1,
    categories: ["HERO", "INFANTRY", "WIZARD", "FLY", "CASTELITE"],
    stats: { move: "5\"", health: "5", save: "3+", control: "2" },
    weapons: [],
    abilities: [],
    regimentOptions: [],
    regimentHeroes: [],
    ...overrides,
  };
}

describe("SlotLine keyword chips", () => {
  afterEach(() => cleanup());

  it("does not show keywords on the list row", () => {
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onOpenDatasheet={vi.fn()}
      />,
    );

    expect(screen.queryByText("HERO")).toBeNull();
    expect(screen.queryByText("INFANTRY")).toBeNull();
    expect(screen.queryByText("WIZARD")).toBeNull();
    expect(screen.queryByText("FLY")).toBeNull();
    expect(screen.getByText("Liberator-Prime")).toBeInTheDocument();
  });
});
