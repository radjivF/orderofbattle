import { describe, expect, it } from "vitest";
import { blankArmy, blankPathToGlory, normalizeArmyList } from "@/engine/listFactories";
import { createId } from "@/lib/id";
import { getFaction, unitHasKeyword } from "@/engine/queries";
import type { ArmyList } from "@/engine/types";
import { summarize } from "@/engine/validate";
import {
  applyPathToGloryPacks,
  factionManifestationPicks,
  factionSpellPicks,
  findPath,
  isPathToGloryList,
  learnedManifestationsForList,
  learnedSpellKey,
  learnedSpellsForList,
  packLabel,
  pathsForPacks,
  pathsForPreset,
  patchPathToGloryState,
  patchSelection,
  pathToGloryManifestationPoints,
  pickPathOption,
  prunePathOptionIds,
  rankForRenown,
  resolveBattlepacks,
  selectionDisplayName,
  showsBattleWoundsAndScars,
  toggleLearnedId,
  togglePathToGloryPack,
} from "@/engine/pathToGlory";

describe("resolveBattlepacks", () => {
  it("maps old nested presets onto pack ids", () => {
    expect(resolveBattlepacks("ascension")).toEqual(["ascension"]);
    expect(resolveBattlepacks("ravaged-coast")).toEqual([
      "ascension",
      "ravaged-coast",
    ]);
    expect(resolveBattlepacks("blighted-wilds")).toEqual([
      "ascension",
      "ravaged-coast",
      "blighted-wilds",
    ]);
    expect(resolveBattlepacks("all")).toEqual(resolveBattlepacks("blighted-wilds"));
  });
});

describe("togglePathToGloryPack", () => {
  it("keeps packs independent and never empty", () => {
    expect(togglePathToGloryPack(["ascension"], "ravaged-coast")).toEqual([
      "ascension",
      "ravaged-coast",
    ]);
    expect(togglePathToGloryPack(["ravaged-coast"], "ascension")).toEqual([
      "ascension",
      "ravaged-coast",
    ]);
    expect(togglePathToGloryPack(["ascension"], "ascension")).toEqual([
      "ascension",
    ]);
  });
});

describe("rankForRenown", () => {
  it("maps thresholds from the Path to Glory rank table", () => {
    expect(rankForRenown(0)).toBe("untested");
    expect(rankForRenown(4)).toBe("untested");
    expect(rankForRenown(5)).toBe("aspiring");
    expect(rankForRenown(14)).toBe("aspiring");
    expect(rankForRenown(15)).toBe("elite");
    expect(rankForRenown(30)).toBe("mighty");
    expect(rankForRenown(45)).toBe("legendary");
  });
});

describe("blankPathToGlory", () => {
  it("marks the list Path to Glory and keeps Regiment of Renown available", () => {
    const list = blankPathToGlory("stormcast-eternals", "ravaged-coast");
    expect(isPathToGloryList(list)).toBe(true);
    expect(list.pathToGlory?.packIds).toEqual(["ravaged-coast"]);
    expect(list.pathToGlory?.spellIds).toEqual([]);
    expect(list.pathToGlory?.manifestationIds).toEqual([]);
    expect(list.spellLoreId).toBeNull();
    expect(list.manifestationLoreId).toBeNull();
    expect(list.regimentOfRenown).toBeNull();
    expect(showsBattleWoundsAndScars(list)).toBe(true);
    expect(isPathToGloryList(blankArmy("stormcast-eternals"))).toBe(false);
    expect(showsBattleWoundsAndScars(blankPathToGlory("stormcast-eternals", "ascension"))).toBe(
      false,
    );
  });
});

