import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { TowCatalogueUnit, TowSelection } from "@/engine/tow/types";
import { cleanup, render, screen, within } from "@/test-utils/render";
import { TowCharacterForgeSheet } from "./TowCharacterForgeSheet";

const RULE_TEXT =
  "Armour offers no protection against these ensorcelled arrows. An Asrai Longbow with Arcane Bodkins has an AP of -2.";

const unit: TowCatalogueUnit = {
  id: "glade-lord",
  name: "Glade Lord",
  category: "characters",
  pointsPerModel: 120,
  minModels: 1,
  maxModels: 1,
  character: true,
  canTakeDetachments: false,
  canJoinUnits: true,
  troopType: "regular infantry",
  magicItems: false,
  command: [],
  optionGroups: [
    {
      id: "enchanted-arrows",
      name: "Enchanted Arrows",
      options: [
        {
          id: "arcane-bodkins",
          name: "Arcane Bodkins",
          points: 6,
          specialRules: [{ name: "Arcane Bodkins", text: RULE_TEXT }],
        },
        {
          id: "hagbane-tips",
          name: "Hagbane Tips",
          points: 6,
          specialRules: [
            {
              name: "Hagbane Tips",
              text: "An Asrai Longbow with Hagbane Tips has the Poisoned Attacks special rule.",
            },
          ],
        },
        {
          id: "shield",
          name: "Shield",
          points: 3,
        },
      ],
    },
  ],
  specialRules: [],
  weapons: [],
  stats: {
    M: "5",
    WS: "6",
    BS: "6",
    S: "4",
    T: "3",
    W: "3",
    I: "7",
    A: "4",
    Ld: "9",
  },
};

const selection: TowSelection = {
  id: "sel-1",
  unitId: unit.id,
  category: "characters",
  models: 1,
  commandIds: [],
  optionIds: [],
  magicItemIds: [],
  joinSelectionId: null,
  detachments: [],
};

function stubMatchMedia() {
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
}

describe("TowCharacterForgeSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps option rule text collapsed until Rules is opened", async () => {
    stubMatchMedia();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <TowCharacterForgeSheet
        unit={unit}
        selection={selection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const forge = screen.getByRole("dialog", { name: "Glade Lord forge" });
    expect(within(forge).queryByText(/AP of -2/i)).toBeNull();
    expect(
      within(forge).getByRole("button", { name: /^Arcane Bodkins/ }),
    ).toHaveAttribute("aria-pressed", "false");

    await user.click(
      within(forge).getByRole("button", {
        name: "Rules for Arcane Bodkins",
      }),
    );
    expect(within(forge).getByText(/AP of -2/i));
    expect(
      within(forge).getByRole("button", {
        name: "Rules for Arcane Bodkins",
      }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("still selects an option when its name is pressed", async () => {
    stubMatchMedia();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSave = vi.fn();
    render(
      <TowCharacterForgeSheet
        unit={unit}
        selection={selection}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    const forge = screen.getByRole("dialog", { name: "Glade Lord forge" });
    await user.click(
      within(forge).getByRole("button", { name: /^Arcane Bodkins/ }),
    );
    expect(
      within(forge).getByRole("button", { name: /^Arcane Bodkins/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(forge).queryByText(/AP of -2/i)).toBeNull();

    await user.click(within(forge).getByRole("button", { name: "Done" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ optionIds: ["arcane-bodkins"] }),
    );
  });

  it("hides the Rules control when an option has no rule text", () => {
    stubMatchMedia();
    render(
      <TowCharacterForgeSheet
        unit={unit}
        selection={selection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const forge = screen.getByRole("dialog", { name: "Glade Lord forge" });
    expect(within(forge).getByRole("button", { name: /^Shield/ }));
    expect(
      within(forge).queryByRole("button", { name: "Rules for Shield" }),
    ).toBeNull();
  });
});
