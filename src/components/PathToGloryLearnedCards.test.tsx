import { describe, expect, it, vi } from "vitest";
import { blankPathToGlory, appendRegimentWithHero } from "@/engine/listFactories";
import { getFaction, unitHasKeyword } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import {
  PathToGloryManifestationCard,
  PathToGlorySpellCard,
} from "./PathToGloryLearnedCards";

function pathToGloryWithWizard(factionId: string) {
  const faction = getFaction(factionId);
  const wizard = faction?.units.find((unit) => unitHasKeyword(unit, "WIZARD"));
  const list = blankPathToGlory(factionId, "ascension");
  if (!wizard) {
    return { faction, list };
  }
  return {
    faction,
    list: appendRegimentWithHero(list, wizard.id, {
      regimentId: "reg-1",
      heroSelectionId: "hero-1",
    }),
  };
}

describe("PathToGlorySpellCard", () => {
  it("hides Learn spells until the list has a Wizard", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) {
      return;
    }
    render(
      <PathToGlorySpellCard
        list={blankPathToGlory(faction.id, "ascension")}
        faction={faction}
        playMode={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/learn spells/i)).not.toBeInTheDocument();
  });

  it("keeps lores collapsed until you open them, then shows what the spell does", async () => {
    const user = userEvent.setup();
    const { faction, list } = pathToGloryWithWizard("stormcast-eternals");
    expect(faction && list).toBeTruthy();
    if (!faction || !list) {
      return;
    }
    const spell = faction.spellLores[0]?.powers[0];
    expect(spell).toBeTruthy();
    if (!spell) {
      return;
    }

    render(
      <PathToGlorySpellCard
        list={list}
        faction={faction}
        playMode={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/first time you add a wizard/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(spell.name)).not.toBeInTheDocument();
    await user.click(screen.getByText(faction.spellLores[0]!.name));
    expect(screen.getByLabelText(spell.name)).toBeInTheDocument();
    expect(screen.queryByText(/effect ·/i)).not.toBeInTheDocument();
    await user.click(screen.getAllByText(/what it does/i)[0]!);
    expect(screen.getByText(/effect ·/i)).toBeInTheDocument();
  });
});

describe("PathToGloryManifestationCard", () => {
  it("keeps lores collapsed and links each manifestation to its datasheet", async () => {
    const user = userEvent.setup();
    const { faction, list } = pathToGloryWithWizard("stormcast-eternals");
    expect(faction && list).toBeTruthy();
    if (!faction || !list) {
      return;
    }
    const lore = faction.manifestationLores[0];
    const model = lore?.manifestations[0];
    expect(lore && model).toBeTruthy();
    if (!lore || !model) {
      return;
    }
    const onOpenSheet = vi.fn();

    render(
      <PathToGloryManifestationCard
        list={list}
        faction={faction}
        playMode={false}
        onChange={vi.fn()}
        onOpenSheet={onOpenSheet}
      />,
    );

    expect(
      screen.queryByRole("button", { name: `${model.name} datasheet` }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByText(lore.name));
    await user.click(
      screen.getByRole("button", { name: `${model.name} datasheet` }),
    );
    expect(onOpenSheet).toHaveBeenCalledWith(model);
  });
});
