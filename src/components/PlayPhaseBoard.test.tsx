import { describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { getFaction } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import { PlayPhaseBoard } from "./PlayPhaseBoard";

describe("PlayPhaseBoard", () => {
  it("shows core play phase tabs", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
    };

    render(
      <PlayPhaseBoard list={list} faction={faction} onOpenSheet={vi.fn()} />,
    );

    expect(screen.getByRole("tablist", { name: "Battle phases" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Army" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hero" })).toBeInTheDocument();
  });
});
