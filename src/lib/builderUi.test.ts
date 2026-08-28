import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BUILDER_LIST_NAME_INPUT_CLASS,
  EMPTY_LIBRARY_CTA_CLASS,
  EMPTY_LIBRARY_PANEL_CLASS,
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  IOS_LIQUID_CTA_CLASS,
  HOME_CTA_CLASS,
  HOME_CTA_QUIET_CLASS,
  IOS_NAV_ADD_BUTTON_CLASS,
  IOS_NAV_BACK_BUTTON_CLASS,
  IOS_NAV_PLAY_BUTTON_CLASS,
  LIBRARY_CARD_CLASS,
  LIST_ISSUE_BANNER_CLASS,
  PLAY_SHEET_LINK_CLASS,
  PLAY_UNIT_NAME_ROW_CLASS,
  SHEET_PANEL_CLASS,
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

describe("iOS nav controls", () => {
  it("uses a light liquid-glass add circle, not gold-plate or dark glass", () => {
    expect(IOS_NAV_ADD_BUTTON_CLASS).toContain("ios-liquid-glass");
    expect(IOS_NAV_ADD_BUTTON_CLASS).toContain("rounded-full");
    expect(IOS_NAV_ADD_BUTTON_CLASS).toContain("text-black");
    expect(IOS_NAV_ADD_BUTTON_CLASS).not.toContain("gold-plate");
    expect(IOS_NAV_ADD_BUTTON_CLASS).not.toContain("ios-glass");

    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    expect(css).toContain(".ios-liquid-glass");
    expect(css).toContain("color: #000");
    expect(css).toContain("background: var(--parchment)");
    expect(css).not.toContain("82%, transparent");
  });

  it("uses a liquid-glass chevron for back, with no Lists label", () => {
    expect(IOS_NAV_BACK_BUTTON_CLASS).toContain("ios-liquid-glass");
    expect(IOS_NAV_BACK_BUTTON_CLASS).toContain("rounded-full");
    expect(IOS_NAV_BACK_BUTTON_CLASS).toContain("text-black");

    const header = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ListFlowHeader.tsx",
      ),
      "utf8",
    );
    expect(header).toContain('label="New list"');
    expect(header).toContain('label={playMode ? "Build" : "Lists"}');
    expect(header).not.toContain("<span>{label}</span>");
    expect(IOS_NAV_PLAY_BUTTON_CLASS).toContain("ios-liquid-glass");
    expect(IOS_NAV_PLAY_BUTTON_CLASS).toContain("text-black");
  });
});

describe("empty library CTA", () => {
  it("uses a liquid-glass button, not body copy as the action", () => {
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("ios-liquid-glass");
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("text-black");
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("min-h-11");
    expect(EMPTY_LIBRARY_CTA_CLASS).not.toContain("gold-plate");
    expect(IOS_LIQUID_CTA_CLASS).toContain("ios-liquid-glass");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("rounded-2xl");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("mx-auto");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("text-center");

    const screen = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryScreen.tsx",
      ),
      "utf8",
    );
    expect(screen).toContain("Make your first list");
    expect(screen).toContain("EMPTY_LIBRARY_CTA_CLASS");
    expect(screen).toContain("setPicking(true)");
    expect(screen).not.toContain("No armies yet. Make your first list.");
  });
});

describe("homepage CTAs", () => {
  it("uses soft gold on the hero, not parchment glass", () => {
    expect(HOME_CTA_CLASS).toContain("home-cta");
    expect(HOME_CTA_CLASS).not.toContain("ios-liquid-glass");
    expect(HOME_CTA_QUIET_CLASS).toContain("home-cta-quiet");

    const landing = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/TryLanding.tsx",
      ),
      "utf8",
    );
    expect(landing).toContain("HOME_CTA_CLASS");
    expect(landing).toContain("HOME_CTA_QUIET_CLASS");
    expect(landing).not.toContain("gold-plate");
    expect(landing).not.toContain("IOS_LIQUID_PILL_CLASS");

    const footer = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/SiteFooter.tsx",
      ),
      "utf8",
    );
    expect(footer).toContain("HOME_CTA_CLASS");
    expect(footer).not.toContain("gold-plate");
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

describe("iOS polish contracts", () => {
  it("uses pressable on liquid-glass and home CTAs", () => {
    expect(IOS_NAV_ADD_BUTTON_CLASS).toContain("pressable");
    expect(IOS_LIQUID_CTA_CLASS).toContain("pressable");
    expect(HOME_CTA_CLASS).toContain("pressable");

    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    expect(css).toContain(".pressable:active");
    expect(css).toContain("transform: scale(0.97)");
  });

  it("defines bottom sheet animation and grabber", () => {
    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    expect(css).toContain(".modal-sheet");
    expect(css).toContain(".modal-grabber");
    expect(css).toContain("@keyframes modal-sheet-in");

    const modal = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ModalFrame.tsx",
      ),
      "utf8",
    );
    expect(modal).toContain('variant?: "sheet" | "center"');
    expect(modal).toContain("onSheetPointerDown");
    expect(modal).toContain("modal-grabber");
    expect(modal).toContain("acquireModalLayer");
    expect(modal).toContain("isTopModal");
    expect(modal).toContain("modal-scrim");
    expect(modal).toContain("pointer-events-auto");
  });

  it("uses sheet panel classes without hard-coded rounded-2xl on modals", () => {
    expect(SHEET_PANEL_CLASS).toContain("max-h-[85vh]");
    expect(SHEET_PANEL_CLASS).toContain("sm:rounded-2xl");

    const library = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryScreen.tsx",
      ),
      "utf8",
    );
    expect(library).toContain("SHEET_PANEL_CLASS");
    expect(library).toContain("ios-action-sheet");
  });

  it("removes persistent underline from builder list name", () => {
    expect(BUILDER_LIST_NAME_INPUT_CLASS).toContain("border-transparent");
    expect(BUILDER_LIST_NAME_INPUT_CLASS).toContain("focus:border-parchment/25");
    expect(BUILDER_LIST_NAME_INPUT_CLASS).not.toMatch(/(?<!focus:)border-parchment\/25/);
  });

  it("uses pressable library cards and rounded-xl points cap", () => {
    expect(LIBRARY_CARD_CLASS).toContain("pressable");
    expect(LIBRARY_CARD_CLASS).toContain("rounded-2xl");
    expect(pointsCapInputClass("ink")).toContain("rounded-xl");
    expect(pointsCapInputClass("ink")).not.toContain("rounded-[10px]");
  });

  it("uses solid parchment chip for selected segments", () => {
    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    expect(css).toContain(".ios-segmented-option--selected");
    expect(css).toMatch(
      /\.ios-segmented-option--selected[\s\S]*background: var\(--parchment\)/,
    );
  });
});
