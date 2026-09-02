import { describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { blankPathToGlory } from "@/engine/listFactories";
import { getFaction } from "@/engine/queries";
import {
  factionManifestationPicks,
  factionSpellPicks,
  isPathToGloryList,
  patchPathToGloryState,
} from "@/engine/pathToGlory";
import { render, screen, within } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
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

  it("shows Unlimited label and multi-unit target pickers", async () => {
    const faction = getFaction("soulblight-gravelords");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) =>
      unit.abilities.some((ability) => ability.name === "The Queen's Dictat"),
    );
    const monster = faction.units.find(
      (unit) => unit.name === "Prince Vhordrai",
    );
    expect(hero && monster).toBeTruthy();
    if (!hero || !monster) return;

    const heroId = createId();
    const monsterId = createId();
    const onBindPower = vi.fn();
    const list = {
      ...blankArmy(faction.id),
      spellLoreId: faction.spellLores[0]?.id ?? null,
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroId, unitId: hero.id, reinforced: false },
          units: [{ id: monsterId, unitId: monster.id, reinforced: false }],
        },
      ],
    };

    render(
      <PlayMagicBoard
        list={list}
        faction={faction}
        onOpenSheet={vi.fn()}
        onBindPower={onBindPower}
      />,
    );

    expect(screen.getByText("Vile Transference")).toBeInTheDocument();
    expect(
      within(
        screen.getByText("Vile Transference").closest("article")!,
      ).getByText("Unlimited"),
    ).toBeInTheDocument();

    const dictatCard = screen.getByText("The Queen's Dictat").closest("article");
    expect(dictatCard).toBeTruthy();
    if (!dictatCard) return;
    expect(within(dictatCard).getByText(/on unit/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      within(dictatCard).getByRole("combobox", { name: /on unit/i }),
    );
    await user.click(
      within(dictatCard).getByRole("option", { name: /prince vhordrai/i }),
    );
    expect(onBindPower).toHaveBeenCalledWith(
      "spell:The Queen's Dictat",
      monsterId,
    );
  });

  it("shows only learned spells and manifestations on Path to Glory lists", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const spell = factionSpellPicks(faction)[0];
    const otherSpell = factionSpellPicks(faction)[1];
    const manifestation = factionManifestationPicks(faction)[0];
    const skipped = factionManifestationPicks(faction)[1];
    expect(spell && otherSpell && manifestation && skipped).toBeTruthy();
    if (!spell || !otherSpell || !manifestation || !skipped) return;

    const list = patchPathToGloryState(
      blankPathToGlory(faction.id, "ascension"),
      {
        spellIds: [spell.key],
        manifestationIds: [manifestation.model.id],
      },
    );
    expect(isPathToGloryList(list)).toBe(true);

    const { container } = render(
      <PlayMagicBoard
        list={list}
        faction={faction}
        onOpenSheet={vi.fn()}
        onBindPower={vi.fn()}
      />,
    );
    const view = within(container);

    expect(view.getByText(spell.power.name)).toBeInTheDocument();
    expect(view.queryByText(otherSpell.power.name)).not.toBeInTheDocument();
    expect(view.getByText(manifestation.model.name)).toBeInTheDocument();
    expect(view.queryByText(skipped.model.name)).not.toBeInTheDocument();
    expect(view.getAllByText("1 learned").length).toBeGreaterThan(0);
  });

  it("lets the user check two units on any target prayer", async () => {
    const faction = getFaction("ironjawz");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const warchanter = faction.units.find((unit) => unit.name === "Warchanter");
    const ardboyz = faction.units.find((unit) => unit.name === "Ardboyz");
    const brutes = faction.units.find((unit) => unit.name === "Brutes");
    expect(warchanter && ardboyz && brutes).toBeTruthy();
    if (!warchanter || !ardboyz || !brutes) return;

    const ardboyzId = createId();
    const brutesId = createId();
    const onBindPower = vi.fn();
    const list = {
      ...blankArmy(faction.id),
      prayerLoreId: faction.prayerLores[0]?.id ?? null,
      powerBinds: { "prayer:Killa Beat": ardboyzId },
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: createId(),
            unitId: warchanter.id,
            reinforced: false,
          },
          units: [
            { id: ardboyzId, unitId: ardboyz.id, reinforced: false },
            { id: brutesId, unitId: brutes.id, reinforced: false },
          ],
        },
      ],
    };

    render(
      <PlayMagicBoard
        list={list}
        faction={faction}
        onOpenSheet={vi.fn()}
        onBindPower={onBindPower}
      />,
    );

    const killaCard = screen.getByText("Killa Beat").closest("article");
    expect(killaCard).toBeTruthy();
    if (!killaCard) return;

    expect(within(killaCard).queryByRole("listbox")).not.toBeInTheDocument();
    expect(within(killaCard).getByText(/ardboyz/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(
      within(killaCard).getByRole("combobox", { name: /on unit/i }),
    );
    await user.click(
      within(killaCard).getByRole("option", { name: /brutes/i }),
    );
    expect(onBindPower).toHaveBeenCalledWith(
      "prayer:Killa Beat",
      `${ardboyzId},${brutesId}`,
    );
  });
});
