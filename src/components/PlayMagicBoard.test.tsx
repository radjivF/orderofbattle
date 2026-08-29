import { describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { getFaction } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import { PlayMagicBoard } from "./PlayMagicBoard";

describe("PlayMagicBoard", () => {
  it("shows spell lores for matched Stormcast lists", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "reg-1",
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
    };

    render(
      <PlayMagicBoard
        list={list}
        faction={faction}
        onOpenSheet={vi.fn()}
        onBindPower={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /spells/i })).toBeInTheDocument();
  });
});
