const SEEN_KEY = "oob-whats-new";

export const WHATS_NEW_VERSION = "2026-08-31-play-fixes";

export const WHATS_NEW_ITEMS = [
  "Dead units stay on the board until you remove them from that phase.",
  "Export Continue tells you to pick a list.",
  "Play health shows remaining wounds, not just damage taken.",
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
}: {
  lists: unknown[] | undefined;
  seenVersion: string | null;
  version?: string;
}): boolean {
  if (!lists || lists.length === 0) return false;
  return seenVersion !== version;
}
