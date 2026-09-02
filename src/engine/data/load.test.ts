import { describe, expect, it } from "vitest";
import {
  battleTacticById,
  battleTacticPickerCards,
  battleTacticRealmForPicker,
  battleTacticsForRealm,
} from "./load";

describe("battleTacticPickerCards", () => {
  it("uses the list realm and keeps selected cards from another realm visible", () => {
    const aqshy = battleTacticsForRealm("aqshy");
    const ghyran = battleTacticsForRealm("ghyran");
    const selected = [ghyran[0]!.id, ghyran[1]!.id];

    expect(battleTacticRealmForPicker("aqshy", selected)).toBe("aqshy");
    const cards = battleTacticPickerCards("aqshy", selected);
    expect(cards[0]?.id).toBe(ghyran[0]!.id);
    expect(cards[1]?.id).toBe(ghyran[1]!.id);
    expect(cards.map((card) => card.id)).toEqual([
      ghyran[0]!.id,
      ghyran[1]!.id,
      ...aqshy.map((card) => card.id),
    ]);
  });

  it("infers Ghyran from selected IDs when the list has no realm", () => {
    const [first, second] = battleTacticsForRealm("ghyran");
    expect(
      battleTacticRealmForPicker(null, [first!.id, second!.id]),
    ).toBe("ghyran");
    const cards = battleTacticPickerCards("ghyran", [first!.id]);
    expect(cards[0]?.id).toBe(first!.id);
    expect(cards).toHaveLength(6);
  });

  it("looks up a card by id", () => {
    const [card] = battleTacticsForRealm("aqshy");
    expect(battleTacticById(card!.id)).toEqual(card);
  });
});
