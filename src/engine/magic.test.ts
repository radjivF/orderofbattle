import { describe, expect, it } from "vitest";
import {
  combatModifierNotes,
  parseEffectChoices,
  powerBindCandidates,
  powerBindKey,
  powerBindRule,
  powerChoiceKey,
} from "./magic";
import { getFaction, preferredUnitForRealm } from "./queries";
import type { ArmyList } from "./types";

function unitByName(
  faction: NonNullable<ReturnType<typeof getFaction>>,
  name: string,
) {
  return (
    preferredUnitForRealm(faction, name, null) ??
    faction.units.find((unit) => unit.name === name)
  );
}

function baseList(
  faction: NonNullable<ReturnType<typeof getFaction>>,
  extras: Partial<ArmyList> = {},
): ArmyList {
  return {
    id: "t",
    name: "t",
    factionId: faction.id,
    pointsCap: 2000,
    formationId: faction.formations[0]?.id ?? null,
    spellLoreId: faction.spellLores[0]?.id ?? null,
    prayerLoreId: faction.prayerLores[0]?.id ?? null,
    manifestationLoreId: null,
    artefact: null,
    heroicTrait: null,
    monstrousTrait: null,
    visionOfFate: null,
    specialEnhancements: [],
    battleTacticCardIds: [],
    battleTacticStage: {},
    scourgeRealm: null,
    generalRegimentId: "r1",
    regiments: [],
    auxiliaries: [],
    regimentOfRenown: null,
    powerBinds: {},
    kind: "matched",
    spearheadId: null,
    regimentAbilityId: null,
    createdAt: 0,
    updatedAt: 0,
    lastOpenedAt: 0,
    ...extras,
  };
}

describe("powerBindKey", () => {
  it("namespaced spell and prayer keys", () => {
    expect(powerBindKey("spell", "Mindrazor")).toBe("spell:Mindrazor");
    expect(powerChoiceKey("spell:Mindrazor")).toBe("choice:spell:Mindrazor");
  });
});

describe("parseEffectChoices", () => {
  it("splits pick-one effect text with bullet options", () => {
    const block = parseEffectChoices(
      "Pick 1 of the following: • Add 1 to hit rolls • Add 1 to wound rolls",
    );
    expect(block?.options).toHaveLength(2);
    expect(block?.options[0]?.label).toContain("hit");
  });

  it("returns null for plain paragraphs", () => {
    expect(parseEffectChoices("Inflict D3 mortal wounds.")).toBeNull();
  });
});

describe("Daughters of Khaine magic binds", () => {
  it("classifies friendly targets vs enemy notes", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const mindrazor = faction.spellLores[0]?.powers.find(
      (power) => power.name === "Mindrazor",
    );
    const blackHorror = faction.spellLores[0]?.powers.find(
      (power) => power.name === "Black Horror of Ulgu",
    );
    expect(mindrazor && blackHorror).toBeTruthy();
    if (!mindrazor || !blackHorror) return;

    expect(powerBindRule(mindrazor).role).toBe("target");
    expect(powerBindRule(blackHorror).role).toBe("enemy");
  });

  it("lists roster candidates and combat notes for binds", () => {
    const faction = getFaction("daughters-of-khaine");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const medusa = unitByName(faction, "Bloodwrack Medusa");
    const sisters = unitByName(faction, "Blood Sisters");
    const stalkers = unitByName(faction, "Blood Stalkers");
    const mindrazor = faction.spellLores[0]?.powers.find(
      (power) => power.name === "Mindrazor",
    );
    expect(medusa && sisters && stalkers && mindrazor).toBeTruthy();
    if (!medusa || !sisters || !stalkers || !mindrazor) return;

    const list = baseList(faction, {
      regiments: [
        {
          id: "r1",
          hero: { id: "h1", unitId: medusa.id, reinforced: false },
          units: [
            { id: "u1", unitId: sisters.id, reinforced: false },
            { id: "u2", unitId: stalkers.id, reinforced: false },
          ],
        },
      ],
    });

    const candidates = powerBindCandidates(list, faction, mindrazor).map(
      (row) => row.unit.name,
    );
    expect(candidates).toContain("Blood Sisters");
    expect(candidates).toContain("Blood Stalkers");

    list.powerBinds = {
      [powerBindKey("spell", "Mindrazor")]: "u1",
      [powerBindKey("spell", "Black Horror of Ulgu")]: "Enemy Witch Aelves",
    };

    const notes = combatModifierNotes(list, faction);
    expect(
      notes.some(
        (note) => note.selectionId === "u1" && note.powerName === "Mindrazor",
      ),
    ).toBe(true);
    expect(
      notes.some(
        (note) =>
          note.selectionId === null &&
          note.enemyLabel === "Enemy Witch Aelves",
      ),
    ).toBe(true);
  });
});
