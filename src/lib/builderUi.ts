/** Header / builder chrome presentation used by ListFlowHeader and related UI. */

import { formatPoints } from "@/engine/pointsCap";
import type { ListIssueTarget } from "@/engine/validate";

export function dropCountLabel(drops: number): string {
  return `${drops} ${drops === 1 ? "drop" : "drops"}`;
}

/** Matched-play cap or Spearhead box — used on library cards and export picker. */
export function libraryListGameLabel(input: {
  spearhead: boolean;
  pointsCap: number;
  spearheadBoxName?: string | null;
}): string {
  if (input.spearhead) {
    return input.spearheadBoxName
      ? `Spearhead · ${input.spearheadBoxName}`
      : "Spearhead";
  }
  return `${formatPoints(input.pointsCap)} pts`;
}

/** Secondary line under a list name in the export picker. */
export function libraryListExportSubtitle(input: {
  factionName: string;
  spearhead: boolean;
  pointsCap: number;
  spearheadBoxName?: string | null;
  drops?: number;
}): string {
  const game = libraryListGameLabel(input);
  if (input.spearhead) {
    return `${input.factionName} · ${game}`;
  }
  const drops =
    typeof input.drops === "number"
      ? ` · ${dropCountLabel(input.drops)}`
      : "";
  return `${input.factionName} · ${game}${drops}`;
}

/** Points and drops stay visible in both Build and Play when chrome is set. */
export function builderHeaderShowsListStats(hasChrome: boolean): boolean {
  return hasChrome;
}

export function builderHeaderShowsPlayButton(playMode: boolean): boolean {
  return !playMode;
}

/** Spearhead has a fixed roster — don't flag the header with a validation dot. */
export function builderHeaderShowsIssueDot(
  spearhead: boolean,
  tone: "ok" | "warn" | "bad",
): boolean {
  return !spearhead && tone !== "ok";
}

export function builderPlayTabs(spearhead: boolean): {
  value: "units" | "magic" | "phases";
  label: string;
  ariaLabel?: string;
}[] {
  if (spearhead) {
    return [
      { value: "units", label: "Units" },
      { value: "phases", label: "Phases", ariaLabel: "Phases" },
    ];
  }
  return [
    { value: "units", label: "Units" },
    {
      value: "magic",
      label: "Magic",
      ariaLabel: "Magic and prayer lores",
    },
    {
      value: "phases",
      label: "Tactics & Phases",
      ariaLabel: "Battle tactics and phases",
    },
  ];
}

/** Spearhead has no command points — hide the Command phase sub-tab. */
export function playPhaseShowsCommandTab(spearhead: boolean): boolean {
  return !spearhead;
}

/** Spearhead shows universal core rules per phase instead of Command. */
export function playPhaseShowsCoreRulesTab(spearhead: boolean): boolean {
  return spearhead;
}

/** Spearhead has a fixed roster — don't show a points cost on the datasheet. */
export function datasheetUnitPointsLabel(
  points: number,
  hidePoints: boolean,
): string | null {
  if (hidePoints) return null;
  return `${points} points`;
}

export const HEADER_STATS_STACK_CLASS = "text-right tabular-nums leading-none";
export const HEADER_DROPS_LINE_CLASS = "mt-0.5 text-[11px] text-ink-muted";

export const LIST_ISSUE_BANNER_CLASS =
  "flex items-center gap-2 rounded-xl bg-illegal/25 px-4 py-2.5 text-sm font-bold text-illegal-lit ring-1 ring-illegal/40";

export const LIST_ISSUE_HIGHLIGHT_CLASS =
  "scroll-mt-28 bg-illegal/25 ring-2 ring-illegal ring-offset-2 ring-offset-ink";

export function listIssueAnchorId(target: ListIssueTarget): string {
  if (target.area === "add-regiment") {
    return "list-issue-add-regiment";
  }
  if (target.area === "add-hero") {
    return `list-issue-regiment-${target.regimentId}-hero`;
  }
  if (target.area === "regiment") {
    return `list-issue-regiment-${target.regimentId}`;
  }
  if (target.area === "unit") {
    return `list-issue-unit-${target.selectionId}`;
  }
  if (target.area === "add-ror") {
    return "list-issue-add-ror";
  }
  return `list-issue-${target.field}`;
}

export function listIssueOpensOptions(target: ListIssueTarget): boolean;
export function listIssueOpensOptions(text: string): boolean;
export function listIssueOpensOptions(
  input: ListIssueTarget | string,
): boolean {
  if (typeof input === "string") {
    return input.toLowerCase().includes("battle tactic");
  }
  return input.area === "options";
}

export function listIssueHighlightClass(
  anchorId: string,
  highlightedId: string | null,
): string {
  return highlightedId === anchorId ? LIST_ISSUE_HIGHLIGHT_CLASS : "";
}

