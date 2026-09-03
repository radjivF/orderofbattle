import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogueUnit, UnitAbility } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { SlotLine, SlotEnhancements } from "./RegimentCardSlots";

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

describe("SlotLine campaign extras (extraTrailing present)", () => {
  afterEach(() => cleanup());

  it("does not show EditLinkButton when extraTrailing is present", () => {
    const onReplace = vi.fn();
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onReplace={onReplace}
        onOpenDatasheet={vi.fn()}
        extraTrailing={<span>Campaign extras</span>}
      />,
    );

    expect(screen.queryByRole("button", { name: /Change Liberator-Prime/i })).toBeNull();
  });

  it("shows Change unit in more menu when extraTrailing present and onReplace set", async () => {
    const onReplace = vi.fn();
    const user = userEvent.setup();
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onReplace={onReplace}
        onOpenDatasheet={vi.fn()}
        extraTrailing={<span>Campaign extras</span>}
      />,
    );

    const moreButton = screen.getByRole("button", { name: "More actions" });
    await user.click(moreButton);

    const changeItem = screen.getByRole("menuitem", { name: "Change Liberator-Prime" });
    expect(changeItem).toBeInTheDocument();
    await user.click(changeItem);
    expect(onReplace).toHaveBeenCalledOnce();
  });

  it("shows more menu even when only onReplace is set", () => {
    const onReplace = vi.fn();
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onReplace={onReplace}
        onOpenDatasheet={vi.fn()}
        extraTrailing={<span>Campaign extras</span>}
      />,
    );

    expect(screen.getByRole("button", { name: "More actions" })).toBeInTheDocument();
  });
});

describe("SlotLine matched play (no extraTrailing)", () => {
  afterEach(() => cleanup());

  it("shows EditLinkButton when extraTrailing absent and onReplace set", () => {
    const onReplace = vi.fn();
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onReplace={onReplace}
        onOpenDatasheet={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Change Liberator-Prime/i })).toBeInTheDocument();
  });

  it("does not show Change unit in more menu when extraTrailing absent", async () => {
    const onReplace = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <SlotLine
        unit={unit()}
        points={110}
        playMode={false}
        onReplace={onReplace}
        onRemove={onRemove}
        onOpenDatasheet={vi.fn()}
      />,
    );

    const moreButton = screen.getByRole("button", { name: "More actions" });
    await user.click(moreButton);

    expect(screen.queryByRole("menuitem", { name: /Change/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });
});

describe("EnhancementRow with rules", () => {
  afterEach(() => cleanup());

  const artefactAbilities: UnitAbility[] = [
    {
      name: "Relic Blade",
      kind: "ability",
      timing: "Passive",
      declare: "Declare the bearer",
      effect: "+1 to Attacks characteristic",
      keywords: "",
      castingValue: "",
      chantingValue: "",
    },
  ];

  it("does not show EditLinkButton next to collapse chevron", () => {
    const onPickArtefact = vi.fn();
    render(
      <SlotEnhancements
        selectionId="hero-1"
        unit={unit()}
        playMode={false}
        artefactBearerId="hero-1"
        artefactLabel="Relic Blade"
        artefactAbilities={artefactAbilities}
        onPickArtefact={onPickArtefact}
      />,
    );

    expect(screen.queryByRole("button", { name: /Change Artefact/i })).toBeNull();
  });

  it("shows Change Artefact inside expanded body", async () => {
    const onPickArtefact = vi.fn();
    const user = userEvent.setup();
    render(
      <SlotEnhancements
        selectionId="hero-1"
        unit={unit()}
        playMode={false}
        artefactBearerId="hero-1"
        artefactLabel="Relic Blade"
        artefactAbilities={artefactAbilities}
        onPickArtefact={onPickArtefact}
      />,
    );

    const expandButton = screen.getByText("Artefact · Relic Blade").closest("button");
    expect(expandButton).toBeInTheDocument();
    await user.click(expandButton!);

    const changeButton = screen.getByRole("button", { name: "Change Artefact" });
    expect(changeButton).toBeInTheDocument();
    await user.click(changeButton);
    expect(onPickArtefact).toHaveBeenCalledWith("hero-1");
  });
});

describe("EnhancementRow without rules", () => {
  afterEach(() => cleanup());

  it("keeps title button that calls onPick when no abilities", async () => {
    const onPickArtefact = vi.fn();
    const user = userEvent.setup();
    render(
      <SlotEnhancements
        selectionId="hero-1"
        unit={unit()}
        playMode={false}
        artefactBearerId="hero-1"
        artefactLabel="Simple Relic"
        artefactAbilities={[]}
        onPickArtefact={onPickArtefact}
      />,
    );

    const titleButton = screen.getByText("Artefact · Simple Relic");
    expect(titleButton.tagName).toBe("BUTTON");
    await user.click(titleButton);
    expect(onPickArtefact).toHaveBeenCalledWith("hero-1");
  });
});
