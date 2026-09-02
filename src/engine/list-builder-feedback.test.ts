import { describe, expect, it } from "vitest";
import { battleTacticsForRealm } from "./data/load";
import { buildPhaseBoards } from "./phases";
import {
  getFaction,
  getUnit,
  optionMatches,
  unitsForPicker,
  unitsForRealm,
} from "./queries";
import {
  blankArmy,
  blankPathToGlory,
  duplicateArmy,
  appendRegimentWithHero,
  prepareImportedArmy,
} from "@/lib/storage";
import { createId } from "@/lib/id";
import type { ArmyList, BattleTacticStage } from "./types";
import { pruneOrphanEnhancements, summarize } from "./validate";

describe("unitsForPicker", () => {
  it("lists core and SoA sheets separately", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const picker = unitsForPicker(faction);
    const realm = unitsForRealm(faction, null);
    expect(picker.length).toBeGreaterThan(realm.length);
    expect(
      picker.some((unit) => unit.name.includes("Scourge of Aqshy")),
    ).toBe(true);
    expect(
      picker.some(
        (unit) =>
          unit.name === "Stormstrike Palladors (Scourge of Aqshy)",
      ),
    ).toBe(true);
  });
});

describe("optionMatches", () => {
  it("treats core and SoA variants as the same regiment option", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const core = getUnit(faction, "75e5-05cd-3163-7335");
    const soa = getUnit(faction, "222e-fa67-b4c0-cf61");
    expect(core && soa).toBeTruthy();
    if (!core || !soa) return;

    const option = {
      type: "unit" as const,
      id: core.id,
      name: core.name,
    };
    expect(optionMatches(soa, option, faction)).toBe(true);
    expect(optionMatches(core, option, faction)).toBe(true);
  });
});

describe("battle tactic cards", () => {
  it("lists six cards per scourge season", () => {
    expect(battleTacticsForRealm("aqshy").length).toBe(6);
    expect(battleTacticsForRealm("ghyran").length).toBe(6);
    expect(battleTacticsForRealm(null).length).toBe(0);
  });

  it("does not require scourge season without scourge units or tactic cards", () => {
    const faction = getFaction("blades-of-khorne");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const totals = summarize(blankArmy(faction.id), faction);
    expect(
      totals.issues.some((issue) => issue.text.includes("Scourge of")),
    ).toBe(false);
  });

  it("warns when none picked and flags more than two", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const empty = summarize(
      { ...blankArmy(faction.id), scourgeRealm: "aqshy" },
      faction,
    );
    expect(
      empty.issues.some((issue) =>
        issue.text.includes("battle tactic cards"),
      ),
    ).toBe(true);

    const ids = battleTacticsForRealm("aqshy")
      .slice(0, 3)
      .map((card) => card.id);
    const tooMany = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "aqshy",
        battleTacticCardIds: ids,
      },
      faction,
    );
    expect(
      tooMany.issues.some((issue) =>
        issue.text.includes("Maximum two battle tactic cards"),
      ),
    ).toBe(true);
  });

  it("does not warn about tactics when two valid cards are picked", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const ids = battleTacticsForRealm("aqshy")
      .slice(0, 2)
      .map((card) => card.id);
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "aqshy",
        battleTacticCardIds: ids,
      },
      faction,
    );
    expect(
      totals.issues.some((issue) => issue.text.includes("battle tactic")),
    ).toBe(false);
  });

  it("does not ask Path to Glory lists for Scourge season or tactics", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const totals = summarize(blankPathToGlory(faction.id, "ascension"), faction);
    expect(
      totals.issues.some((issue) => issue.text.includes("battle tactic")),
    ).toBe(false);
    expect(
      totals.issues.some((issue) => issue.text.includes("Scourge")),
    ).toBe(false);
  });

  it("does not require a Scourge season when a Path to Glory list has a scourge warscroll", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const scourgeHero = unitsForPicker(faction).find(
      (unit) => unit.hero && unit.name.includes("Scourge of Aqshy"),
    );
    expect(scourgeHero).toBeTruthy();
    if (!scourgeHero) return;

    const list = appendRegimentWithHero(
      blankPathToGlory(faction.id, "ascension"),
      scourgeHero.id,
      { regimentId: createId(), heroSelectionId: createId() },
    );
    expect(list).toBeTruthy();
    if (!list) return;

    const totals = summarize(list, faction);
    expect(
      totals.issues.some((issue) => issue.text.includes("Scourge")),
    ).toBe(false);
  });

  it("flags tactic cards from the wrong scourge season", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const ghyranId = battleTacticsForRealm("ghyran")[0]?.id;
    expect(ghyranId).toBeTruthy();
    if (!ghyranId) return;

    const totals = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "aqshy",
        battleTacticCardIds: [ghyranId],
      },
      faction,
    );
    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" &&
          issue.text.includes("Scourge of Aqshy battle tactic"),
      ),
    ).toBe(true);
  });
});