export function listIssueOpensAddRegiment(text: string): boolean {
  return text === "Add a regiment to begin.";
}

/** GHB reminder — auxiliaries are allowed; they affect drops and CP. */
export const AUXILIARY_RULES_TEXT =
  "Each auxiliary adds an extra drop and reduces your command points.";

export const RULE_INFO_BUTTON_CLASS =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sheet-muted";

export function pointsCapInputClass(variant: "ink" | "parchment"): string {
  const fill =
    variant === "ink"
      ? "bg-parchment text-parchment-ink"
      : "bg-parchment-ink/5 text-parchment-ink";
  return `min-h-8 w-[4.75rem] shrink-0 rounded-xl px-2 text-center text-sm outline-none sm:w-24 sm:px-3 ${fill}`;
}

/** Play-mode unit name + Sheet on one baseline row. */
export const PLAY_UNIT_NAME_ROW_CLASS =
  "flex min-w-0 flex-wrap items-baseline gap-x-2";
export const PLAY_SHEET_LINK_CLASS =
  "shrink-0 font-sans text-sm text-aether";

/** Parchment frosted lens, dark glyph — add and back. */
export const IOS_NAV_ICON_BUTTON_CLASS =
  "ios-liquid-glass pressable inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-black";

/** Bare parchment glyph — library hamburger only, not the liquid-glass add/back discs. */
export const IOS_NAV_MENU_ICON_CLASS = "h-8 w-8 text-parchment";

export const IOS_NAV_MENU_BUTTON_CLASS =
  "pressable inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-parchment";

export const LIBRARY_BRAND_HEADER_ROW_CLASS =
  "flex min-w-0 flex-1 items-center gap-0.5";

export const APP_MENU_DRAWER_MS = 280;

export const APP_MENU_DRAWER_PANEL_CLASS =
  "flex h-full w-[min(20rem,88vw)] flex-col overflow-hidden bg-parchment text-parchment-ink shadow-[8px_0_32px_rgba(0,0,0,0.35)]";

/** Options over library art — translucent ink disc with a gold rim. */
export const LIBRARY_HEADER_OPTIONS_BUTTON_CLASS =
  "pressable inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-sigmarite/70 bg-ink/50 text-parchment shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-sm";

/** My lists heading: options leading, New list trailing. */
export const LIBRARY_TITLE_ROW_CLASS =
  "flex min-h-11 items-center gap-3";

/** Page title over index art — shadow for contrast on busy backdrops. */
export const LIBRARY_TITLE_CLASS =
  "min-w-0 flex-1 font-serif text-3xl font-semibold leading-none text-parchment [text-shadow:0_2px_16px_rgba(0,0,0,0.95),0_1px_3px_rgba(0,0,0,1)]";

/** Battle setup / recap / live game — same gutter as the parchment cards. */
export const BATTLE_PAGE_COLUMN_CLASS =
  "mx-auto w-full max-w-3xl px-5 sm:px-6";

export const IOS_NAV_ADD_BUTTON_CLASS = IOS_NAV_ICON_BUTTON_CLASS;

export const IOS_NAV_BACK_BUTTON_CLASS = IOS_NAV_ICON_BUTTON_CLASS;

export const IOS_NAV_PLAY_BUTTON_CLASS =
  "ios-liquid-glass pressable inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-full px-4 text-[15px] font-semibold leading-none text-black";

/** Scoreboard play affordance — aether datasheet mark, same as unit sheet links. */
export const SCOREBOARD_PLAY_BUTTON_CLASS =
  "h-6 w-6 shrink-0 text-aether";

/** In-app primary CTA — same parchment glass as the nav +. */
export const IOS_LIQUID_CTA_CLASS =
  "ios-liquid-glass pressable inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl px-4 text-[15px] font-semibold text-black";

/** Compact confirm sheet footer — destructive primary + quiet cancel. */
export const CONFIRM_SHEET_ACTIONS_CLASS =
  "flex shrink-0 flex-col gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1";

/** Padded footer for full-height sheets (export, import) — panel has no side padding. */
export const SHEET_FOOTER_ACTIONS_CLASS =
  "ios-sheet-actions shrink-0 px-5 pb-5";

/** Scroll body inside a bottom sheet — one surface, edge fades via scroll host. */
export const MODAL_SHEET_SCROLL_CLASS =
  "modal-sheet-scroll min-h-0 flex-1 overflow-y-auto";

export const MODAL_SHEET_SCROLL_HOST_CLASS =
  "modal-sheet-scroll-host min-h-0 flex-1";

/** Pinned sheet footer below the scroll body — stays visible while content moves. */
export const MODAL_SHEET_FOOTER_CLASS =
  "modal-sheet-footer ios-sheet-actions shrink-0 px-5 pb-5";

