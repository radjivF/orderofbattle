import { describe, expect, it } from "vitest";
import {
  getTowFaction,
  listTowFactions,
  partitionTowSpecialRules,
  towCharacterCanJoinUnits,
  towProfileLine,
} from "./queries";

const CORE_FACTION_IDS = [
  "beastmen-brayherds",
  "chaos-dwarfs",
  "daemons-of-chaos",
  "dark-elves",
  "dwarfen-mountain-holds",
  "grand-cathay",
  "high-elf-realms",
  "kingdom-of-bretonnia",
  "lizardmen",
  "ogre-kingdoms",
  "orc-and-goblin-tribes",
  "skaven",
  "the-empire-of-man",
  "tomb-kings-of-khemri",
  "vampire-counts",
  "warriors-of-chaos",
  "wood-elf-realms",
] as const;

describe("Old World catalogues", () => {
  it("loads every core army book, not Arcane Journals", () => {
    const factions = listTowFactions();
    expect(factions.map((faction) => faction.id).sort()).toEqual([
      ...CORE_FACTION_IDS,
    ]);
    expect(factions.map((faction) => faction.id)).not.toContain(
      "grand-cathay-jade-fleet",
    );
    expect(factions.map((faction) => faction.id)).not.toContain(
      "the-empire-of-man-city-state-of-nuln",
    );
    expect(factions.map((faction) => faction.id)).not.toContain(
      "kingdom-of-bretonnia-errantry-crusade",
    );
    for (const faction of factions) {
      expect(faction.units.length).toBeGreaterThan(0);
      expect(
        faction.units.some((unit) => unit.category === "characters"),
      ).toBe(true);
      expect(faction.units.some((unit) => unit.category === "core")).toBe(
        true,
      );
    }
  });

  it("loads The Empire of Man with category caps and profiles", () => {
    const empire = getTowFaction("the-empire-of-man");
    expect(empire?.name).toBe("The Empire of Man");
    const troops = empire?.units.find((unit) => unit.id === "state-troops");
    expect(troops).toMatchObject({
      category: "core",
      pointsPerModel: 5,
      minModels: 10,
      maxModels: 40,
      canTakeDetachments: true,
      stats: { M: "4", W: "1", Ld: "7" },
    });
    const captain = empire?.units.find(
      (unit) => unit.id === "captain-of-the-empire",
    );
    expect(captain).toMatchObject({
      category: "characters",
      character: true,
      pointsPerModel: 45,
      stats: { W: "2" },
    });
    expect(towProfileLine(captain!.stats)).toContain("WS 5");
    expect(towProfileLine(captain!.stats)).toContain("W 2");
  });

  it("keeps State Troops special rules and weapons for the datasheet", () => {
    const troops = getTowFaction("the-empire-of-man")?.units.find(
      (unit) => unit.id === "state-troops",
    );
    expect(troops?.specialRules.map((rule) => rule.name)).toEqual(
      expect.arrayContaining([
        "Close Order",
        "Detachment",
        "Regimental Unit",
        "Horde",
      ]),
    );
    expect(
      troops?.specialRules.find((rule) => rule.name === "Close Order")?.text,
    ).toMatch(/Close Order formation/i);
    expect(troops?.weapons.some((weapon) => weapon.name.length > 0)).toBe(
      true,
    );
  });

  it("returns nothing for an unknown army", () => {
    expect(getTowFaction("jade-fleet")).toBeUndefined();
  });

  it("does not let Orion or a Treeman Ancient join a unit", () => {
    const woodElves = getTowFaction("wood-elf-realms");
    const orion = woodElves?.units.find(
      (unit) => unit.id === "orion-the-king-in-the-woods",
    );
    const ancient = woodElves?.units.find(
      (unit) => unit.id === "treemen-ancients",
    );
    expect(orion).toBeTruthy();
    expect(ancient).toBeTruthy();
    expect(towCharacterCanJoinUnits(orion!)).toBe(false);
    expect(towCharacterCanJoinUnits(ancient!)).toBe(false);
    expect(orion?.specialRules.map((rule) => rule.name)).toEqual(
      expect.arrayContaining([
        "Frenzy",
        "Spectral Hounds",
        "Magical Attacks",
        "Terror",
      ]),
    );
  });

  it("lets infantry and monstrous-infantry characters join matching units", () => {
    const gladeLord = getTowFaction("wood-elf-realms")?.units.find(
      (unit) => unit.id === "glade-lord",
    );
    const captain = getTowFaction("the-empire-of-man")?.units.find(
      (unit) => unit.id === "captain-of-the-empire",
    );
    const tyrant = getTowFaction("ogre-kingdoms")?.units.find(
      (unit) => unit.id === "tyrant",
    );
    expect(gladeLord).toBeTruthy();
    expect(captain).toBeTruthy();
    expect(tyrant).toBeTruthy();
    expect(towCharacterCanJoinUnits(gladeLord!)).toBe(true);
    expect(towCharacterCanJoinUnits(captain!)).toBe(true);
    expect(towCharacterCanJoinUnits(tyrant!)).toBe(true);
  });

  it("lists Forest Dragon on the Glade Lord Mounts group", () => {
    const lord = getTowFaction("wood-elf-realms")?.units.find(
      (unit) => unit.id === "glade-lord",
    );
    const mounts = lord?.optionGroups.find((group) =>
      /mount/i.test(group.name),
    );
    expect(mounts?.options.map((option) => option.name)).toEqual(
      expect.arrayContaining([
        "Elven Steed",
        "Great Stag",
        "Warhawk",
        "Forest Dragon",
        "Great Eagle",
      ]),
    );
    expect(
      mounts?.options.find((option) => option.name === "Forest Dragon")
        ?.points,
    ).toBe(275);
    expect(
      mounts?.options.find((option) => option.name === "Forest Dragon")?.stats,
    ).toMatchObject({ S: "7", T: "(+3)", W: "(+6)" });
  });

  it("attaches Enchanted Arrows rule text so the forge can show them", () => {
    const lord = getTowFaction("wood-elf-realms")?.units.find(
      (unit) => unit.id === "glade-lord",
    );
    const arrows = lord?.optionGroups.find((group) =>
      /enchanted arrows/i.test(group.name),
    );
    const bodkins = arrows?.options.find(
      (option) => option.name === "Arcane Bodkins",
    );
    expect(bodkins?.points).toBe(6);
    expect(bodkins?.specialRules?.[0]?.text).toMatch(/AP of -2/i);
  });

  it("splits Dryads rules into unit specials and common Old World rules", () => {
    const dryads = getTowFaction("wood-elf-realms")?.units.find(
      (unit) => unit.id === "dryads",
    );
    expect(dryads).toBeTruthy();
    const { unit, common } = partitionTowSpecialRules(dryads!.specialRules);
    expect(unit.map((rule) => rule.name)).toEqual(["Tree Spirit"]);
    expect(common.map((rule) => rule.name)).toEqual(
      expect.arrayContaining([
        "Fear",
        "Stubborn",
        "Skirmishers",
        "Regeneration",
      ]),
    );
    expect(common.map((rule) => rule.name)).not.toContain("Tree Spirit");
  });
});
