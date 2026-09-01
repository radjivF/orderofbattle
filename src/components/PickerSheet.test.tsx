import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { CatalogueUnit, UnitAbility } from "@/engine/types";
import { cleanup, render, screen } from "@/test-utils/render";
import { ChoiceSheet, PickerSheet } from "./PickerSheet";

function unit(overrides: Partial<CatalogueUnit> = {}): CatalogueUnit {
  return {
    id: "unit-1",
    name: "Askurgan Trueblades",
    points: 140,
    hero: false,
    unique: false,
    reinforce: true,
    models: 8,
    categories: [],
    stats: { move: "6\"", health: "2", save: "4+", control: "1" },
    weapons: [],
    abilities: [],
    regimentOptions: [],
    regimentHeroes: [],
    ...overrides,
  };
}

describe("PickerSheet", () => {
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

  it("puts the datasheet control on the left of the row, before points", () => {
    render(
      <PickerSheet
        title="Choose a unit"
        units={[unit()]}
        onPick={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const datasheet = screen.getByRole("button", {
      name: "Askurgan Trueblades datasheet",
    });
    const pick = screen.getByRole("button", { name: /140/ });

    expect(
      datasheet.compareDocumentPosition(pick) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("does not show keyword chips on the unit list", () => {
    render(
      <PickerSheet
        title="Choose a unit"
        units={[
          unit({
            categories: ["INFANTRY", "WIZARD", "CASTELITE"],
          }),
        ]}
        onPick={vi.fn()}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("INFANTRY")).toBeNull();
    expect(screen.queryByText("WIZARD")).toBeNull();
    expect(screen.queryByText("CASTELITE")).toBeNull();
  });
});

const rorAbility: UnitAbility = {
  name: "Grievous Halitosis",
  kind: "Activated",
  timing: "Any Combat Phase",
  declare: "Pick an enemy unit in combat.",
  effect: "Roll a dice for each model in the target unit.",
  keywords: "Rampage",
  castingValue: "",
  chantingValue: "",
  cost: "",
};

describe("ChoiceSheet", () => {
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

  it("hides Regiment of Renown abilities behind a datasheet control", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onPick = vi.fn();
    const onOpenDatasheet = vi.fn();

    render(
      <ChoiceSheet
        title="Regiment of Renown"
        options={[
          {
            id: "ror-1",
            name: "Big Drogg Fort-kicker",
            detail: "450 pts · Gatebreaker Mega-Gargant",
            abilities: [rorAbility],
          },
        ]}
        onPick={onPick}
        onOpenDatasheet={onOpenDatasheet}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Roll a dice for each model/i)).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Big Drogg Fort-kicker datasheet" }),
    );

    expect(onOpenDatasheet).toHaveBeenCalledOnce();
    expect(onPick).not.toHaveBeenCalled();
  });

  it("still picks the Regiment of Renown from the name", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onPick = vi.fn();

    render(
      <ChoiceSheet
        title="Regiment of Renown"
        options={[
          {
            id: "ror-1",
            name: "Big Drogg Fort-kicker",
            detail: "450 pts · Gatebreaker Mega-Gargant",
            abilities: [rorAbility],
          },
        ]}
        onPick={onPick}
        onOpenDatasheet={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /450 pts/i }));
    expect(onPick).toHaveBeenCalledOnce();
  });
});
