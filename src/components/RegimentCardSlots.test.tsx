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

  it("shows coded keywords under the name and hides the faction", () => {
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onOpenDatasheet={vi.fn()}
      />,
    );

    expect(screen.getByText("HERO")).toBeInTheDocument();
    expect(screen.getByText("INFANTRY")).toBeInTheDocument();
    expect(screen.getByText("WIZARD")).toBeInTheDocument();
    expect(screen.getByText("FLY")).toBeInTheDocument();
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });

  it("hides chips when the unit has no coded keywords", () => {
    render(
      <SlotLine
        unit={unit({ categories: ["CASTELITE"] })}
        points={110}
        playMode={false}
        onOpenDatasheet={vi.fn()}
      />,
    );

    expect(screen.queryByText("HERO")).toBeNull();
    expect(screen.queryByText("INFANTRY")).toBeNull();
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });
});
