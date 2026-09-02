import { describe, expect, it } from "vitest";
import {
  addTowUnit,
  blankTowArmy,
  setTowMagicItems,
} from "./listFactories";
import {
  serializeTowListText,
  towPlayRemaining,
  towSummarize,
} from "./validate";

describe("towSummarize", () => {
  it("counts per-model points and flags a core-less army", () => {
    let list = blankTowArmy("the-empire-of-man", "Host", 2000);
    list = addTowUnit(list, "captain-of-the-empire")!;
    const totals = towSummarize(list);
    expect(totals.points).toBe(45);
    expect(totals.byCategory.characters).toBe(45);
    expect(totals.issues.some((issue) => issue.text.includes("Core"))).toBe(
      true,
    );
    // Category % uses the points limit, not spent — 45/2000 is under 50%.
    expect(
      totals.issues.some((issue) => issue.text.includes("Characters are over")),
    ).toBe(false);
  });

  it("measures category caps against the chosen points limit", () => {
    let list = blankTowArmy("the-empire-of-man", "Host", 400);
    list = addTowUnit(list, "general-of-the-empire")!;
    list = {
      ...list,
      selections: [
        {
          ...list.selections[0]!,
          optionIds: ["imperial-griffon"],
        },
      ],
    };
    // 90 + 160 = 250 → over 50% of a 400pt limit, under 50% of 2000.
    expect(towSummarize(list).byCategory.characters).toBe(250);
    expect(
      towSummarize(list).issues.some((issue) =>
        issue.text.includes("Characters are over 50%"),
      ),
    ).toBe(true);

    list = { ...list, pointsCap: 2000 };
    expect(
      towSummarize(list).issues.some((issue) =>
        issue.text.includes("Characters are over 50%"),
      ),
    ).toBe(false);
  });

  it("charges weapon options per model on rank and file", () => {
    let list = blankTowArmy("the-empire-of-man");
    list = addTowUnit(list, "state-troops")!;
    list = {
      ...list,
      selections: [
        {
          ...list.selections[0]!,
          optionIds: ["halberd"],
        },
      ],
    };
    expect(towSummarize(list).points).toBe(10 * 5 + 10 * 1);
  });

  it("requires a General when the list has units", () => {
    let list = blankTowArmy("the-empire-of-man", "Host", 2000);
    list = addTowUnit(list, "state-troops")!;
    list = { ...list, generalSelectionId: null };
    expect(
      towSummarize(list).issues.some((issue) =>
        issue.text.includes("Choose a General"),
      ),
    ).toBe(true);
  });

  it("adds magic item points to the character loadout", () => {
    let list = blankTowArmy("the-empire-of-man", "Host", 2000);
    list = addTowUnit(list, "captain-of-the-empire")!;
    list = setTowMagicItems(list, list.selections[0]!.id, ["spell-familiar"]);
    expect(towSummarize(list).points).toBe(45 + 15);
  });

  it("flags duplicate magic items across the army", () => {
    let list = blankTowArmy("the-empire-of-man", "Host", 2000);
    list = addTowUnit(list, "captain-of-the-empire")!;
    list = addTowUnit(list, "wizard-lord")!;
    list = setTowMagicItems(list, list.selections[0]!.id, ["spell-familiar"]);
    list = setTowMagicItems(list, list.selections[1]!.id, ["spell-familiar"]);
    expect(
      towSummarize(list).issues.some((issue) =>
        /taken more than once/i.test(issue.text),
      ),
    ).toBe(true);
  });

  it("flags a second copy of a named character", () => {
    let list = blankTowArmy("wood-elf-realms", "Hunt", 2000);
    list = addTowUnit(list, "orion-the-king-in-the-woods")!;
    list = {
      ...list,
      selections: [
        list.selections[0]!,
        {
          ...list.selections[0]!,
          id: "orion-copy",
        },
      ],
    };
    expect(
      towSummarize(list).issues.some((issue) =>
        /only be taken once/i.test(issue.text),
      ),
    ).toBe(true);
  });
});

describe("serializeTowListText", () => {
  it("exports command, options, and magic items on the unit line", () => {
    let list = blankTowArmy("the-empire-of-man", "Export host", 2000);
    list = addTowUnit(list, "captain-of-the-empire")!;
    list = {
      ...list,
      selections: [
        {
          ...list.selections[0]!,
          commandIds: ["battle-standard-bearer"],
          optionIds: ["great-weapon"],
          magicItemIds: ["spell-familiar"],
        },
      ],
    };
    const text = serializeTowListText(list);
    expect(text).toContain("Captain of the Empire");
    expect(text).toMatch(/Battle Standard Bearer/);
    expect(text).toMatch(/Great Weapon/);
    expect(text).toMatch(/Spell Familiar/);
  });
});

describe("towPlayRemaining", () => {
  it("tracks remaining models on State Troops and wounds on a captain", () => {
    let list = blankTowArmy("the-empire-of-man");
    list = addTowUnit(list, "state-troops")!;
    list = addTowUnit(list, "captain-of-the-empire")!;
    const troops = { ...list.selections[0]!, play: { damage: 2 } };
    const captain = { ...list.selections[1]!, play: { damage: 1 } };
    expect(towPlayRemaining(troops, list.factionId)).toEqual({
      kind: "models",
      current: 8,
      max: 10,
    });
    expect(towPlayRemaining(captain, list.factionId)).toEqual({
      kind: "wounds",
      current: 1,
      max: 2,
    });
  });
});
