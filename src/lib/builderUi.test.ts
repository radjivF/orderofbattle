import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BUILDER_ADD_ACTION_CLASS,
  BUILDER_ADD_ACTION_EMPHASIS_CLASS,
  BUILDER_LIST_NAME_INPUT_CLASS,
  EMPTY_LIBRARY_CTA_CLASS,
  EMPTY_LIBRARY_PANEL_CLASS,
  EMPTY_LIBRARY_SECONDARY_CLASS,
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  IOS_LIQUID_CTA_CLASS,
  HOME_CTA_CLASS,
  HOME_CTA_QUIET_CLASS,
  IOS_NAV_ADD_BUTTON_CLASS,
  IOS_NAV_BACK_BUTTON_CLASS,
  IOS_NAV_PLAY_BUTTON_CLASS,
  LIBRARY_HEADER_OPTIONS_BUTTON_CLASS,
  LIBRARY_TITLE_CLASS,
  SHEET_CHECKLIST_ITEM_CLASS,
  LIBRARY_CARD_CLASS,
  LIBRARY_CARD_LIST_NAME_INPUT_CLASS,
  LIST_FLOW_HEADER_OFFSET_CLASS,
  LIST_FLOW_SLIDE_MS,
  LIST_ISSUE_BANNER_CLASS,
  LIST_OPEN_LANDING_MS,
  LIST_BACKDROP_RETURN_MS,
  LIST_DETAIL_BACKDROP_MS,
  LIST_OPEN_SPLASH_MS,
  LIST_PANE_ART_CLASS,
  SITE_HEADER_BAR_CLASS,
  SITE_HEADER_ROW_CLASS,
  COOKIE_CONSENT_BANNER_CLASS,
  PLAY_SHEET_LINK_CLASS,
  PLAY_UNIT_NAME_ROW_CLASS,
  CONFIRM_CANCEL_BUTTON_CLASS,
  CONFIRM_SHEET_ACTIONS_CLASS,
  CONFIRM_SHEET_PANEL_CLASS,
  LIBRARY_OPTIONS_SHEET_PANEL_CLASS,
  LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS,
  SHEET_FOOTER_ACTIONS_CLASS,
  SHEET_FORM_ACTIONS_CLASS,
  SHEET_PANEL_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  builderHeaderShowsListStats,
  builderHeaderShowsPlayButton,
  builderHeaderShowsIssueDot,
  builderPlayTabs,
  playPhaseShowsCommandTab,
  playPhaseShowsCoreRulesTab,
  datasheetUnitPointsLabel,
  dropCountLabel,
  listIssueOpensAddRegiment,
  libraryListExportSubtitle,
  libraryListGameLabel,
  listIssueOpensOptions,
  pointsCapInputClass,
} from "./builderUi";

describe("dropCountLabel", () => {
  it("pluralizes drop counts for the header", () => {
    expect(dropCountLabel(0)).toBe("0 drops");
    expect(dropCountLabel(1)).toBe("1 drop");
    expect(dropCountLabel(3)).toBe("3 drops");
  });
});

describe("libraryListGameLabel", () => {
  it("shows the points cap for matched lists", () => {
    expect(
      libraryListGameLabel({ spearhead: false, pointsCap: 2000 }),
    ).toBe("2,000 pts");
    expect(
      libraryListGameLabel({ spearhead: false, pointsCap: 1400 }),
    ).toBe("1,400 pts");
  });

  it("shows spearhead and the box name when set", () => {
    expect(
      libraryListGameLabel({
        spearhead: true,
        pointsCap: 0,
        spearheadBoxName: "Vigilant Brotherhood",
      }),
    ).toBe("Spearhead · Vigilant Brotherhood");
  });
});

