/** Header / builder chrome presentation used by ListFlowHeader and related UI. */

export function dropCountLabel(drops: number): string {
  return `${drops} ${drops === 1 ? "drop" : "drops"}`;
}

/** Points and drops stay visible in both Build and Play when chrome is set. */
export function builderHeaderShowsListStats(hasChrome: boolean): boolean {
  return hasChrome;
}

export function builderHeaderShowsPlayButton(playMode: boolean): boolean {
  return !playMode;
}

export const HEADER_STATS_STACK_CLASS = "text-right tabular-nums leading-none";
export const HEADER_DROPS_LINE_CLASS = "mt-0.5 text-[11px] text-ink-muted";

export const LIST_ISSUE_BANNER_CLASS =
  "flex items-center gap-2 rounded-xl bg-illegal/25 px-4 py-2.5 text-sm font-bold text-illegal-lit ring-1 ring-illegal/40";

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
  "ios-liquid-glass pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black";

export const IOS_NAV_ADD_BUTTON_CLASS = IOS_NAV_ICON_BUTTON_CLASS;

export const IOS_NAV_BACK_BUTTON_CLASS = IOS_NAV_ICON_BUTTON_CLASS;

export const IOS_NAV_PLAY_BUTTON_CLASS =
  "ios-liquid-glass pressable inline-flex h-11 shrink-0 items-center justify-center rounded-full px-4 text-[15px] font-semibold leading-none text-black";

/** In-app primary CTA — same parchment glass as the nav +. */
export const IOS_LIQUID_CTA_CLASS =
  "ios-liquid-glass pressable inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-[15px] font-semibold text-black";

/** Compact confirm sheet footer — destructive primary + quiet cancel. */
export const CONFIRM_SHEET_ACTIONS_CLASS =
  "flex shrink-0 flex-col gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1";

export const CONFIRM_DESTRUCTIVE_BUTTON_CLASS =
  "pressable inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-illegal/12 px-4 text-[15px] font-semibold text-illegal ring-1 ring-illegal/25";

export const CONFIRM_CANCEL_BUTTON_CLASS =
  "pressable min-h-11 w-full text-base font-medium text-sheet-muted";

/** Primary + quiet secondary actions in form sheets (Create / Back, etc.). */
export const SHEET_FORM_ACTIONS_CLASS =
  "mt-2 flex shrink-0 flex-col gap-3 pt-2";

/** Soft gold homepage / footer CTAs — not the in-app parchment glass. */
export const HOME_CTA_CLASS =
  "home-cta pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold";

export const HOME_CTA_QUIET_CLASS =
  "home-cta-quiet pressable inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold";

/** Bottom sheet panel — full width on phone, card on sm+. */
export const SHEET_PANEL_CLASS =
  "parchment-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden text-parchment-ink sm:rounded-2xl";

export const SHEET_PANEL_COMPACT_CLASS =
  "parchment-card w-full max-w-sm text-parchment-ink sm:rounded-2xl";

/** Shared sheet header row — tight vertical rhythm below the grabber. */
export const SHEET_HEADER_CLASS =
  "flex shrink-0 items-start justify-between gap-3 px-5 pt-2 pb-2";

export const SHEET_HEADER_START_CLASS = SHEET_HEADER_CLASS;

export const LIBRARY_CARD_CLASS =
  "parchment-card grid min-h-[8.5rem] cursor-pointer grid-cols-[minmax(0,1fr)_7.5rem] overflow-hidden rounded-2xl text-parchment-ink sm:grid-cols-[minmax(0,1fr)_9.5rem]";

export const LIBRARY_CARD_ACTIONS_CLASS =
  "mt-3 flex items-center justify-end gap-1 text-sm";

export const LIBRARY_CARD_ACTION_BUTTON_CLASS =
  "pressable min-h-10 px-2 text-sheet-muted sm:min-h-11 sm:px-2.5";

export const LIBRARY_CARD_DELETE_BUTTON_CLASS =
  "pressable min-h-10 px-2 text-illegal sm:min-h-11 sm:px-2.5";

export const BUILDER_LIST_NAME_INPUT_CLASS =
  "h-8 min-w-0 flex-1 border-b border-transparent bg-transparent font-serif text-[15px] font-semibold leading-none outline-none placeholder:text-parchment/35 focus:border-parchment/25 sm:text-lg";

export const EMPTY_LIBRARY_PANEL_CLASS =
  "mx-auto max-w-sm rounded-2xl bg-ink-raised/90 px-5 py-6 text-center ring-1 ring-parchment/10";

export const EMPTY_LIBRARY_CTA_CLASS = `mt-5 ${IOS_LIQUID_CTA_CLASS}`;
