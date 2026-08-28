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

  it("handles bullet-only rules", () => {
    expect(parseRuleText("• First clause. • Second clause.")).toEqual([
      {
        kind: "bullets",
        items: ["First clause.", "Second clause."],
      },
    ]);
  });
});
