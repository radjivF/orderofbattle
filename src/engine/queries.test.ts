import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import {
  canBeGeneral,
  canJoinRegiment,
  canTakeSpecialEnhancement,
  getFaction,
  listFactions,
  selectionPoints,
  specialEnhancementTablesForList,
} from "./queries";

describe("listFactions", () => {
  it("lists parent factions with Stormcast first", () => {
    const factions = listFactions();
    expect(factions.length).toBeGreaterThan(0);
    expect(factions[0]?.id).toBe("stormcast-eternals");
    expect(factions.every((f) => !f.parentFactionIds?.length)).toBe(true);
  });
});

describe("getFaction", () => {
  it("returns catalogue by id", () => {
    expect(getFaction("stormcast-eternals")?.name).toContain("Stormcast");
    expect(getFaction("missing-faction")).toBeUndefined();
  });
});

describe("selectionPoints", () => {
  it("doubles points when reinforced", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unit = faction.units.find((item) => item.points > 0);
    expect(unit).toBeTruthy();
    if (!unit) return;

    expect(selectionPoints(unit, false)).toBe(unit.points);
    expect(selectionPoints(unit, true)).toBe(unit.points * 2);
  });

  it("uses Anvil of Apotheosis destiny ranks for points", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const anvil = faction.units.find((item) =>
      item.name.startsWith("Anvil of Apotheosis"),
    );
    expect(anvil).toBeTruthy();
    if (!anvil) return;

    const knight = anvil.anvilRanks?.[0];
    const templar = anvil.anvilRanks?.[1];
    expect(knight?.points).toBe(150);
    expect(templar?.points).toBe(250);
    expect(selectionPoints(anvil, false)).toBe(150);
    expect(
      selectionPoints(anvil, false, {
        id: "sel",
        unitId: anvil.id,
        reinforced: false,
        pathToGlory: {
          renown: 0,
          pathId: null,
          pathOptionIds: [],
          battleWoundId: null,
          scarId: null,
          anvilRankId: templar?.id,
        },
      }),
    ).toBe(250);
  });
});

describe("canJoinRegiment", () => {
  it("blocks a hero from joining its own regiment as a duplicate", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    expect(canJoinRegiment(hero, hero, faction)).toBe(false);
  });

  it("allows legal companions from regiment options", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    expect(canJoinRegiment(hero, companion, faction)).toBe(true);
  });
});

describe("canBeGeneral", () => {
  it("restricts general to warmaster regiments when present", () => {
    const faction = getFaction("hedonites-of-slaanesh");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const warmaster = faction.units.find((unit) =>
      unit.categories.some((c) => c.includes("WARMASTER")),
    );
    expect(warmaster).toBeTruthy();
    if (!warmaster) return;

    const warmasterRegimentId = "warmaster-reg";
    const otherRegimentId = "other-reg";
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: warmasterRegimentId,
          hero: { id: createId(), unitId: warmaster.id, reinforced: false },
          units: [],
        },
        {
          id: otherRegimentId,
          hero: {
            id: createId(),
            unitId: faction.units.find((u) => u.hero && u.id !== warmaster.id)
              ?.id ?? warmaster.id,
            reinforced: false,
          },
          units: [],
        },
      ],
    };

    expect(canBeGeneral(list, faction, warmasterRegimentId)).toBe(true);
    expect(canBeGeneral(list, faction, otherRegimentId)).toBe(false);
  });
});

describe("Aspects of the Deepwoods", () => {
  it("is only on the list during Scourge of Aqshy", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const tableId = "aspects-of-the-deepwoods";
    expect(
      specialEnhancementTablesForList(faction, { scourgeRealm: "aqshy" }).some(
        (table) => table.id === tableId,
      ),
    ).toBe(true);
    expect(
      specialEnhancementTablesForList(faction, { scourgeRealm: "ghyran" }).some(
        (table) => table.id === tableId,
      ),
    ).toBe(false);
    expect(
      specialEnhancementTablesForList(faction, { scourgeRealm: null }).some(
        (table) => table.id === tableId,
      ),
    ).toBe(false);
  });

  it("is for non-hero non-monster units only", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === "aspects-of-the-deepwoods",
    );
    expect(table).toBeTruthy();
    if (!table) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const dryads = faction.units.find((unit) => unit.name === "Dryads");
    const treelord = faction.units.find((unit) => unit.name === "Treelord");
    const hunters = faction.units.find((unit) =>
      unit.name.startsWith("Kurnoth Hunters with Kurnoth Scythes"),
    );
    expect(hero && dryads && treelord && hunters).toBeTruthy();
    if (!hero || !dryads || !treelord || !hunters) return;

    expect(canTakeSpecialEnhancement(hero, table)).toBe(false);
    expect(canTakeSpecialEnhancement(treelord, table)).toBe(false);
    expect(canTakeSpecialEnhancement(dryads, table)).toBe(true);
    expect(canTakeSpecialEnhancement(hunters, table)).toBe(true);
  });
});
