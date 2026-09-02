import { describe, expect, it } from "vitest";
import {
  exportArmyListText,
  exportFileName,
} from "@/engine/exportText";
import { getFaction, heroesOf, unitsForRealm } from "@/engine/queries";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { blankPathToGlory } from "./listFactories";

describe("exportArmyListText", () => {
  it("formats a list with regiment, points, and formation", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = heroesOf(faction)[0];
    const companion = unitsForRealm(faction, null).find(
      (unit) => !unit.hero && unit.points > 0,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id, "Hammerhost", 2000),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: hero.id,
            reinforced: false,
          },
          units: [
            {
              id: createId(),
              unitId: companion.id,
              reinforced: Boolean(companion.reinforce),
            },
          ],
        },
      ],
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Hammerhost");
    expect(text).toContain(faction.name);
    expect(text).toContain("Regiment 1 — General");
    expect(text).toContain(hero.name);
    expect(text).toContain(companion.name);
    expect(text).toMatch(/2[,.]?000 pts · \d+ used/);
    expect(text).toContain("=== Order of Battle ===");
    expect(text).toContain("Built with Order of Battle");
    expect(text).toContain("http://orderofbattle.app");
    expect(text).not.toContain("Validation");
  });

  it("sanitizes download filenames", () => {
    expect(exportFileName("My Cool List!")).toBe("My-Cool-List.txt");
    expect(exportFileName("   ")).toBe("army-list.txt");
    expect(exportFileName("My Cool List!", "json")).toBe("My-Cool-List.json");
  });

  it("marks reinforced units and lists auxiliaries", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = heroesOf(faction)[0];
    const companion = unitsForRealm(faction, null).find(
      (unit) => !unit.hero && unit.reinforce && unit.points > 0,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const regimentId = createId();
    const list = {
      ...blankArmy(faction.id, "Export Aux", 2000),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
          units: [],
        },
      ],
      auxiliaries: [
        {
          id: createId(),
          unitId: companion.id,
          reinforced: true,
        },
      ],
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Auxiliaries");
    expect(text).toContain("reinforced");
    expect(text).toContain(companion.name);
  });

  it("lists battle tactic cards and special enhancements without pack duplication", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const table = faction.specialEnhancementTables?.[0];
    const option = table?.options.find((item) => item.name === "Uncaged Lightning");
    expect(table && option).toBeTruthy();
    if (!table || !option) return;

    const regimentId = createId();
    const unitId = createId();
    const hero = heroesOf(faction)[0];
    const companion = unitsForRealm(faction, null).find(
      (unit) => !unit.hero && unit.points > 0,
    );
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    const tacticIds = ["7d3c-b9b7-6412-d44e", "f94b-bda7-237e-74be"];
    const list = {
      ...blankArmy(faction.id, "Export extras", 2000),
      scourgeRealm: "aqshy" as const,
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
      battleTacticCardIds: tacticIds,
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Scourge of Aqshy");
    expect(text).toContain("Battle tactic cards: Blazing Onslaught, Siege of Ashes");
    expect(text).toContain(
      `- ${table.name}: Uncaged Lightning · 20 pts (${companion.name})`,
    );
    expect(text).not.toMatch(
      new RegExp(`${table.name}:.*${table.name}`),
    );
  });

  it("prints Path to Glory artefacts on the hero line", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    const anvil = faction?.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    const artefact = faction?.artefacts[0];
    expect(faction && anvil && artefact).toBeTruthy();
    if (!faction || !anvil || !artefact) return;

    const regimentId = createId();
    const list = {
      ...blankPathToGlory(faction.id, "ascension"),
      generalRegimentId: regimentId,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: anvil.id,
            reinforced: false,
            pathToGlory: {
              renown: 0,
              pathId: null,
              pathOptionIds: [],
              battleWoundId: null,
              scarId: null,
              artefactId: artefact.id,
            },
          },
          units: [],
        },
      ],
    };

    const text = exportArmyListText(list, faction);
    expect(text).toContain("Path to Glory · Ascension");
    expect(text).toContain(`Artefact: ${artefact.name}`);
    expect(text).not.toContain("Army enhancements");
  });
});
