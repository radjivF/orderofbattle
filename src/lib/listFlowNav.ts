/** Which header to show while the library ↔ list carousel animates. */
export function listFlowHeaderMode(input: {
  isBuilder: boolean;
  showDetail: boolean;
  animatingBack: boolean;
}): "library" | "builder" {
  if (input.isBuilder && (input.showDetail || input.animatingBack)) {
    return "builder";
  }
  return "library";
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

/** Window scroll when the library ↔ list carousel changes which pane is on screen. */
export function listFlowWindowScrollY(input: {
  showingDetail: boolean;
  libraryScrollY: number;
}): number {
  return input.showingDetail ? 0 : input.libraryScrollY;
}

/** Display name stored when opening a list from the library carousel. */
export function listOpenDisplayNameForHeader(list: { name: string }): string {
  return list.name.trim();
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