/** Same pinned footer, Cancel + Continue on one row instead of stacked. */
export const MODAL_SHEET_FOOTER_ROW_CLASS =
  "modal-sheet-footer ios-sheet-actions-row shrink-0 px-5 pb-5";

/** Quiet dismiss on the left of a footer row — not a competing chip. */
export const SHEET_FOOTER_CANCEL_CLASS =
  "pressable inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl px-3 text-[15px] font-semibold text-sheet-muted";

/** Primary footer action — fills the rest of the row; stays readable when disabled. */
export const SHEET_FOOTER_PRIMARY_CLASS =
  "ios-liquid-glass pressable inline-flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl px-4 text-[15px] font-semibold text-black disabled:cursor-not-allowed disabled:text-black/45";

/** Secondary sheet action — file pick, download, etc. */
export const SHEET_SECONDARY_BUTTON_CLASS =
  "pressable inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-parchment-ink/8 px-4 text-[15px] font-semibold text-parchment-ink ring-1 ring-parchment-ink/15 transition hover:bg-parchment-ink/12";


export const CONFIRM_DESTRUCTIVE_BUTTON_CLASS =
  "pressable inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-illegal/12 px-4 text-[15px] font-semibold text-illegal ring-1 ring-illegal/25";

export const CONFIRM_CANCEL_BUTTON_CLASS =
  "pressable inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-parchment-ink/5 px-4 text-[15px] font-semibold text-sheet-muted ring-1 ring-parchment-ink/10 transition hover:bg-parchment-ink/8";

export const BUILDER_ADD_ACTION_CLASS =
  "pressable min-h-11 cursor-pointer px-2 text-sm text-ink-muted";

export const BUILDER_ADD_ACTION_EMPHASIS_CLASS =
  "pressable min-h-11 cursor-pointer px-2 text-sm text-sigmarite";

/** Category label over list art — iOS dark material so serif type stays readable. */
export const TOW_CATEGORY_ROW_CLASS =
  "flex items-center justify-between gap-3 rounded-xl bg-ink/90 px-3 py-1.5 backdrop-blur-md ring-1 ring-parchment/15";

export const TOW_CATEGORY_HEADING_CLASS =
  "font-serif text-xl text-parchment";

/** Primary + quiet secondary actions in form sheets (Create / Back, etc.). */
export const SHEET_FORM_ACTIONS_CLASS =
  "mt-2 flex shrink-0 flex-col gap-3 pt-2";

/** Soft gold homepage / footer CTAs — not the in-app parchment glass. */
export const HOME_CTA_CLASS =
  "home-cta pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold";

export const HOME_CTA_QUIET_CLASS =
  "home-cta-quiet pressable inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold";

/** Shared page column — keep in sync with the site header so library chrome lines up with the menu. */
export const SITE_COLUMN_CLASS =
  "mx-auto w-full max-w-3xl px-3 sm:px-4";

/** Shared inner row for library, builder, home, and content headers. */
export const SITE_HEADER_ROW_CLASS =
  `${SITE_COLUMN_CLASS} flex min-h-[3.5rem] items-center gap-2 py-1.5 sm:min-h-[3.75rem]`;

/** Full-width bar behind every site header — solid ink, no art showing through. */
export const SITE_HEADER_BAR_CLASS = "ios-nav-bar";

/** Clears the fixed header; apply to pane copy, not the list art layer. */
export const LIST_FLOW_HEADER_OFFSET_CLASS =
  "pt-[calc(env(safe-area-inset-top)+3.75rem)]";

/** Sticky breaks inside the transformed carousel — fixed layer behind scrolling content. */
export const LIST_PANE_ART_CLASS =
  "pointer-events-none fixed inset-0 z-[1] overflow-hidden [transform:translateZ(0)]";

/** Library ↔ list carousel slide — keep in sync with `.list-flow-track` in globals.css. */
export const LIST_FLOW_SLIDE_MS = 320;

/** Opening splash minimum — detail can appear as the slide settles. */
export const LIST_OPEN_SPLASH_MS = 320;

/** Crossfade when the opening splash yields to builder content. */
export const LIST_OPEN_LANDING_MS = 280;

/** Slower crossfade for library ↔ list backdrop art — easier to read the picture. */
export const LIST_BACKDROP_RETURN_MS = 420;

/** List-detail backdrop reveal — slower than front content so the art reads. */
export const LIST_DETAIL_BACKDROP_MS = 620;

export const LIST_LANDING_CONTENT_CLASS =
  "transition-opacity duration-[280ms] ease-out";

export const LIST_BACKDROP_TRANSITION_CLASS =
  "transition-opacity duration-[420ms] ease-out";

