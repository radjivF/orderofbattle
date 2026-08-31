import { describe, expect, it } from "vitest";
import { createId } from "@/lib/id";
import { blankPathToGlory } from "@/engine/listFactories";
import { buildPhaseBoards } from "@/engine/phases";
import { getFaction } from "@/engine/queries";
import { summarize } from "@/engine/validate";
import type {
  CatalogueUnit,
  PathToGlorySelectionState,
  UnitAbility,
} from "@/engine/types";
import {
  anvilDestinyRemaining,
  anvilRankForSelection,
  pickAnvilOption,
  resolveAnvilUnit,
  visibleAnvilForgeGroups,
} from "./anvil";

const passive = (name: string): UnitAbility => ({
  name,
  kind: "Passive",
  timing: "",
  declare: "",
  effect: `${name} effect`,
  keywords: "",
  castingValue: "",
  chantingValue: "",
});

const forgeHero: CatalogueUnit = {
  id: "anvil-hero",
  name: "Anvil of Apotheosis: Test Hero",
  points: 150,
  hero: true,
  unique: true,
  reinforce: false,
  models: 1,
  categories: ["HERO", "INFANTRY"],
  stats: { move: "5\"", health: "5", save: "3+", control: "2" },
  weapons: [
    {
      name: "Warblade",
      kind: "melee",
      range: "",
      attacks: "4",
      hit: "3+",
      wound: "3+",
      rend: "1",
      damage: "2",
      ability: "",
    },
    {
      name: "Noble Beast's Claws",
      kind: "melee",
      range: "",
      attacks: "3",
      hit: "4+",
      wound: "3+",
      rend: "2",
      damage: "1",
      ability: "Companion",
    },
  ],
  abilities: [passive("Freshly Forged"), passive("Brash and Impulsive")],
  regimentOptions: [],
  regimentHeroes: [],
  pathToGloryOnly: true,
  anvilRanks: [
    { id: "knight", name: "Knight", points: 150, destiny: 10 },
    { id: "templar", name: "Templar", points: 250, destiny: 30 },
  ],
  anvilForge: [
    {
      id: "chamber",
      name: "Chamber",
      min: 1,
      max: 1,
      options: [
        {
          id: "warrior",
          name: "Warrior Chamber",
          destiny: 0,
          abilities: [],
          weapons: [],
        },
        {
          id: "vanguard",
          name: "Vanguard Chamber",
          destiny: -4,
          abilities: [passive("Vanguard Chamber")],
          weapons: [],
        },
      ],
    },
    {
      id: "origins",
      name: "Origins",
      min: 0,
      max: 1,
      options: [
        {
          id: "forged",
          name: "Freshly Forged",
          destiny: -2,
          abilities: [passive("Freshly Forged")],
          weapons: [],
        },
      ],
    },
    {
      id: "flaws",
      name: "Flaws",
      min: 0,
      max: 1,
      options: [
        {
          id: "brash",
          name: "Brash and Impulsive",
          destiny: 4,
          abilities: [passive("Brash and Impulsive")],
          weapons: [],
        },
      ],
    },
    {
      id: "mount",
      name: "Battle Mount",
      min: 0,
      max: 1,
      options: [
        {
          id: "beast",
          name: "Noble Beast",
          destiny: -5,
          abilities: [],
          weapons: [
            {
              name: "Noble Beast's Claws",
              kind: "melee",
              range: "",
              attacks: "3",
              hit: "4+",
              wound: "3+",
              rend: "2",
              damage: "1",
              ability: "Companion",
            },
          ],
          stats: { move: "10\"", health: "8" },
        },
      ],
    },
  ],
};

function ptg(
  patch: Partial<PathToGlorySelectionState> = {},
): PathToGlorySelectionState {
  return {
    renown: 0,
    pathId: null,
    pathOptionIds: [],
    battleWoundId: null,
    scarId: null,
    anvilRankId: "knight",
    anvilPickIds: [],
    ...patch,
  };
}

describe("anvilDestinyRemaining", () => {
  it("starts at the Knight budget and spends on chamber and origin", () => {
    expect(
      anvilDestinyRemaining(forgeHero, {
        id: "s",
        unitId: forgeHero.id,
        reinforced: false,
        pathToGlory: ptg(),
      }),
    ).toBe(10);
    expect(
      anvilDestinyRemaining(forgeHero, {
        id: "s",
        unitId: forgeHero.id,
        reinforced: false,
        pathToGlory: ptg({ anvilPickIds: ["vanguard", "forged"] }),
      }),
    ).toBe(4);
  });

  it("refunds destiny when a flaw is taken", () => {
    expect(
      anvilDestinyRemaining(forgeHero, {
        id: "s",
        unitId: forgeHero.id,
        reinforced: false,
        pathToGlory: ptg({ anvilPickIds: ["vanguard", "brash"] }),
      }),
    ).toBe(10);
  });
});

describe("pickAnvilOption", () => {
  it("keeps one pick in a max-1 group", () => {
    expect(pickAnvilOption(forgeHero, ["warrior"], "chamber", "vanguard")).toEqual(
      ["vanguard"],
    );
    expect(pickAnvilOption(forgeHero, ["vanguard"], "chamber", "vanguard")).toEqual(
      [],
    );
  });
});

