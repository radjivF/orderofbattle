import { describe, expect, it } from "vitest";
import { blankArmy, normalizeArmyList } from "../listFactories";
import {
  addTowDetachment,
  addTowUnit,
  blankTowArmy,
  isTowList,
  normalizeTowList,
} from "./listFactories";

describe("blankTowArmy", () => {
  it("creates an Empire list tagged as Old World", () => {
    const list = blankTowArmy("the-empire-of-man", "My Empire", 2000);
    expect(list.game).toBe("tow");
    expect(list.factionId).toBe("the-empire-of-man");
    expect(list.name).toBe("My Empire");
    expect(list.pointsCap).toBe(2000);
    expect(list.selections).toEqual([]);
  });
});

describe("normalizeArmyList", () => {
  it("defaults missing game to Age of Sigmar so old saves still load", () => {
    const list = blankArmy("stormcast-eternals", "Old save");
    const restored = normalizeArmyList({ ...list, game: undefined });
    expect(isTowList(restored)).toBe(false);
    expect(restored.game).toBe("aos");
    expect(restored.factionId).toBe("stormcast-eternals");
  });
});

describe("normalizeTowList", () => {
  it("fills missing general and selections", () => {
    const list = blankTowArmy("the-empire-of-man");
    const restored = normalizeTowList({
      ...list,
      generalSelectionId: undefined as unknown as null,
      selections: undefined as unknown as [],
    });
    expect(restored.game).toBe("tow");
    expect(restored.selections).toEqual([]);
    expect(restored.generalSelectionId).toBeNull();
  });
});

describe("addTowUnit", () => {
  it("adds State Troops at minimum models and a captain as general", () => {
    let list = blankTowArmy("the-empire-of-man");
    list = addTowUnit(list, "state-troops")!;
    expect(list.selections).toHaveLength(1);
    expect(list.selections[0]?.models).toBe(10);
    expect(list.generalSelectionId).toBeNull();

    list = addTowUnit(list, "captain-of-the-empire")!;
    expect(list.selections).toHaveLength(2);
    expect(list.generalSelectionId).toBe(list.selections[1]?.id);
  });
});

describe("addTowDetachment", () => {
  it("nests a missile detachment under State Troops", () => {
    let list = blankTowArmy("the-empire-of-man");
    list = addTowUnit(list, "state-troops")!;
    const parentId = list.selections[0]!.id;
    list = addTowDetachment(list, parentId, "state-missile-troops")!;
    expect(list.selections[0]?.detachments).toHaveLength(1);
    expect(list.selections[0]?.detachments[0]?.unitId).toBe(
      "state-missile-troops",
    );
  });
});
