import { describe, expect, it } from "vitest";
import {
  formatRuleListItem,
  parsePickOneChoices,
  parseRuleText,
} from "./ruleText";

describe("parsePickOneChoices", () => {
  it("splits named pick-one options from catalogue asterisk markup", () => {
    expect(
      parsePickOneChoices(
        "Pick 1 of the following: *Magical Supremacy:* Instead of making a casting roll for the next Spell ability used by this unit this turn, you can use a value of 12 for the roll that cannot be modified. *Drain Power*: Pick a visible enemy Wizard or Priest within 18\" of this unit to be the target. Subtract 1 from the target's power level, to a minimum of 0, until the start of your next turn.",
      ),
    ).toEqual({
      preface: "Pick 1 of the following:",
      items: [
        "Magical Supremacy: Instead of making a casting roll for the next Spell ability used by this unit this turn, you can use a value of 12 for the roll that cannot be modified",
        "Drain Power: Pick a visible enemy Wizard or Priest within 18\" of this unit to be the target. Subtract 1 from the target's power level, to a minimum of 0, until the start of your next turn",
      ],
    });
  });
});

describe("parseRuleText", () => {
  it("keeps plain paragraphs intact", () => {
    expect(parseRuleText("Add 1 to hit rolls for this unit.")).toEqual({
      kind: "prose",
      text: "Add 1 to hit rolls for this unit.",
    });
  });

  it("uses a preface plus bullets for on-a-roll lists", () => {
    expect(
      parseRuleText(
        "Roll a D3 for each target. On a 2+: • Inflict mortal damage on the target. • Subtract 1 from save rolls.",
      ),
    ).toEqual({
      kind: "list",
      preface: "Roll a D3 for each target. On a 2+:",
      items: [
        "Inflict mortal damage on the target.",
        "Subtract 1 from save rolls.",
      ],
    });
  });

  it("splits In addition follow-up clauses into equal bullet items", () => {
    expect(
      parseRuleText(
        'Add 1 to casting rolls for friendly Wizards while they are wholly within 12" of this unit. In addition, this unit can use Spell abilities from the Lore of Hysh.',
      ),
    ).toEqual({
      kind: "list",
      items: [
        'Add 1 to casting rolls for friendly Wizards while they are wholly within 12" of this unit.',
        "This unit can use Spell abilities from the Lore of Hysh.",
      ],
    });
  });

  it("handles bullet-only rules", () => {
    expect(parseRuleText("• First clause. • Second clause.")).toEqual({
      kind: "list",
      items: ["First clause.", "Second clause."],
    });
  });

  it("renders pick-one effects as a preface and bullet list", () => {
    expect(
      parseRuleText(
        "Pick 1 of the following: *Magical Supremacy:* Instead of making a casting roll. *Drain Power*: Pick a visible enemy Wizard.",
      ),
    ).toEqual({
      kind: "list",
      preface: "Pick 1 of the following:",
      items: [
        "Magical Supremacy: Instead of making a casting roll",
        "Drain Power: Pick a visible enemy Wizard",
      ],
    });
  });
});

describe("formatRuleListItem", () => {
  it("extracts a short option title before the body", () => {
    expect(
      formatRuleListItem("Magical Supremacy: Instead of making a casting roll."),
    ).toEqual({
      title: "Magical Supremacy",
      body: "Instead of making a casting roll.",
      plain: "Magical Supremacy: Instead of making a casting roll.",
    });
  });
});
