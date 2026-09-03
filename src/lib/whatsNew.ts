const SEEN_KEY = "oob-whats-new";

export const WHATS_NEW_VERSION = "2026-09-03-battle-record-fury";

/** Collapsed toast hides itself after this. */
export const WHATS_NEW_AUTO_DISMISS_MS = 8_000;

export const WHATS_NEW_ITEMS = [
  "Battle record lets you score a game (You vs opponent, VP, tactics). Lists stay on the device.",
  "Scourge of Aqshy: fury and rage on the scoreboard. Use +/− if something extra grants rage.",
] as const;

export function getSeenWhatsNewVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SEEN_KEY);
}

export function markWhatsNewSeen(version = WHATS_NEW_VERSION): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, version);
}

export function shouldShowWhatsNew({
  lists,
  seenVersion,
  version = WHATS_NEW_VERSION,
  allowEmptyLibrary = false,
}: {
  lists: unknown[] | undefined;
  seenVersion: string | null;
  version?: string;
  allowEmptyLibrary?: boolean;
}): boolean {
  if (!lists) return false;
  if (lists.length === 0 && !allowEmptyLibrary) return false;
  return seenVersion !== version;
}