describe("special enhancements", () => {
  it("prunes picks when bearer is removed", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    expect(table).toBeTruthy();
    if (!table) return;

    const regimentId = createId();
    const heroId = createId();
    const unitId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: heroId, unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: companion.id, reinforced: false }],
        },
      ],
      specialEnhancements: [
        {
          tableId: table.id,
          heroSelectionId: unitId,
          optionId: table.options[0].id,
        },
      ],
    };

    const pruned = pruneOrphanEnhancements({
      ...list,
      regiments: [
        {
          id: regimentId,
          hero: list.regiments[0].hero,
          units: [],
        },
      ],
    });
    expect(pruned.specialEnhancements).toEqual([]);
  });

  it("adds enhancement points to the army total", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    const option = table?.options.find((item) => item.points === 20);
    expect(table && option).toBeTruthy();
    if (!table || !option) return;

    const regimentId = createId();
    const unitId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const base = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [{ id: unitId, unitId: companion.id, reinforced: false }],
          },
        ],
      },
      faction,
    );

    const withEnhancement = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [{ id: unitId, unitId: companion.id, reinforced: false }],
          },
        ],
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: unitId,
            optionId: option.id,
          },
        ],
      },
      faction,
    );

    expect(withEnhancement.points - base.points).toBe(20);
  });

  it("warns when a unique unit is the bearer", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    const uniqueHero = faction.units.find((unit) => unit.unique && unit.hero);
    expect(table && uniqueHero).toBeTruthy();
    if (!table || !uniqueHero) return;

    const regimentId = createId();
    const heroId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: heroId, unitId: uniqueHero.id, reinforced: false },
            units: [],
          },
        ],
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: heroId,
            optionId: table.options[0].id,
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "warn" &&
          issue.text.includes(uniqueHero.name) &&
          issue.text.includes("cannot take"),
      ),
    ).toBe(true);
  });

  it("flags duplicate picks from the same table", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    expect(table).toBeTruthy();
    if (!table) return;

    const regimentId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companions = faction.units.filter(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companions.length >= 2).toBeTruthy();
    if (!hero || companions.length < 2) return;

    const unitA = createId();
    const unitB = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [
              { id: unitA, unitId: companions[0].id, reinforced: false },
              { id: unitB, unitId: companions[1].id, reinforced: false },
            ],
          },
        ],
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: unitA,
            optionId: table.options[0].id,
          },
          {
            tableId: table.id,
            heroSelectionId: unitB,
            optionId: table.options[1]?.id ?? table.options[0].id,
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" &&
          issue.text.includes("Duplicate special enhancement table"),
      ),
    ).toBe(true);
  });

  it("adds Aspects of the Deepwoods points on a Sylvaneth unit", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === "aspects-of-the-deepwoods",
    );
    const option = table?.options.find(
      (item) => item.name === "Aspect of Harvestboon",
    );
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const dryads = faction.units.find((unit) => unit.name === "Dryads");
    expect(table && option && hero && dryads).toBeTruthy();
    if (!table || !option || !hero || !dryads) return;

    const regimentId = createId();
    const unitId = createId();
    const list = {
      ...blankArmy(faction.id),
      scourgeRealm: "aqshy" as const,
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: dryads.id, reinforced: false }],
        },
      ],
    };

    const base = summarize(list, faction);
    const withAspect = summarize(
      {
        ...list,
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: unitId,
            optionId: option.id,
          },
        ],
      },
      faction,
    );
    expect(withAspect.points - base.points).toBe(10);
  });

  it("warns when a hero or the wrong season takes Aspects of the Deepwoods", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === "aspects-of-the-deepwoods",
    );
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(table && hero).toBeTruthy();
    if (!table || !hero) return;

    const regimentId = createId();
    const heroId = createId();
    const onHero = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "aqshy",
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: heroId, unitId: hero.id, reinforced: false },
            units: [],
          },
        ],
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: heroId,
            optionId: table.options[0].id,
          },
        ],
      },
      faction,
    );
    expect(
      onHero.issues.some(
        (issue) =>
          issue.tone === "warn" &&
          issue.text.includes(hero.name) &&
          issue.text.includes("cannot take"),
      ),
    ).toBe(true);

    const dryads = faction.units.find((unit) => unit.name === "Dryads");
    expect(dryads).toBeTruthy();
    if (!dryads) return;
    const unitId = createId();
    const wrongSeason = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "ghyran",
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [{ id: unitId, unitId: dryads.id, reinforced: false }],
          },
        ],
        specialEnhancements: [
          {
            tableId: table.id,
            heroSelectionId: unitId,
            optionId: table.options[0].id,
          },
        ],
      },
      faction,
    );
    expect(
      wrongSeason.issues.some(
        (issue) =>
          issue.tone === "warn" &&
          issue.text.includes("not available for this Scourge season"),
      ),
    ).toBe(true);
  });

  it("prunes Aspects of the Deepwoods when the season is not Aqshy", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.find(
      (item) => item.id === "aspects-of-the-deepwoods",
    );
    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const dryads = faction.units.find((unit) => unit.name === "Dryads");
    expect(table && hero && dryads).toBeTruthy();
    if (!table || !hero || !dryads) return;

    const regimentId = createId();
    const unitId = createId();
    const list = {
      ...blankArmy(faction.id),
      scourgeRealm: "aqshy" as const,
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: dryads.id, reinforced: false }],
        },
      ],
      specialEnhancements: [
        {
          tableId: table.id,
          heroSelectionId: unitId,
          optionId: table.options[0].id,
        },
      ],
    };

    expect(pruneOrphanEnhancements(list).specialEnhancements).toHaveLength(1);
    expect(
      pruneOrphanEnhancements({ ...list, scourgeRealm: "ghyran" })
        .specialEnhancements,
    ).toEqual([]);
  });
});