export const LIST_DETAIL_BACKDROP_TRANSITION_CLASS =
  "transition-opacity duration-[620ms] ease-out";

export const LIST_LANDING_CONTENT_VISIBLE_CLASS = "opacity-100";

export const LIST_LANDING_CONTENT_HIDDEN_CLASS = "opacity-0";

/** Under the header (z-60), above list cards and the transformed list track. */
export const COOKIE_CONSENT_BANNER_CLASS =
  "pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.75rem)] z-50 flex justify-center px-4 pt-2";

/** Bottom toast — same stack as the cookie banner, still under the header. */
export const WHATS_NEW_BANNER_CLASS =
  "pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 flex justify-center px-4 pb-2";

/** Bottom sheet panel — full width on phone, card on sm+. */
export const SHEET_PANEL_CLASS =
  "parchment-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden text-parchment-ink sm:rounded-2xl";

/** List options — fixed phone height so Import/Export tabs do not resize the sheet. */
export const LIBRARY_OPTIONS_SHEET_PANEL_CLASS =
  `${SHEET_PANEL_CLASS} h-[85vh] sm:h-auto sm:min-h-[32rem]`;

/** Full-page play sheet — faction art + play-mode chrome, not a parchment card. */
export const PLAY_SHEET_PANEL_CLASS =
  "relative flex w-full flex-col overflow-hidden bg-ink text-parchment";

/** Rule between sort and Import/Export in list options. */
export const LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS =
  "mx-5 border-t border-parchment-ink/20";

export const SHEET_PANEL_COMPACT_CLASS =
  "parchment-card w-full max-w-sm text-parchment-ink sm:rounded-2xl";

/** Delete / remove confirm sheets — room below the grabber like SHEET_HEADER_CLASS. */
export const CONFIRM_SHEET_PANEL_CLASS =
  `${SHEET_PANEL_COMPACT_CLASS} px-5 pt-4 pb-0 sm:pt-5`;

/** Shared sheet header row — card-aligned rhythm below the grabber. */
export const SHEET_HEADER_CLASS =
  "flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-3 sm:pt-5";

export const SHEET_HEADER_START_CLASS = SHEET_HEADER_CLASS;

export const LIBRARY_CARD_CLASS =
  "library-card parchment-card relative grid min-h-[8.5rem] cursor-pointer grid-cols-[minmax(0,1fr)_7.5rem] overflow-hidden rounded-2xl text-parchment-ink sm:grid-cols-[minmax(0,1fr)_9.5rem]";

export const LIBRARY_CARD_ACTIONS_CLASS =
  "mt-3 flex items-center justify-end gap-1 text-sm";

export const LIBRARY_CARD_ACTION_BUTTON_CLASS =
  "pressable min-h-10 cursor-pointer px-2 text-sheet-muted sm:min-h-11 sm:px-2.5";

export const LIBRARY_CARD_DELETE_BUTTON_CLASS =
  "pressable min-h-10 cursor-pointer px-2 text-illegal sm:min-h-11 sm:px-2.5";

/** Half-width so taps beside the name still open the list card. */
export const LIBRARY_CARD_LIST_NAME_INPUT_CLASS =
  "pointer-events-auto relative mt-1 w-1/2 max-w-[14rem] min-w-[7rem] self-start cursor-text bg-transparent font-serif text-[1.45rem] leading-tight outline-none sm:text-2xl";

export const BUILDER_LIST_NAME_INPUT_CLASS =
  "h-8 min-w-0 flex-1 border-b border-parchment/25 bg-transparent font-serif text-[15px] font-semibold leading-none outline-none placeholder:text-parchment/35 focus:border-parchment/40 sm:text-lg";

export const EMPTY_LIBRARY_PANEL_CLASS =
  "mx-auto max-w-sm rounded-2xl bg-ink-raised/90 px-5 py-6 text-center ring-1 ring-parchment/10";

export const EMPTY_LIBRARY_CTA_CLASS = `mt-5 ${IOS_LIQUID_CTA_CLASS}`;

export const EMPTY_LIBRARY_SECONDARY_CLASS =
  "pressable mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-ink-raised/90 px-4 text-base font-semibold text-parchment ring-1 ring-parchment/20 backdrop-blur-sm";

/** Shared shape only — pair with idle or selected so ring/bg never stack. */
export const SHEET_CHECKLIST_ITEM_CLASS =
  "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 ring-1 transition";

export const SHEET_CHECKLIST_ITEM_IDLE_CLASS =
  "ring-parchment-ink/10 bg-parchment-ink/5 hover:bg-parchment-ink/8";

export const SHEET_CHECKLIST_ITEM_SELECTED_CLASS =
  "ring-aether/35 bg-aether/10";

export const SHEET_INLINE_LINK_CLASS =
  "pressable text-sm font-medium text-aether";
