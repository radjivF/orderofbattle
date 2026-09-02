import { describe, expect, it } from "vitest";
import { highlightQueryParts } from "./highlightQuery";

describe("highlightQueryParts", () => {
  it("marks each phrase match and keeps the surrounding text", () => {
    expect(
      highlightQueryParts("The battle starts at fury level 0.", "Battle Start"),
    ).toEqual([
      { text: "The ", hit: false },
      { text: "battle start", hit: true },
      { text: "s at fury level 0.", hit: false },
    ]);
  });

  it("returns the original text when the query is empty or missing", () => {
    expect(highlightQueryParts("Guarded Hero", "")).toEqual([
      { text: "Guarded Hero", hit: false },
    ]);
    expect(highlightQueryParts("Guarded Hero", "   ")).toEqual([
      { text: "Guarded Hero", hit: false },
    ]);
    expect(highlightQueryParts("Guarded Hero", "Fly")).toEqual([
      { text: "Guarded Hero", hit: false },
    ]);
  });
});