describe("libraryListExportSubtitle", () => {
  it("includes faction, game size, and drops for matched lists", () => {
    expect(
      libraryListExportSubtitle({
        factionName: "Stormcast Eternals",
        spearhead: false,
        pointsCap: 2000,
        drops: 3,
      }),
    ).toBe("Stormcast Eternals · 2,000 pts · 3 drops");
  });

  it("includes spearhead box name without drops", () => {
    expect(
      libraryListExportSubtitle({
        factionName: "Stormcast Eternals",
        spearhead: true,
        pointsCap: 0,
        spearheadBoxName: "Vigilant Brotherhood",
      }),
    ).toBe(
      "Stormcast Eternals · Spearhead · Vigilant Brotherhood",
    );
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

  it("hides the validation dot on Spearhead lists", () => {
    expect(builderHeaderShowsIssueDot(true, "warn")).toBe(false);
    expect(builderHeaderShowsIssueDot(true, "bad")).toBe(false);
    expect(builderHeaderShowsIssueDot(false, "warn")).toBe(true);
    expect(builderHeaderShowsIssueDot(false, "ok")).toBe(false);
  });
});

describe("builder play tabs", () => {
  it("keeps Magic and tactics out of Spearhead play", () => {
    expect(builderPlayTabs(true, false).map((item) => item.value)).toEqual([
      "units",
      "phases",
    ]);
    expect(builderPlayTabs(true, false).map((item) => item.label)).toEqual([
      "Units",
      "Phases",
    ]);
    expect(builderPlayTabs(false, false).map((item) => item.value)).toEqual([
      "units",
      "magic",
      "phases",
    ]);
    expect(builderPlayTabs(false, true).map((item) => item.label)).toEqual([
      "Units",
      "Magic",
      "Phases",
    ]);
    expect(playPhaseShowsCommandTab(true)).toBe(false);
    expect(playPhaseShowsCommandTab(false)).toBe(true);
    expect(playPhaseShowsCoreRulesTab(true)).toBe(true);
    expect(playPhaseShowsCoreRulesTab(false)).toBe(false);

    const phases = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/PlayPhaseBoard.tsx",
      ),
      "utf8",
    );
    expect(phases).toContain("playPhaseShowsCommandTab(spearhead)");
    expect(phases).toContain("playPhaseShowsCoreRulesTab(spearhead)");

    const builder = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/BuilderReady.tsx",
      ),
      "utf8",
    );
    expect(builder).toContain("builderPlayTabs(spearhead, pathToGlory)");
    expect(builder).toContain(
      'forPlayMode && playTab === "phases" && !spearhead && !pathToGlory',
    );
    expect(builder).toContain("Battlepacks · Lores · Quest");
    expect(builder).not.toContain("Points · Battlepacks · Lores · Tactics");
    expect(builder).toContain(
      'forPlayMode && playTab === "magic" && !spearhead',
    );
    expect(builder).toContain('traitKind={spearhead ? "Enhancement" : undefined}');
    expect(builder).toContain("allowUniqueHeroTrait={spearhead && regimentIsGeneral}");
    expect(builder).toContain("spearhead && !regimentIsGeneral");
    expect(builder).toContain("openNewRegimentHeroPicker");
    expect(builder).toContain("appendRegimentWithHero");
    expect(builder).not.toContain("hero: null, units: []");

    const picks = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/SpearheadPicks.tsx",
      ),
      "utf8",
    );
    expect(picks).not.toContain("Enhancement");
    expect(picks).toContain("Regiment ability");
    expect(picks).not.toContain('heading="Battle traits"');

    const card = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/RegimentCard.tsx",
      ),
      "utf8",
    );
    const cardSlots = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/RegimentCardSlots.tsx",
      ),
      "utf8",
    );
    expect(card).toContain("onPickTrait={locked ? undefined : onPickTrait}");
    expect(card).toContain("allowUniqueHeroTrait");
    expect(card).toContain("listHeroGearSlots");
    expect(card).toContain("cursor-default rounded-2xl");
    expect(cardSlots).toContain(
      "(canReinforce && onToggleReinforce) || onDuplicate || onRemove",
    );
    expect(cardSlots).toContain("uniqueKeywordBlocksEnhancements");
    expect(builder).toContain("hidePoints={spearhead}");
    expect(builder).toContain("assignPathToGloryHeroEnhancement");

    const datasheet = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/DatasheetSheet.tsx",
      ),
      "utf8",
    );
    expect(datasheet).toContain("hidePoints");
    expect(datasheet).toContain("warscrollAbilities(sheet)");
  });

  it("omits the datasheet points label on Spearhead", () => {
    expect(datasheetUnitPointsLabel(0, true)).toBeNull();
    expect(datasheetUnitPointsLabel(140, false)).toBe("140 points");
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

describe("listIssueOpensOptions", () => {
  it("opens Options for the battle tactic warning people tap", () => {
    expect(
      listIssueOpensOptions("Pick up to 2 battle tactic cards."),
    ).toBe(true);
  });

  it("stays inert for empty-list and points issues", () => {
    expect(listIssueOpensOptions("Add a regiment to begin.")).toBe(false);
    expect(listIssueOpensOptions("200 points over.")).toBe(false);
    expect(listIssueOpensOptions("")).toBe(false);
  });

  it("opens Options when they went over two tactic cards", () => {
    expect(
      listIssueOpensOptions("Maximum two battle tactic cards."),
    ).toBe(true);
  });
});

describe("listIssueOpensAddRegiment", () => {
  it("opens the hero picker for the empty-list prompt people tap", () => {
    expect(listIssueOpensAddRegiment("Add a regiment to begin.")).toBe(true);
  });

  it("stays inert for other warnings", () => {
    expect(
      listIssueOpensAddRegiment("Pick up to 2 battle tactic cards."),
    ).toBe(false);
    expect(listIssueOpensAddRegiment("Choose a spell lore.")).toBe(false);
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
    expect(header).toContain("builderHeaderShowsIssueDot");
    expect(header).not.toContain('label="List options"');
    expect(header).not.toContain('label="New list"');
    expect(header).not.toContain("IosNavImportButton");
    expect(header).not.toContain("IosNavExportButton");
    expect(header).toContain('label={playMode ? "Build" : "Lists"}');
    expect(header).toContain("onClick={playMode ? () => chrome?.exitPlay() : goBack}");
    expect(header).not.toContain('href={playMode ? undefined : "/dashboard"}');
    expect(header).not.toContain("<span>{label}</span>");
    expect(IOS_NAV_PLAY_BUTTON_CLASS).toContain("ios-liquid-glass");
    expect(IOS_NAV_PLAY_BUTTON_CLASS).toContain("text-black");
    expect(IOS_NAV_PLAY_BUTTON_CLASS).toContain("cursor-pointer");
  });

  it("uses the same header row and brand lockup across screens", () => {
    expect(SITE_HEADER_ROW_CLASS).toContain("min-h-[3.5rem]");
    expect(SITE_HEADER_ROW_CLASS).toContain("max-w-3xl");
    expect(SITE_HEADER_ROW_CLASS).toContain("gap-2");
    expect(SITE_HEADER_BAR_CLASS).toBe("ios-nav-bar");
    expect(LIST_FLOW_HEADER_OFFSET_CLASS).toContain(
      "pt-[calc(env(safe-area-inset-top)+3.75rem)]",
    );
    expect(LIST_PANE_ART_CLASS).toContain("fixed");
    expect(LIST_PANE_ART_CLASS).toContain("inset-0");
    expect(LIST_PANE_ART_CLASS).not.toContain("sticky");
    expect(LIST_OPEN_LANDING_MS).toBe(280);
    expect(LIST_BACKDROP_RETURN_MS).toBe(420);
    expect(LIST_DETAIL_BACKDROP_MS).toBe(620);
    expect(LIST_OPEN_SPLASH_MS).toBe(320);
    expect(LIST_FLOW_SLIDE_MS).toBe(320);
    expect(COOKIE_CONSENT_BANNER_CLASS).toContain(
      "top-[calc(env(safe-area-inset-top)+3.75rem)]",
    );
    expect(COOKIE_CONSENT_BANNER_CLASS).not.toContain("top-0");
    expect(COOKIE_CONSENT_BANNER_CLASS).toContain("z-50");
    expect(COOKIE_CONSENT_BANNER_CLASS).not.toContain("z-40");

    const cookie = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/CookieConsent.tsx",
      ),
      "utf8",
    );
    expect(cookie).toContain("COOKIE_CONSENT_BANNER_CLASS");
    expect(cookie).not.toContain("z-50");

    const layout = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/layout.tsx",
      ),
      "utf8",
    );
    expect(layout.indexOf("{children}")).toBeLessThan(
      layout.indexOf("<CookieConsent"),
    );

    const header = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ListFlowHeader.tsx",
      ),
      "utf8",
    );
    expect(header).toContain("SITE_HEADER_ROW_CLASS");
    expect(header).toContain("SiteBrandLockup");
    expect(header).not.toContain("IosNavOptionsButton");
    expect(header).not.toContain("IosNavAddButton");
    expect(header).not.toContain("LIBRARY_HEADER_TITLE_CLASS");
    expect(header).not.toContain("LIBRARY_HEADER_TITLE_CLUSTER_CLASS");
    expect(header).not.toContain("LIST_FLOW_HEADER_ROW_LIBRARY");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).not.toContain("ios-liquid-glass");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).toContain("rounded-full");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).toContain("bg-ink/50");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).toContain("border-sigmarite/70");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).toContain("text-parchment");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).not.toContain("bg-black");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).not.toContain("gold-plate");
    expect(LIBRARY_HEADER_OPTIONS_BUTTON_CLASS).not.toContain("text-parchment/65");

    const content = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ContentDoc.tsx",
      ),
      "utf8",
    );
    const legal = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LegalDoc.tsx",
      ),
      "utf8",
    );
    const landing = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/TryLanding.tsx",
      ),
      "utf8",
    );
    expect(content).toContain("SiteBrandLockup");
    expect(content).toContain("SITE_HEADER_BAR_CLASS");
    expect(content).toContain("SITE_HEADER_ROW_CLASS");
    expect(content).toContain("NewListCtaLink");
    expect(content).not.toContain("HOME_CTA_CLASS");
    expect(legal).toContain("SiteBrandLockup");
    expect(legal).toContain("SITE_HEADER_BAR_CLASS");
    expect(legal).toContain("SITE_HEADER_ROW_CLASS");
    expect(legal).toContain("NewListCtaLink");
    expect(legal).not.toContain("HOME_CTA_CLASS");
    expect(landing).toContain("SiteBrandLockup");
    expect(landing).toContain("SITE_HEADER_BAR_CLASS");
    expect(landing).toContain("SITE_HEADER_ROW_CLASS");

    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    const start = css.indexOf(".ios-nav-bar {");
    const navBar = css.slice(start, css.indexOf("}", start) + 1);
    expect(navBar).toContain("background: var(--ink)");
    expect(navBar).not.toContain("backdrop-filter");
    expect(navBar).not.toContain("color-mix(in srgb, var(--ink)");
  });
});

