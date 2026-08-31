import { describe, expect, it } from "vitest";
import { exportArmyListText } from "./exportText";
import {
  LIST_IMPORT_HELP,
  listContentKey,
  parsePortableLists,
  parsePortableListsJson,
  partitionPortableLists,
  portableAllListsFileName,
  portableListFileName,
  serializeListsFile,
  serializeListsJson,
} from "./listPortable";
import { getFaction, heroesOf, unitsForRealm } from "./queries";
import { catalogueForList } from "./spearhead";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import { blankPathToGlory } from "./listFactories";

describe("listPortable", () => {
  it("round-trips a list through the export text file", () => {
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
      formationId: faction.formations[0]?.id ?? null,
      regiments: [
        {
          id: regimentId,
          hero: { id: createId(), unitId: hero.id, reinforced: false },
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

    const raw = serializeListsFile([list]);
    expect(raw).toContain("=== Order of Battle ===");
    expect(raw.startsWith("{")).toBe(false);

    const parsed = parsePortableLists(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists).toHaveLength(1);
    const imported = parsed.lists[0];
    expect(imported?.name).toBe("Hammerhost");
    expect(imported?.factionId).toBe("stormcast-eternals");
    expect(imported?.id).not.toBe(list.id);
    expect(imported?.regiments[0]?.hero?.unitId).toBe(hero.id);
    expect(imported?.regiments[0]?.units[0]?.unitId).toBe(companion.id);
    expect(imported?.regiments[0]?.units[0]?.reinforced).toBe(
      Boolean(companion.reinforce),
    );
    expect(listContentKey(imported!)).toBe(listContentKey(list));
  });

  it("round-trips two lists in one text file", () => {
    const first = blankArmy("stormcast-eternals", "First", 2000);
    const second = blankArmy("cities-of-sigmar", "Second", 1500);
    const raw = serializeListsFile([first, second]);
    const parsed = parsePortableLists(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists.map((item) => item.name)).toEqual(["First", "Second"]);
    expect(parsed.lists[1]?.pointsCap).toBe(1500);
  });

  it("reads the same text the builder export produces", () => {
    const list = blankArmy("stormcast-eternals", "From builder", 2000);
    const faction = catalogueForList(list);
    expect(faction).toBeTruthy();
    if (!faction) return;
    const parsed = parsePortableLists(exportArmyListText(list, faction));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.name).toBe("From builder");
    expect(parsed.lists[0]?.factionId).toBe("stormcast-eternals");
  });

  it("round-trips a Path to Glory list through the export text file", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    const anvil = faction?.units.find((unit) =>
      unit.name.startsWith("Anvil of Apotheosis"),
    );
    const artefact = faction?.artefacts.find(
      (item) => item.name === "The Carrion Dirge",
    );
    const infected = anvil?.anvilForge
      ?.flatMap((group) => group.options)
      .find((option) => option.name === "Infected Warrior");
    expect(faction && anvil && artefact && infected).toBeTruthy();
    if (!faction || !anvil || !artefact || !infected) return;

    const regimentId = createId();
    const list = {
      ...blankPathToGlory(faction.id, ["ascension", "ravaged-coast"]),
      name: "Rotgarden",
      generalRegimentId: regimentId,
      pointsCap: 1000,
      regiments: [
        {
          id: regimentId,
          hero: {
            id: createId(),
            unitId: anvil.id,
            reinforced: false,
            pathToGlory: {
              renown: 5,
              pathId: "path-of-the-attacker",
              pathOptionIds: ["4564-988b-2147-1ba8"],
              battleWoundId: null,
              scarId: null,
              anvilRankId: anvil.anvilRanks?.find(
                (rank) => rank.name === "Lord of Decay",
              )?.id,
              anvilPickIds: [infected.id],
              artefactId: artefact.id,
            },
          },
          units: [],
        },
      ],
    };

    const parsed = parsePortableLists(exportArmyListText(list, faction));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const imported = parsed.lists[0];
    expect(imported?.kind).toBe("pathToGlory");
    expect(imported?.pathToGlory?.packIds).toEqual([
      "ascension",
      "ravaged-coast",
    ]);
    expect(imported?.regiments[0]?.hero?.pathToGlory?.anvilRankId).toBe(
      list.regiments[0]?.hero?.pathToGlory?.anvilRankId,
    );
    expect(imported?.regiments[0]?.hero?.pathToGlory?.anvilPickIds).toEqual([
      infected.id,
    ]);
    expect(imported?.regiments[0]?.hero?.pathToGlory?.pathId).toBe(
      "path-of-the-attacker",
    );
    expect(imported?.regiments[0]?.hero?.pathToGlory?.pathOptionIds).toContain(
      "4564-988b-2147-1ba8",
    );
    expect(imported?.regiments[0]?.hero?.pathToGlory?.artefactId).toBe(
      artefact.id,
    );
    expect(imported?.regiments[0]?.hero?.pathToGlory?.renown).toBe(5);
  });

  it("round-trips a list through JSON export", () => {
    const list = blankArmy("stormcast-eternals", "Json host", 2000);
    const raw = serializeListsJson([list]);
    expect(raw.startsWith("[")).toBe(true);

    const parsed = parsePortableLists(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.name).toBe("Json host");
    expect(parsed.lists[0]?.id).toBe(list.id);
  });

  it("reads a wrapped JSON export with a lists field", () => {
    const list = blankArmy("cities-of-sigmar", "Wrapped", 1500);
    const parsed = parsePortableListsJson(
      JSON.stringify({ version: 1, lists: [list] }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.lists[0]?.name).toBe("Wrapped");
  });

  it("rejects files that are not an Order of Battle list", () => {
    expect(parsePortableLists("").ok).toBe(false);
    expect(parsePortableLists("not a list").ok).toBe(false);
    expect(parsePortableLists("{not json").ok).toBe(false);
    const failed = parsePortableLists("{not json");
    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(failed.error).toBe("That file is not an Order of Battle list.");
    expect(LIST_IMPORT_HELP).toContain("Warhammer");
    expect(LIST_IMPORT_HELP).toContain("New Recruit");
    expect(LIST_IMPORT_HELP).toContain("paste");
    expect(LIST_IMPORT_HELP).toContain(".json");
  });

  it("names download files for text and json", () => {
    expect(portableAllListsFileName("text")).toBe("order-of-battle-lists.txt");
    expect(portableAllListsFileName("json")).toBe("order-of-battle-lists.json");
    expect(portableListFileName("My Cool List!", "text")).toBe("My-Cool-List.txt");
    expect(portableListFileName("My Cool List!", "json")).toBe("My-Cool-List.json");
  });

  it("skips lists that are already on the device and keeps new ones", () => {
    const existing = blankArmy("stormcast-eternals", "Hammerhost", 2000);
    const twin = {
      ...blankArmy("stormcast-eternals", "Hammerhost", 2000),
      id: createId(),
    };
    const fresh = blankArmy("cities-of-sigmar", "Free Cities", 2000);
    const split = partitionPortableLists([twin, fresh, twin], [existing]);
    expect(split.skipped).toBe(2);
    expect(split.novel).toHaveLength(1);
    expect(split.novel[0]?.name).toBe("Free Cities");
  });
});
