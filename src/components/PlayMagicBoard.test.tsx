import { describe, expect, it, vi } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { getFaction } from "@/engine/queries";
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
      within(dictatCard).getByRole("checkbox", { name: /Prince Vhordrai/i }),
    );
    expect(onBindPower).toHaveBeenCalledWith(
      "spell:The Queen's Dictat",
      monsterId,
    );
  });
});
