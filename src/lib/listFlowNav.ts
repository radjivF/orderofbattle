/** Which header to show while the library ↔ list carousel animates. */
export function listFlowHeaderMode(input: {
  isBuilder: boolean;
  showDetail: boolean;
  animatingBack: boolean;
  settled?: boolean;
}): "library" | "builder" {
  if (input.animatingBack) {
    return "builder";
  }
  if (input.isBuilder && input.showDetail) {
    return "builder";
  }
  return "library";
}

/** Home lives in the flow layout so `/dashboard` does not remount the list shell. */
export function listFlowIsHome(pathname: string): boolean {
  return pathname === "/";
}

/** Carousel track class when the list detail pane is visible. */
export function listFlowTrackClass(
  showDetail: boolean,
  settled = true,
): string {
  const parts = ["list-flow-track"];
  if (showDetail) {
    parts.push("list-flow-track--detail");
  }
  if (settled) {
    parts.push("list-flow-track--settled");
  }
  return parts.join(" ");
}

/** Opening splash covers the incoming list; never show it while sliding back. */
export function listOpenShowsSplash(input: {
  splashRequested: boolean;
  animatingBack: boolean;
}): boolean {
  return input.splashRequested && !input.animatingBack;
}

/** Create splash stays up until the builder clears it — not until the route changes. */
export function libraryCreatingSplashVisible(
  creating: boolean,
  createSplashRequested: boolean,
): boolean {
  return creating || createSplashRequested;
}

/** Window scroll when the library ↔ list carousel changes which pane is on screen. */
export function listFlowWindowScrollY(input: {
  showingDetail: boolean;
  libraryScrollY: number;
}): number {
  return input.showingDetail ? 0 : input.libraryScrollY;
}

/** Custom list name for the builder header while the list hydrates. */
export function listOpenDisplayNameForHeader(list: { name: string }): string {
  return list.name.trim();
}

/** Faction label on the opening splash — not the player's list name. */
export function listOpenSplashFactionName(input: {
  list?: {
    factionId: string;
    kind?: string;
    spearheadId?: string | null;
  } | null;
  catalogueName?: string | null;
  parentFactionName?: string | null;
  rememberedFactionName?: string | null;
  listNameFallback?: string | null;
}): string | undefined {
  if (input.list?.kind === "spearhead" || input.list?.spearheadId) {
    return input.parentFactionName ?? input.catalogueName ?? undefined;
  }
  if (input.catalogueName) {
    return input.catalogueName;
  }
  if (input.rememberedFactionName) {
    return input.rememberedFactionName;
  }
  return input.listNameFallback?.trim() || undefined;
}

/** Builder header values before BuilderChrome hydrates (regression guard). */
export function resolveBuilderHeaderDisplay(input: {
  rememberedDisplayName: string | null;
  chrome?: {
    listName: string;
    points: number;
    pointsCap: number;
    drops: number;
    playMode: boolean;
  } | null;
  stored?: {
    points: number;
    pointsCap: number;
    drops: number;
  } | null;
}) {
  const placeholderName = input.rememberedDisplayName ?? "Army list";
  const chrome = input.chrome;
  const stored = input.stored;
  const playMode = chrome?.playMode ?? false;

  return {
    listName: chrome?.listName ?? placeholderName,
    inputValue: chrome?.listName ?? placeholderName,
    points: chrome?.points ?? stored?.points ?? 0,
    pointsCap: chrome?.pointsCap ?? stored?.pointsCap ?? 2000,
    drops: chrome?.drops ?? stored?.drops ?? 0,
    showPlayButton: !playMode,
  };
}