describe("pathsForPacks", () => {
  it("does not nest Ascension into Ravaged Coast", () => {
    const ascension = pathsForPacks(["ascension"]).map((path) => path.name);
    const coast = pathsForPacks(["ravaged-coast"]).map((path) => path.name);
    expect(ascension).toContain("Path of the Warrior");
    expect(ascension).not.toContain("Path of the Zealot");
    expect(coast).not.toContain("Path of the Warrior");
    expect(coast).toContain("Path of the Zealot");
    expect(packLabel("ravaged-coast")).toBe("Ravaged Coast");
    expect(pathsForPreset("ravaged-coast").map((path) => path.name)).toContain(
      "Path of the Warrior",
    );
    expect(
      pathsForPacks(["blighted-wilds"]).map((path) => path.name),
    ).toContain("Path of the Thyrian Druid");
  });
});

describe("Path abilities", () => {
  it("lets Elite rank pick one Aspiring and one Elite ability", () => {
    const path = findPath("path-of-the-leader");
    expect(path).toBeTruthy();
    if (!path) {
      return;
    }
    const aspiring = path.options.find((option) => option.rank === "aspiring");
    const elite = path.options.find((option) => option.rank === "elite");
    const otherAspiring = path.options.find(
      (option) => option.rank === "aspiring" && option.id !== aspiring?.id,
    );
    expect(aspiring && elite && otherAspiring).toBeTruthy();
    if (!aspiring || !elite || !otherAspiring) {
      return;
    }
    expect(prunePathOptionIds(path, [aspiring.id, elite.id], 4)).toEqual([]);
    const atTwenty = pickPathOption(
      path,
      pickPathOption(path, [], aspiring.id, 20),
      elite.id,
      20,
    );
    expect(atTwenty).toEqual([aspiring.id, elite.id]);
    expect(pickPathOption(path, atTwenty, otherAspiring.id, 20)).toEqual([
      elite.id,
      otherAspiring.id,
    ]);
  });
});

describe("normalizeArmyList", () => {
  it("migrates a saved battlepackPreset into independent pack ids", () => {
    const list = normalizeArmyList({
      ...blankArmy("stormcast-eternals"),
      kind: "pathToGlory",
      pathToGlory: { battlepackPreset: "ravaged-coast" },
    } as unknown as ArmyList);
    expect(list.pathToGlory?.packIds).toEqual(["ascension", "ravaged-coast"]);
  });
});

describe("applyPathToGloryPacks", () => {
  it("drops Paths and wounds that the remaining packs do not include", () => {
    const selectionId = createId();
    const list = {
      ...blankPathToGlory("stormcast-eternals", [
        "ascension",
        "ravaged-coast",
      ]),
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: selectionId,
            unitId: "hero",
            reinforced: false,
            pathToGlory: {
              renown: 5,
              pathId: "path-of-the-zealot",
              pathOptionIds: [],
              battleWoundId: "drained",
              scarId: "ash-blighted",
            },
          },
          units: [],
        },
      ],
    };
    const next = applyPathToGloryPacks(list, ["ascension"]);
    expect(next.pathToGlory?.packIds).toEqual(["ascension"]);
    expect(next.regiments[0]?.hero?.pathToGlory?.pathId).toBeNull();
    expect(next.regiments[0]?.hero?.pathToGlory?.battleWoundId).toBeNull();
    expect(next.regiments[0]?.hero?.pathToGlory?.scarId).toBeNull();
  });
});

