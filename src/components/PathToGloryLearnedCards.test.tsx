import { describe, expect, it, vi } from "vitest";
import { blankPathToGlory } from "@/engine/listFactories";
import { getFaction } from "@/engine/queries";
import { render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import {
  PathToGloryManifestationCard,
  PathToGlorySpellCard,
} from "./PathToGloryLearnedCards";

describe("PathToGlorySpellCard", () => {
  it("keeps lores collapsed until you open them, then shows what the spell does", async () => {
    const user = userEvent.setup();
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) {
      return;
    }
    const spell = faction.spellLores[0]?.powers[0];
    expect(spell).toBeTruthy();
    if (!spell) {
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
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) {
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
        list={blankPathToGlory(faction.id, "ascension")}
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
