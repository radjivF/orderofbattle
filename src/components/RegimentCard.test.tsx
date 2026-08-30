import { describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/id";
import { getFaction } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import { RegimentCard } from "./RegimentCard";

describe("RegimentCard", () => {
  it("renders hero name and add-unit action in build mode", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    const heroSelectionId = createId();
    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Arch-Revenant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add unit/i })).toBeInTheDocument();
  });
});
