import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { createId } from "@/lib/id";
import { getFaction } from "@/engine/queries";
import { cleanup, render, screen } from "@/test-utils/render";
import { RegimentCard } from "./RegimentCard";

describe("RegimentCard", () => {
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

    expect(screen.getByRole("heading", { name: "Arch-Revenant" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add unit/i }),
    ).toBeInTheDocument();
  });

  it("lets a Path to Glory Anvil take an artefact and a heroic trait", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: createId(), unitId: anvil.id, reinforced: false },
          units: [],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        pathToGloryPackIds={["ascension"]}
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

    expect(screen.getByRole("button", { name: /^artefact$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^heroic trait$/i }),
    ).toBeInTheDocument();
  });

  it("still hides artefacts on a Unique named hero", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unique = faction.units.find((unit) => unit.name === "Belga the Cystwitch");
    expect(unique?.unique).toBe(true);
    if (!unique) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: createId(), unitId: unique.id, reinforced: false },
          units: [],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        pathToGloryPackIds={["ascension"]}
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

    expect(screen.queryByRole("button", { name: /^artefact$/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^heroic trait$/i }),
    ).not.toBeInTheDocument();
  });

  it("offers Aspects of the Deepwoods on Dryads, not the hero", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const dryads = faction.units.find((unit) => unit.name === "Dryads");
    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === "aspects-of-the-deepwoods",
    );
    expect(hero && dryads && table).toBeTruthy();
    if (!hero || !dryads || !table) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [{ id: "dryads-1", unitId: dryads.id, reinforced: false }],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        specialTables={[table]}
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onPickSpecial={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /aspects of the deepwoods/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /aspects of the deepwoods/i })).toHaveLength(1);
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

  it("keeps Path, renown, wounds, and scars inside the unit until expanded", async () => {
    const user = userEvent.setup();
    const faction = getFaction("maggotkin-of-nurgle");
    const festus = faction?.units.find((unit) => unit.name === "Doktor Festus");
    expect(festus).toBeTruthy();
    if (!faction || !festus) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: {
            id: "festus-1",
            unitId: festus.id,
            reinforced: false,
            pathToGlory: {
              renown: 5,
              pathId: "path-of-the-attacker",
              pathOptionIds: ["4564-988b-2147-1ba8"],
              battleWoundId: null,
              scarId: null,
              anvilRankId: null,
              anvilPickIds: [],
            },
          },
          units: [],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        pathToGloryPackIds={["ascension", "ravaged-coast"]}
        showBattleWounds
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
        onPatchSelection={vi.fn()}
      />,
    );

    const extras = screen.getByRole("button", { name: /campaign extras/i });
    expect(extras).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Path of the Attacker")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /full-on attack/i })).toBeNull();
    expect(screen.queryByLabelText(/^renown$/i)).toBeNull();
    expect(screen.queryByLabelText(/^battle wound$/i)).toBeNull();
    expect(screen.queryByLabelText(/^scar$/i)).toBeNull();

    await user.click(extras);

    expect(extras).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /full-on attack/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^renown$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^battle wound$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^scar$/i)).toBeInTheDocument();
  });

  it("opens the datasheet with picked Path abilities on Doktor Festus", async () => {
    const user = userEvent.setup();
    const onOpenDatasheet = vi.fn();
    const faction = getFaction("maggotkin-of-nurgle");
    const festus = faction?.units.find((unit) => unit.name === "Doktor Festus");
    expect(festus).toBeTruthy();
    if (!faction || !festus) return;

    render(
      <RegimentCard
        regiment={{
          id: "reg-1",
          hero: {
            id: "festus-1",
            unitId: festus.id,
            reinforced: false,
            pathToGlory: {
              renown: 5,
              pathId: "path-of-the-attacker",
              pathOptionIds: ["4564-988b-2147-1ba8"],
              battleWoundId: null,
              scarId: null,
              anvilRankId: null,
              anvilPickIds: [],
            },
          },
          units: [],
        }}
        faction={faction}
        isGeneral
        canBeGeneral
        slotCap={4}
        selected
        playMode={false}
        pathToGloryPackIds={["ascension"]}
        onSelect={vi.fn()}
        onMakeGeneral={vi.fn()}
        onPickHero={vi.fn()}
        onPickUnit={vi.fn()}
        onOpenDatasheet={onOpenDatasheet}
        onToggleReinforce={vi.fn()}
        onDuplicateUnit={vi.fn()}
        onRemoveUnit={vi.fn()}
        onRemoveRegiment={vi.fn()}
        onPatchSelection={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /doktor festus datasheet/i }),
    );

    expect(onOpenDatasheet).toHaveBeenCalled();
    const sheet = onOpenDatasheet.mock.calls[0]?.[0] as { abilities: { name: string; effect: string }[] };
    expect(sheet.abilities.some((ability) => ability.name === "Full-On Attack")).toBe(
      true,
    );
    expect(
      sheet.abilities.find((ability) => ability.name === "Full-On Attack")?.effect,
    ).toMatch(/add 1 to hit rolls/i);
  });
});