describe("scourge warscroll rules", () => {
  it("flags two variants of the same unit in one army", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const core = faction.units.find(
      (unit) => unit.name === "Stormstrike Palladors",
    );
    const soa = faction.units.find(
      (unit) => unit.name === "Stormstrike Palladors (Scourge of Aqshy)",
    );
    expect(core && soa).toBeTruthy();
    if (!core || !soa) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const regimentId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [
              { id: createId(), unitId: core.id, reinforced: false },
              { id: createId(), unitId: soa.id, reinforced: false },
            ],
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" &&
          issue.text.includes("Stormstrike Palladors") &&
          issue.text.includes("standard") &&
          issue.text.includes("Scourge of Aqshy"),
      ),
    ).toBe(true);
  });

  it("allows standard and Scourge warscrolls for different units", () => {
    const faction = getFaction("skaven");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const core = faction.units.find(
      (unit) => unit.name === "Clanrats" && !unit.hero,
    );
    const ghyran = faction.units.find(
      (unit) => unit.name === "Brood Terror (Scourge of Ghyran)",
    );
    expect(core && ghyran).toBeTruthy();
    if (!core || !ghyran) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const regimentId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [
              { id: createId(), unitId: core.id, reinforced: false },
              { id: createId(), unitId: ghyran.id, reinforced: false },
            ],
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" && issue.text.includes("Cannot mix"),
      ),
    ).toBe(false);
  });

  it("flags Scourge of Aqshy and Scourge of Ghyran warscrolls when season is set", () => {
    const faction = getFaction("skaven");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const aqshy = faction.units.find(
      (unit) => unit.name === "Grey Seer on Screaming Bell (Scourge of Aqshy)",
    );
    const ghyran = faction.units.find(
      (unit) => unit.name === "Brood Terror (Scourge of Ghyran)",
    );
    expect(aqshy && ghyran).toBeTruthy();
    if (!aqshy || !ghyran) return;

    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const regimentId = createId();
    const totals = summarize(
      {
        ...blankArmy(faction.id),
        scourgeRealm: "aqshy",
        generalRegimentId: regimentId,
        regiments: [
          {
            id: regimentId,
            hero: { id: createId(), unitId: hero.id, reinforced: false },
            units: [
              { id: createId(), unitId: aqshy.id, reinforced: false },
              { id: createId(), unitId: ghyran.id, reinforced: false },
            ],
          },
        ],
      },
      faction,
    );

    expect(
      totals.issues.some(
        (issue) =>
          issue.tone === "bad" &&
          issue.text.includes("Brood Terror") &&
          issue.text.includes("Scourge of Aqshy"),
      ),
    ).toBe(true);
  });
});

