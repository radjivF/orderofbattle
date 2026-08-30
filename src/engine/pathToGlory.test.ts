import { describe, expect, it } from "vitest";
import { blankArmy, blankPathToGlory, normalizeArmyList } from "@/engine/listFactories";
import { createId } from "@/lib/id";
import {
  battlepackPresetLabel,
  isPathToGloryList,
  patchSelection,
  pathsForPreset,
  rankForRenown,
  resolveBattlepacks,
  selectionDisplayName,
  showsBattleWoundsAndScars,
} from "@/engine/pathToGlory";

describe("resolveBattlepacks", () => {
  it("nests Coast and Wilds on top of Ascension", () => {
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
    expect(list.pathToGlory?.battlepackPreset).toBe("ravaged-coast");
    expect(list.regimentOfRenown).toBeNull();
    expect(showsBattleWoundsAndScars(list)).toBe(true);
    expect(isPathToGloryList(blankArmy("stormcast-eternals"))).toBe(false);
    expect(showsBattleWoundsAndScars(blankPathToGlory("stormcast-eternals", "ascension"))).toBe(
      false,
    );
  });
});

describe("pathsForPreset", () => {
  it("adds Ravaged Coast Paths when Coast is included", () => {
    const ascension = pathsForPreset("ascension").map((path) => path.name);
    const coast = pathsForPreset("ravaged-coast").map((path) => path.name);
    expect(ascension).toContain("Path of the Warrior");
    expect(ascension).not.toContain("Path of the Zealot");
    expect(coast).toContain("Path of the Warrior");
    expect(coast).toContain("Path of the Zealot");
    expect(battlepackPresetLabel("ravaged-coast")).toBe("Ravaged Coast");
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
