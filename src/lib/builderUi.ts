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
  return `min-h-8 w-[4.75rem] shrink-0 rounded-[10px] px-2 text-center text-sm outline-none sm:w-24 sm:px-3 ${fill}`;
}

/** Play-mode unit name + Sheet on one baseline row. */
export const PLAY_UNIT_NAME_ROW_CLASS =
  "flex min-w-0 flex-wrap items-baseline gap-x-2";
export const PLAY_SHEET_LINK_CLASS =
  "shrink-0 font-sans text-sm text-aether";
