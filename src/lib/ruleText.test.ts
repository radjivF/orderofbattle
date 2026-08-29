import { describe, expect, it } from "vitest";
import { parseRuleText } from "./ruleText";

describe("parseRuleText", () => {
  it("keeps plain paragraphs intact", () => {
    expect(parseRuleText("Add 1 to hit rolls for this unit.")).toEqual([
      { kind: "prose", text: "Add 1 to hit rolls for this unit." },
    ]);
  });

  it("splits catalogue bullet lists into prose plus items", () => {
    expect(
      parseRuleText(
        "Roll a D3 for each target. On a 2+: • Inflict mortal damage on the target. • Subtract 1 from save rolls.",
      ),
    ).toEqual([
      { kind: "prose", text: "Roll a D3 for each target. On a 2+:" },
      {
        kind: "bullets",
        items: [
          "Inflict mortal damage on the target.",
          "Subtract 1 from save rolls.",
        ],
      },
    ]);
  });

  it("splits In addition follow-up clauses into equal bullet items", () => {
    expect(
      parseRuleText(
        'Add 1 to casting rolls for friendly Wizards while they are wholly within 12" of this unit. In addition, this unit can use Spell abilities from the Lore of Hysh.',
      ),
    ).toEqual([
      {
        kind: "bullets",
        items: [
          'Add 1 to casting rolls for friendly Wizards while they are wholly within 12" of this unit.',
          "This unit can use Spell abilities from the Lore of Hysh.",
        ],
      },
    ]);
  });

  it("handles bullet-only rules", () => {
    expect(parseRuleText("• First clause. • Second clause.")).toEqual([
      {
        kind: "bullets",
        items: ["First clause.", "Second clause."],
      },
    ]);
  });
});
