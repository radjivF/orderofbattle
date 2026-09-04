import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { createId } from "@/lib/id";
import { getFaction } from "@/engine/queries";
import { cleanup, render, screen } from "@/test-utils/render";
import { RegimentCard } from "./RegimentCard";
import { ensureAllFactions } from "@/engine/data/load";

describe("RegimentCard", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  afterEach(() => cleanup());
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

    expect(screen.getByRole("heading", { name: "Arch-Revenant" }).closest("button")?.className).toContain(
      "cursor-pointer",
    );
    expect(screen.getByRole("button", { name: /add unit/i }).className).toContain(
      "cursor-pointer",
    );
  });

  it("opens the datasheet from the hero name", async () => {
    const user = userEvent.setup();
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    const onOpenDatasheet = vi.fn();
    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: createId(), unitId: hero.id, reinforced: false },
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
        onOpenDatasheet={onOpenDatasheet}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("heading", { name: "Arch-Revenant" }));
    expect(onOpenDatasheet).toHaveBeenCalledWith(hero);
  });

  it("puts a pointer cursor on empty artefact and trait picks", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: createId(), unitId: hero.id, reinforced: false },
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
        onPickArtefact={vi.fn()}
        onPickTrait={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Artefact" }).className).toContain(
      "cursor-pointer",
    );
    expect(
      screen.getByRole("button", { name: "Heroic trait" }).className,
    ).toContain("cursor-pointer");
  });

  it("expands a chosen artefact when the title is pressed", async () => {
    const user = userEvent.setup();
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
        artefactBearerId={heroSelectionId}
        artefactLabel="Ar'gath, the King of Blades"
        artefactAbilities={[
          {
            name: "Ar'gath, the King of Blades",
            kind: "Passive",
            timing: "",
            declare: "",
            effect:
              "Ward rolls cannot be made for enemy Heroes while they are in combat with this unit.",
            keywords: "",
            castingValue: "",
            chantingValue: "",
          },
        ]}
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onPickArtefact={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    const title = screen.getByRole("button", {
      name: /Artefact · Ar'gath, the King of Blades/i,
    });
    await user.click(title);
    expect(screen.getByText(/Ward rolls cannot be made/i)).toBeInTheDocument();
  });

  it("opens the artefact picker when a chosen artefact has no rules text", async () => {
    const user = userEvent.setup();
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    const heroSelectionId = createId();
    const onPickArtefact = vi.fn();
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
        artefactBearerId={heroSelectionId}
        artefactLabel="Ar'gath, the King of Blades"
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onPickArtefact={onPickArtefact}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /Artefact · Ar'gath, the King of Blades/i,
      }),
    );
    expect(onPickArtefact).toHaveBeenCalledWith(heroSelectionId);
  });
});
