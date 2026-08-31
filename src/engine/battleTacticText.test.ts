import { describe, expect, it } from "vitest";
import { splitBattleTacticText } from "./battleTacticText";

describe("splitBattleTacticText", () => {
  it("splits the tactic name from the completion rule", () => {
    expect(
      splitBattleTacticText(
        "Master of Arms: You complete this battle tactic at the end of your turn.",
      ),
    ).toEqual({
      name: "Master of Arms",
      body: "You complete this battle tactic at the end of your turn.",
    });
  });

  it("keeps later colons in the body", () => {
    expect(
      splitBattleTacticText("Feign Weakness: Destroyed this turn: more friends."),
    ).toEqual({
      name: "Feign Weakness",
      body: "Destroyed this turn: more friends.",
    });
  });

  it("returns the whole line as body when there is no name", () => {
    expect(splitBattleTacticText("")).toEqual({ name: "", body: "" });
    expect(splitBattleTacticText("You complete this battle tactic.")).toEqual({
      name: "",
      body: "You complete this battle tactic.",
    });
  });
});