describe("empty library CTA", () => {
  it("uses a liquid-glass button, not body copy as the action", () => {
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("ios-liquid-glass");
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("text-black");
    expect(EMPTY_LIBRARY_CTA_CLASS).toContain("min-h-11");
    expect(EMPTY_LIBRARY_CTA_CLASS).not.toContain("gold-plate");
    expect(EMPTY_LIBRARY_SECONDARY_CLASS).toContain("rounded-full");
    expect(EMPTY_LIBRARY_SECONDARY_CLASS).toContain("ring-1");
    expect(SHEET_CHECKLIST_ITEM_CLASS).toContain("ring-parchment-ink/10");
    expect(SHEET_FOOTER_ACTIONS_CLASS).toContain("px-5");
    expect(SHEET_SECONDARY_BUTTON_CLASS).toContain("ring-1");
    expect(SHEET_SECONDARY_BUTTON_CLASS).toContain("rounded-xl");
    expect(CONFIRM_CANCEL_BUTTON_CLASS).toContain("ring-1");
    expect(CONFIRM_CANCEL_BUTTON_CLASS).toContain("rounded-xl");
    expect(IOS_LIQUID_CTA_CLASS).toContain("ios-liquid-glass");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("rounded-2xl");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("mx-auto");
    expect(EMPTY_LIBRARY_PANEL_CLASS).toContain("text-center");

    const emptyLibrary = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryEmptyState.tsx",
      ),
      "utf8",
    );
    expect(emptyLibrary).toContain("Make your first list");
    expect(emptyLibrary).toContain("Import a list");
    expect(emptyLibrary).toContain("EMPTY_LIBRARY_CTA_CLASS");
    expect(emptyLibrary).toContain("EMPTY_LIBRARY_SECONDARY_CLASS");

    const screen = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryScreen.tsx",
      ),
      "utf8",
    );
    expect(screen).toContain("LibraryEmptyState");
    expect(screen).toContain("List options");
    expect(screen).toContain("openLibraryOptions");
    expect(screen).toContain("IosNavOptionsButton");
    expect(screen).toContain("LIBRARY_TITLE_CLASS");
    expect(screen).toContain("LIBRARY_TITLE_ROW_CLASS");
    expect(screen).toContain("IosNavAddButton");
    expect(LIBRARY_TITLE_CLASS).toContain("text-shadow");
    expect(screen).toContain("sortLibraryLists");
    expect(screen).toContain("Sort lists by");
    expect(screen).toContain("LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS");
    expect(screen).toContain("Paste a Warhammer App, New Recruit, or Order of Battle list");
    expect(screen).toContain("Export");
    expect(screen).not.toContain("Export all");
    expect(screen).toContain("Export format");
    expect(screen).toContain("SHEET_CHECKLIST_ITEM_CLASS");
    expect(screen).toContain("MODAL_SHEET_FOOTER_CLASS");
    expect(screen).toContain("MODAL_SHEET_SCROLL_HOST_CLASS");
    expect(screen).toContain("SHEET_SECONDARY_BUTTON_CLASS");
    expect(screen).toContain("libraryListExportSubtitle");
    expect(screen).toContain("text-parchment-ink");
    expect(screen).toContain("Choose one or more lists to export.");
    expect(screen).not.toContain("No armies yet. Make your first list.");
    const createSheet = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryCreateSheet.tsx",
      ),
      "utf8",
    );
    expect(createSheet).toContain("createCounts.heroes");
    expect(screen).not.toContain("factionPickerCounts(faction)");
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
    expect(css).toContain("cursor: pointer");
    expect(css).toContain("transform: scale(0.97)");
    expect(css).toContain(".library-card:has(.library-card-open:active)::after");
    expect(css).toContain('.library-card[data-opening="true"]::after');
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
    expect(css).toContain(".modal-sheet-scroll");
    expect(css).toContain(".modal-sheet-scroll-host");
    expect(css).toContain(".modal-sheet-footer");
    expect(css).toContain("overscroll-behavior-y: contain");
    expect(css).toContain("@keyframes modal-sheet-in");

    const modal = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ModalFrame.tsx",
      ),
      "utf8",
    );
    expect(modal).toContain('variant?: "sheet" | "center"');
    expect(modal).toContain("primeSheetDrag");
    expect(modal).toContain("modal-grabber");
    expect(modal).toContain("modal-sheet-scroll");
    expect(modal).toContain("acquireModalLayer");
    expect(modal).toContain("isTopModal");
    expect(modal).toContain("modal-scrim");
    expect(modal).toContain("pointer-events-auto");
  });

  it("puts paired sheet actions beside each other, not stacked full width", () => {
    const css = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../app/globals.css",
      ),
      "utf8",
    );
    const start = css.indexOf(".ios-sheet-actions {");
    const block = css.slice(start, css.indexOf("}", start) + 1);
    expect(block).toContain("flex-direction: row");
    expect(block).not.toContain("flex-direction: column");
    expect(css).toContain(".ios-sheet-actions > button");
    expect(CONFIRM_SHEET_ACTIONS_CLASS).toContain("ios-sheet-actions");
    expect(CONFIRM_SHEET_ACTIONS_CLASS).not.toContain("flex-col");
    expect(SHEET_FORM_ACTIONS_CLASS).toContain("ios-sheet-actions");
    expect(SHEET_FORM_ACTIONS_CLASS).not.toContain("flex-col");
    expect(SHEET_FOOTER_ACTIONS_CLASS).toContain("ios-sheet-actions");
  });

  it("uses sheet panel classes without hard-coded rounded-2xl on modals", () => {
    expect(SHEET_PANEL_CLASS).toContain("max-h-[85vh]");
    expect(SHEET_PANEL_CLASS).toContain("sm:rounded-2xl");
    expect(LIBRARY_OPTIONS_SHEET_PANEL_CLASS).toContain("h-[85vh]");
    expect(LIBRARY_OPTIONS_SHEET_PANEL_CLASS).toContain("sm:min-h-[32rem]");
    expect(LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS).toContain("border-t");
    expect(CONFIRM_SHEET_PANEL_CLASS).toContain("pt-4");
    expect(CONFIRM_SHEET_PANEL_CLASS).toContain("sm:pt-5");

    const library = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryScreen.tsx",
      ),
      "utf8",
    );
    expect(library).toContain("LIBRARY_OPTIONS_SHEET_PANEL_CLASS");
    expect(library).toContain("MODAL_SHEET_SCROLL_CLASS");
    expect(library).toContain("MODAL_SHEET_FOOTER_CLASS");
    expect(library).toContain("CONFIRM_SHEET_PANEL_CLASS");
    expect(library).toContain("ConfirmSheetActions");
  });

  it("shows a subtle underline on builder list name so it reads editable", () => {
    expect(BUILDER_LIST_NAME_INPUT_CLASS).toContain("border-parchment/25");
    expect(BUILDER_LIST_NAME_INPUT_CLASS).toContain("focus:border-parchment/40");
    expect(BUILDER_LIST_NAME_INPUT_CLASS).not.toContain("border-transparent");
  });

  it("uses pressable library cards and rounded-xl points cap", () => {
    expect(LIBRARY_CARD_CLASS).toContain("library-card");
    expect(LIBRARY_CARD_CLASS).toContain("cursor-pointer");
    expect(LIBRARY_CARD_CLASS).toContain("rounded-2xl");
    expect(LIBRARY_CARD_CLASS).not.toContain("pressable");
    expect(LIBRARY_CARD_LIST_NAME_INPUT_CLASS).toContain("w-1/2");
    expect(LIBRARY_CARD_LIST_NAME_INPUT_CLASS).toContain("self-start");
    expect(pointsCapInputClass("ink")).toContain("rounded-xl");
    expect(pointsCapInputClass("ink")).not.toContain("rounded-[10px]");

    const libraryCard = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/LibraryListCard.tsx",
      ),
      "utf8",
    );
    expect(libraryCard).toContain("library-card-open absolute inset-0 z-[1]");
    expect(libraryCard).toContain("LIBRARY_CARD_LIST_NAME_INPUT_CLASS");
    expect(libraryCard).toContain('data-opening={opening ? "true" : undefined}');
    expect(libraryCard).not.toContain('sr-only">Open list');
  });

  it("keeps datasheet open controls from stretching across the row", () => {
    const sheet = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/ios/SheetIconButton.tsx",
      ),
      "utf8",
    );
    expect(sheet).toContain("w-fit");
    expect(sheet).toContain("max-w-full");
    expect(sheet).not.toContain("min-w-0 flex-1 py-2 pr-2 text-left");
    expect(sheet).not.toContain("min-w-0 flex-1 text-left active:opacity-60");
  });

  it("puts a pointer cursor on builder add-regiment actions", () => {
    expect(BUILDER_ADD_ACTION_CLASS).toContain("cursor-pointer");
    expect(BUILDER_ADD_ACTION_EMPHASIS_CLASS).toContain("cursor-pointer");
    expect(BUILDER_ADD_ACTION_EMPHASIS_CLASS).toContain("text-sigmarite");

    const builder = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../components/BuilderReady.tsx",
      ),
      "utf8",
    );
    expect(builder).toContain("BUILDER_ADD_ACTION_CLASS");
    expect(builder).toContain("cursor-default flex-wrap");
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