describe("play phase boards", () => {
  it("includes special enhancement abilities on the passive board", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    const option = table?.options[0];
    expect(table && option).toBeTruthy();
    if (!table || !option) return;

    const regimentId = createId();
    const unitId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const list = {
      ...blankArmy(faction.id),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: companion.id, reinforced: false }],
        },
      ],
      specialEnhancements: [
        {
          tableId: table.id,
          heroSelectionId: unitId,
          optionId: option.id,
        },
      ],
    };

    const boards = buildPhaseBoards(list, faction);
    const passive = boards.find((board) => board.phase.id === "passive");
    expect(passive).toBeTruthy();
    if (!passive) return;

    expect(
      passive.abilities.some(
        (row) =>
          row.ability.name === option.abilities[0]?.name &&
          row.unitName.includes(table.name),
      ),
    ).toBe(true);
  });
});

describe("army list persistence fields", () => {
  it("blankArmy initializes special enhancements and battle tactics", () => {
    const list = blankArmy("stormcast-eternals");
    expect(list.specialEnhancements).toEqual([]);
    expect(list.battleTacticCardIds).toEqual([]);
    expect(list.battleTacticStage).toEqual({});
    expect(list.scourgeRealm).toBe("aqshy");
  });

  it("duplicateArmy clones enhancement and tactic picks with a new id", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    expect(table).toBeTruthy();
    if (!table) return;

    const regimentId = createId();
    const unitId = createId();
    const hero = faction.units.find((unit) => unit.hero && !unit.unique);
    const companion = faction.units.find(
      (unit) => !unit.hero && !unit.unique,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const tacticIds = battleTacticsForRealm("aqshy")
      .slice(0, 2)
      .map((card) => card.id);
    const original: ArmyList = {
      ...blankArmy(faction.id, "Clone test"),
      scourgeRealm: "aqshy",
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [{ id: unitId, unitId: companion.id, reinforced: false }],
        },
      ],
      specialEnhancements: [
        {
          tableId: table.id,
          heroSelectionId: unitId,
          optionId: table.options[0].id,
        },
      ],
      battleTacticCardIds: tacticIds,
      battleTacticStage: { [tacticIds[0]]: 1 as BattleTacticStage },
    };

    const copy = duplicateArmy(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe("Clone test copy");
    expect(copy.specialEnhancements).toEqual(original.specialEnhancements);
    expect(copy.battleTacticCardIds).toEqual(tacticIds);
    expect(copy.battleTacticStage).toEqual({ [tacticIds[0]]: 1 });
    expect(copy.scourgeRealm).toBe("aqshy");
  });

  it("prepareImportedArmy assigns a new id and keeps the original name", () => {
    const original = blankArmy("stormcast-eternals", "Imported host");
    const imported = prepareImportedArmy(original);
    expect(imported.id).not.toBe(original.id);
    expect(imported.name).toBe("Imported host");
    expect(imported.factionId).toBe(original.factionId);
    expect(imported.kind).toBe("matched");
  });
});

describe("appendRegimentWithHero", () => {
  it("adds a regiment only after a hero is chosen", () => {
    const list = blankArmy();
    const next = appendRegimentWithHero(list, "hero-unit", {
      regimentId: "reg-1",
      heroSelectionId: "sel-1",
    });
    expect(next).not.toBeNull();
    expect(next?.regiments).toHaveLength(1);
    expect(next?.regiments[0]?.hero?.unitId).toBe("hero-unit");
    expect(next?.generalRegimentId).toBe("reg-1");
    expect(list.regiments).toHaveLength(0);
  });

  it("does not add a sixth regiment", () => {
    const list = blankArmy();
    const full = {
      ...list,
      regiments: Array.from({ length: 5 }, (_, index) => ({
        id: `reg-${index}`,
        hero: {
          id: `sel-${index}`,
          unitId: "hero-unit",
          reinforced: false,
        },
        units: [],
      })),
    };
    expect(
      appendRegimentWithHero(full, "hero-unit", {
        regimentId: "reg-6",
        heroSelectionId: "sel-6",
      }),
    ).toBeNull();
  });
});