describe("resolveAnvilUnit", () => {
  it("hides unpicked origin and flaw abilities and mount claws", () => {
    const resolved = resolveAnvilUnit(forgeHero, {
      id: "s",
      unitId: forgeHero.id,
      reinforced: false,
      pathToGlory: ptg({ anvilPickIds: ["warrior"] }),
    });
    expect(resolved.abilities.map((item) => item.name)).not.toContain(
      "Freshly Forged",
    );
    expect(resolved.abilities.map((item) => item.name)).not.toContain(
      "Brash and Impulsive",
    );
    expect(resolved.weapons.map((item) => item.name)).toEqual(["Warblade"]);
    expect(resolved.stats).toEqual(forgeHero.stats);
  });

  it("applies picked origin ability, mount claws, and mount stats", () => {
    const resolved = resolveAnvilUnit(forgeHero, {
      id: "s",
      unitId: forgeHero.id,
      reinforced: false,
      pathToGlory: ptg({ anvilPickIds: ["warrior", "forged", "beast"] }),
    });
    expect(resolved.abilities.map((item) => item.name)).toContain("Freshly Forged");
    expect(resolved.weapons.map((item) => item.name)).toEqual([
      "Warblade",
      "Noble Beast's Claws",
    ]);
    expect(resolved.stats.move).toBe("10\"");
    expect(resolved.stats.health).toBe("8");
  });
});

describe("Anvil forge catalogue", () => {
  it("gives the Stormcast Anvil Knight a destiny budget and Chamber options", () => {
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil).toBeTruthy();
    expect(anvilRankForSelection(anvil!)?.destiny).toBe(10);
    const chambers = anvil?.anvilForge?.find((group) => group.name === "Chamber");
    expect(chambers?.min).toBe(1);
    expect(chambers?.options.map((item) => item.name)).toEqual([
      "Warrior Chamber",
      "Vanguard Chamber",
      "Extremis Chamber",
      "Ruination Chamber",
    ]);
    expect(
      anvil?.anvilForge?.map((group) => group.name),
    ).toEqual(expect.arrayContaining([
      "Chamber",
      "Origins",
      "Flaws",
      "Battle Mount",
      "Battle Mount Upgrades",
      "Upgrades",
    ]));
  });

  it("hides Battle Mount Upgrades until a mount is picked", () => {
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil).toBeTruthy();
    if (!anvil) {
      return;
    }
    const names = (ids: string[]) =>
      visibleAnvilForgeGroups(anvil, ids).map((group) => group.name);
    expect(names([])).not.toContain("Battle Mount Upgrades");
    const beast = anvil.anvilForge
      ?.find((group) => group.name === "Battle Mount")
      ?.options[0];
    expect(beast).toBeTruthy();
    expect(names([beast!.id])).toContain("Battle Mount Upgrades");
  });
});

describe("Anvil forge validation and play", () => {
  it("errors when destiny is overspent or Chamber is missing", () => {
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil && faction).toBeTruthy();
    if (!anvil || !faction) {
      return;
    }
    const selectionId = createId();
    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: selectionId,
            unitId: anvil.id,
            reinforced: false,
            pathToGlory: ptg({
              anvilRankId: anvil.anvilRanks?.[0]?.id ?? "knight",
              anvilPickIds: [],
            }),
          },
          units: [],
        },
      ],
    };
    const missing = summarize(list, faction).issues.map((issue) => issue.text);
    expect(missing.some((text) => /chamber/i.test(text))).toBe(true);

    const vanguard = anvil.anvilForge
      ?.find((group) => group.name === "Chamber")
      ?.options.find((item) => item.name === "Vanguard Chamber");
    const beast = anvil.anvilForge
      ?.find((group) => group.name === "Battle Mount")
      ?.options.find((item) => item.name === "Mighty Flying Noble Beast");
    const overspentList = {
      ...list,
      regiments: [
        {
          ...list.regiments[0]!,
          hero: {
            ...list.regiments[0]!.hero!,
            pathToGlory: ptg({
              anvilRankId: anvil.anvilRanks?.[0]?.id,
              anvilPickIds: [vanguard?.id ?? "", beast?.id ?? ""].filter(Boolean),
            }),
          },
        },
      ],
    };
    const overspent = summarize(overspentList, faction).issues.map(
      (issue) => issue.text,
    );
    expect(overspent.some((text) => /destiny/i.test(text))).toBe(true);
  });

  it("keeps unpicked Anvil abilities off the Play board", () => {
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find(
      (unit) => unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil && faction).toBeTruthy();
    if (!anvil || !faction) {
      return;
    }
    const warrior = anvil.anvilForge
      ?.find((group) => group.name === "Chamber")
      ?.options.find((item) => item.name === "Warrior Chamber");
    const forged = anvil.anvilForge
      ?.find((group) => group.name === "Origins")
      ?.options.find((item) => item.name === "Freshly Forged");
    const selectionId = createId();
    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      generalRegimentId: "reg-1",
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: selectionId,
            unitId: anvil.id,
            reinforced: false,
            pathToGlory: ptg({
              anvilRankId: anvil.anvilRanks?.[0]?.id,
              anvilPickIds: [warrior?.id ?? ""].filter(Boolean),
            }),
          },
          units: [],
        },
      ],
    };
    const names = buildPhaseBoards(list, faction).flatMap((board) =>
      board.abilities.map((row) => row.ability.name),
    );
    expect(names).not.toContain("Freshly Forged");

    const withOrigin = {
      ...list,
      regiments: [
        {
          ...list.regiments[0]!,
          hero: {
            ...list.regiments[0]!.hero!,
            pathToGlory: ptg({
              anvilRankId: anvil.anvilRanks?.[0]?.id,
              anvilPickIds: [warrior?.id, forged?.id].filter(
                (id): id is string => Boolean(id),
              ),
            }),
          },
        },
      ],
    };
    const withNames = buildPhaseBoards(withOrigin, faction).flatMap((board) =>
      board.abilities.map((row) => row.ability.name),
    );
    expect(withNames).toContain("Freshly Forged");
  });
});