describe("learned spells and manifestations", () => {
  it("picks spells and manifestations one by one instead of a whole lore", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) {
      return;
    }
    const spell = factionSpellPicks(faction)[0];
    const otherSpell = factionSpellPicks(faction)[1];
    const manifestation = factionManifestationPicks(faction)[0];
    const otherManifestation = factionManifestationPicks(faction)[1];
    expect(spell && otherSpell && manifestation && otherManifestation).toBeTruthy();
    if (!spell || !otherSpell || !manifestation || !otherManifestation) {
      return;
    }

    const list = patchPathToGloryState(
      blankPathToGlory("stormcast-eternals", "ascension"),
      {
        spellIds: toggleLearnedId([], spell.key),
        manifestationIds: toggleLearnedId([], manifestation.model.id),
      },
    );
    expect(learnedSpellsForList(list, faction).map((item) => item.power.name)).toEqual([
      spell.power.name,
    ]);
    expect(learnedManifestationsForList(list, faction).map((item) => item.id)).toEqual([
      manifestation.model.id,
    ]);
    expect(learnedSpellKey(spell.loreId, spell.power.name)).toBe(spell.key);
    expect(pathToGloryManifestationPoints(list, faction)).toBe(
      manifestation.model.points ?? 0,
    );
    const lorePack = faction.manifestationLores.find((lore) =>
      lore.manifestations.some((model) => model.id === manifestation.model.id),
    );
    if (lorePack?.points) {
      expect(pathToGloryManifestationPoints(list, faction)).not.toBe(
        lorePack.points,
      );
    }

    const wizard = faction.units.find((unit) =>
      unitHasKeyword(unit, "WIZARD"),
    );
    const wizardRegiments = wizard
      ? [
          {
            id: "reg-1",
            hero: {
              id: createId(),
              unitId: wizard.id,
              reinforced: false,
            },
            units: [],
          },
        ]
      : [];
    const withoutSpells = {
      ...blankPathToGlory("stormcast-eternals", "ascension"),
      regiments: wizardRegiments,
    };
    const withWizard = { ...list, regiments: wizardRegiments };
    expect(
      summarize(withoutSpells, faction).issues.some(
        (item) => item.text === "Learn a spell.",
      ),
    ).toBe(Boolean(wizard));
    expect(
      summarize(withWizard, faction).issues.some(
        (item) => item.text === "Choose a spell lore.",
      ),
    ).toBe(false);
    expect(
      summarize(withWizard, faction).issues.some(
        (item) => item.text === "Learn a spell.",
      ),
    ).toBe(false);

    const kept = applyPathToGloryPacks(
      {
        ...list,
        pathToGlory: {
          ...list.pathToGlory!,
          spellIds: [spell.key, otherSpell.key],
          manifestationIds: [manifestation.model.id, otherManifestation.model.id],
        },
      },
      ["ravaged-coast"],
    );
    expect(kept.pathToGlory?.spellIds).toEqual([spell.key, otherSpell.key]);
    expect(kept.pathToGlory?.manifestationIds).toEqual([
      manifestation.model.id,
      otherManifestation.model.id,
    ]);
  });
});

describe("selection overlay", () => {
  it("keeps Path to Glory kind through normalize and patches nickname without touching play damage", () => {
    const list = normalizeArmyList(
      blankPathToGlory("stormcast-eternals", "ravaged-coast"),
    );
    expect(list.kind).toBe("pathToGlory");

    const selectionId = createId();
    const withHero = {
      ...list,
      regiments: [
        {
          id: "reg-1",
          hero: {
            id: selectionId,
            unitId: "hero",
            reinforced: false,
            play: { damage: 3 },
          },
          units: [],
        },
      ],
    };
    const patched = patchSelection(withHero, selectionId, {
      nickname: "Named",
      pathToGlory: {
        renown: 5,
        pathId: "path-of-the-warrior",
        pathOptionIds: [],
        battleWoundId: "drained",
        scarId: null,
      },
    });
    const hero = patched.regiments[0]?.hero;
    expect(hero?.nickname).toBe("Named");
    expect(selectionDisplayName(hero ?? undefined, undefined)).toBe("Named");
    expect(hero?.play?.damage).toBe(3);
    expect(hero?.pathToGlory?.battleWoundId).toBe("drained");
  });
});

describe("Anvil of Apotheosis", () => {
  it("is a Stormcast Path to Glory hero with Knight as the default cost", () => {
    const faction = getFaction("stormcast-eternals");
    const anvil = faction?.units.find((unit) =>
      unit.name === "Anvil of Apotheosis: Stormcast Eternals Hero",
    );
    expect(anvil).toBeTruthy();
    expect(anvil?.hero).toBe(true);
    expect(anvil?.pathToGloryOnly).toBe(true);
    expect(anvil?.points).toBe(150);
    expect(anvil?.anvilRanks?.map((rank) => rank.points)).toEqual([
      150, 250, 350,
    ]);
  });
});
