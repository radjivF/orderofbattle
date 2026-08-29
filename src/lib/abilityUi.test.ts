import { describe, expect, it } from "vitest";
import { castValueLabel, chantValueLabel, formatCastValue } from "./abilityUi";

describe("formatCastValue", () => {
  it("appends + to numeric casting values", () => {
    expect(formatCastValue("7")).toBe("7+");
    expect(formatCastValue(" 5 ")).toBe("5+");
  });

  it("leaves values that already include +", () => {
    expect(formatCastValue("7+")).toBe("7+");
  });

  it("returns empty for blank input", () => {
    expect(formatCastValue("")).toBe("");
    expect(formatCastValue("   ")).toBe("");
  });
});

describe("castValueLabel", () => {
  it("formats cast labels", () => {
    expect(castValueLabel("7")).toBe("Cast 7+");
    expect(castValueLabel("")).toBe("");
  });
});

describe("chantValueLabel", () => {
  it("formats chant labels", () => {
    expect(chantValueLabel("4")).toBe("Chant 4+");
  });
});
