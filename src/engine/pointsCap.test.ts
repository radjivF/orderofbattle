import { describe, expect, it } from "vitest";
import {
  STANDARD_POINTS_CAPS,
  formatPoints,
  isStandardPointsCap,
  parsePointsCap,
} from "./pointsCap";

describe("pointsCap", () => {
  it("recognizes standard caps", () => {
    for (const cap of STANDARD_POINTS_CAPS) {
      expect(isStandardPointsCap(cap)).toBe(true);
    }
    expect(isStandardPointsCap(500)).toBe(false);
  });

  it("parses digits from free text", () => {
    expect(parsePointsCap("2,000 pts")).toBe(2000);
    expect(parsePointsCap("")).toBeNull();
    expect(parsePointsCap("abc")).toBeNull();
    expect(parsePointsCap("0")).toBeNull();
  });

  it("caps parsed values at 99_999", () => {
    expect(parsePointsCap("999999")).toBe(99_999);
  });

  it("formats points with grouping", () => {
    expect(formatPoints(2000)).toBe("2,000");
  });
});
