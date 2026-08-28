import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  LIST_ISSUE_BANNER_CLASS,
  PLAY_SHEET_LINK_CLASS,
  PLAY_UNIT_NAME_ROW_CLASS,
  builderHeaderShowsListStats,
  builderHeaderShowsPlayButton,
  dropCountLabel,
  pointsCapInputClass,
} from "./builderUi";

describe("dropCountLabel", () => {
  it("pluralizes drop counts for the header", () => {
    expect(dropCountLabel(0)).toBe("0 drops");
    expect(dropCountLabel(1)).toBe("1 drop");
    expect(dropCountLabel(3)).toBe("3 drops");
  });
});

describe("builder header stats", () => {
  it("keeps points and drops visible in play mode", () => {
    expect(builderHeaderShowsListStats(true)).toBe(true);
    expect(builderHeaderShowsPlayButton(true)).toBe(false);
    expect(builderHeaderShowsPlayButton(false)).toBe(true);
  });

  it("hides stats only when chrome has not loaded", () => {
    expect(builderHeaderShowsListStats(false)).toBe(false);
  });

  it("stacks drops on a second line under points", () => {
    expect(HEADER_STATS_STACK_CLASS).toContain("leading-none");
    expect(HEADER_DROPS_LINE_CLASS).toContain("mt-0.5");
    expect(HEADER_DROPS_LINE_CLASS).not.toContain("block text-sm text-aether");
  });
});

describe("pointsCapInputClass", () => {
  it("uses parchment fill instead of ios-glass on the custom points field", () => {
    const ink = pointsCapInputClass("ink");
    expect(ink).toContain("bg-parchment");
    expect(ink).toContain("text-parchment-ink");
    expect(ink).not.toContain("ios-glass");

    const parchment = pointsCapInputClass("parchment");
    expect(parchment).toContain("bg-parchment-ink/5");
    expect(parchment).not.toContain("ios-glass");
  });
});

describe("list issue banner", () => {
  it("uses an opaque illegal fill, not a faint wash", () => {
    expect(LIST_ISSUE_BANNER_CLASS).toContain("bg-illegal/25");
    expect(LIST_ISSUE_BANNER_CLASS).toContain("ring-illegal/40");
    expect(LIST_ISSUE_BANNER_CLASS).not.toContain("bg-illegal/5");
    expect(LIST_ISSUE_BANNER_CLASS).not.toContain("bg-illegal/10");
  });

  it("uses bold, lighter text so the warning stays readable on the fill", () => {
    expect(LIST_ISSUE_BANNER_CLASS).toContain("font-bold");
    expect(LIST_ISSUE_BANNER_CLASS).toContain("text-illegal-lit");
    expect(LIST_ISSUE_BANNER_CLASS).not.toContain("font-medium");
    expect(LIST_ISSUE_BANNER_CLASS).not.toMatch(/(?:^|\s)text-illegal(?:\s|$)/);
  });
});

describe("play-mode sheet link", () => {
  it("sits on the same row as the unit name", () => {
    expect(PLAY_UNIT_NAME_ROW_CLASS).toContain("flex");
    expect(PLAY_UNIT_NAME_ROW_CLASS).toContain("items-baseline");
    expect(PLAY_SHEET_LINK_CLASS).toContain("text-aether");
    expect(PLAY_SHEET_LINK_CLASS).not.toContain("mt-1");
    expect(PLAY_SHEET_LINK_CLASS).not.toContain("block");
  });
});

describe("select chevron inset", () => {
  it("keeps native dropdown arrows off the right edge", () => {
    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    expect(css).toContain("background-position: right 0.75rem center");
    expect(css).toContain("padding-inline-end: 2.15rem");
    expect(css).toContain("appearance: none");
  });
});
