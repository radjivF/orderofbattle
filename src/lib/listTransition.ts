const FACTION_KEY = "oob:list-open-faction";
const SKIP_SPLASH_KEY = "oob:skip-list-splash";

const factionListeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && "sessionStorage" in window;
}

function emitFactionListeners() {
  for (const listener of factionListeners) {
    listener();
  }
}

/** Remember which faction art to show while the list page hydrates. */
export function rememberListOpen(factionId: string | null | undefined) {
  if (!canUseStorage() || !factionId) {
    return;
  }
  sessionStorage.setItem(FACTION_KEY, factionId);
  sessionStorage.setItem(SKIP_SPLASH_KEY, "1");
  emitFactionListeners();
}

export function peekListOpenFactionId(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return sessionStorage.getItem(FACTION_KEY);
}

export function subscribeListOpenFaction(onStoreChange: () => void) {
  factionListeners.add(onStoreChange);
  return () => {
    factionListeners.delete(onStoreChange);
  };
}

export function getListOpenFactionSnapshot(): string | null {
  return peekListOpenFactionId();
}

/** Always null — sessionStorage is client-only; avoids hydration mismatch. */
export function getListOpenFactionServerSnapshot(): string | null {
  return null;
}

/** True once after create/open navigation; clears the skip flag. */
export function consumeSkipListSplash(): boolean {
  if (!canUseStorage()) {
    return false;
  }
  const skip = sessionStorage.getItem(SKIP_SPLASH_KEY) === "1";
  if (skip) {
    sessionStorage.removeItem(SKIP_SPLASH_KEY);
  }
  return skip;
}

export function clearListOpenMemory() {
  if (!canUseStorage()) {
    return;
  }
  sessionStorage.removeItem(FACTION_KEY);
  sessionStorage.removeItem(SKIP_SPLASH_KEY);
  emitFactionListeners();
}
