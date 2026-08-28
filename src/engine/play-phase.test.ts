import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import {
  buildPhaseBoards,
  regimentPlayGroups,
  rosterSelectionIds,
} from "./phases";
import {
  defenceStatLine,
  getFaction,
  moveStatLine,
} from "./queries";
import type { ManifestationModel } from "./types";
import { summarize } from "./validate";

describe("play stat lines", () => {
  it("formats move for play phase unit rows", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    expect(moveStatLine(hero)).toBe(`Move ${hero.stats.move}`);
  });

  it("formats save and ward for combat profiles", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const lore = faction.manifestationLores.find(
      (item) => item.name === "Manifestations of Khaine",
    );
    const bladewind = lore?.manifestations.find(
      (item) => item.name === "Bladewind",
    ) as ManifestationModel | undefined;
    expect(bladewind).toBeTruthy();
    if (!bladewind) return;

    expect(defenceStatLine(bladewind)).toBe("Save 5+ · Ward 6+");
  });
});

describe("regimentPlayGroups", () => {
  it("groups roster units by regiment for movement phase", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const heroSelectionId = createId();
    const unitSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [
            { id: unitSelectionId, unitId: companion.id, reinforced: false },
          ],
        },
      ],
    };

    const groups = regimentPlayGroups(list, faction);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.subtitle).toBe("General's regiment");
    expect(groups[0]?.entries.map((entry) => entry.unit.name)).toEqual([
      hero.name,
      companion.name,
    ]);

    const rosterIds = rosterSelectionIds(list);
    expect(rosterIds.has(heroSelectionId)).toBe(true);
    expect(rosterIds.has(unitSelectionId)).toBe(true);
  });
});

describe("buildPhaseBoards movement split", () => {
  it("keeps roster abilities on unit selection ids for movement grouping", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) =>
      unit.abilities.some((ability) =>
        ability.timing.toLowerCase().includes("movement phase"),
      ),
    );
    expect(hero).toBeTruthy();
    if (!hero) return;

    const heroSelectionId = createId();
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: "reg-1",
          hero: { id: heroSelectionId, unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
    };

    const movement =
      buildPhaseBoards(list, faction).find((board) => board.phase.id === "movement") ??
      null;
    expect(movement).toBeTruthy();
    if (!movement) return;

    const rosterIds = rosterSelectionIds(list);
    expect(
      movement.abilities.some(
        (row) =>
          rosterIds.has(row.selectionId) &&
          row.selectionId === heroSelectionId,
      ),
    ).toBe(true);
  });
});

describe("manifestation lore points", () => {
  it("counts paid GHB manifestation lores in army totals", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const freeLore = faction.manifestationLores.find(
      (item) => item.name === "Manifestations of Khaine",
    );
    const paidLore = faction.manifestationLores.find(
      (item) => item.name === "Forbidden Power",
    );
    expect(freeLore && paidLore?.points).toBeTruthy();
    if (!freeLore || !paidLore?.points) return;

    const base = summarize(blankArmy(faction.id), faction).points;
    const withFree = summarize(
      { ...blankArmy(faction.id), manifestationLoreId: freeLore.id },
      faction,
    ).points;
    const withPaid = summarize(
      { ...blankArmy(faction.id), manifestationLoreId: paidLore.id },
      faction,
    ).points;

    expect(withFree).toBe(base);
    expect(withPaid - base).toBe(paidLore.points);
  });
});
