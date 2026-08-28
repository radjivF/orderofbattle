const FACTION_KEY = "oob:list-open-faction";
const DISPLAY_NAME_KEY = "oob:list-open-display-name";
const SKIP_SPLASH_KEY = "oob:skip-list-splash";
const NAV_DIRECTION_KEY = "oob:list-nav-direction";
const OPEN_SPLASH_KEY = "oob:list-open-splash";

export type ListNavDirection = "forward" | "back";

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
export function rememberListOpen(
  factionId: string | null | undefined,
  displayName?: string | null,
) {
  if (!canUseStorage() || !factionId) {
    return;
  }
  sessionStorage.setItem(FACTION_KEY, factionId);
  if (displayName?.trim()) {
    sessionStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
  } else {
    sessionStorage.removeItem(DISPLAY_NAME_KEY);
  }
  sessionStorage.removeItem(SKIP_SPLASH_KEY);
  emitFactionListeners();
}

/** Call when ListLoadingSplash is on screen — avoids a second splash in FactionBackdrop. */
export function markListSplashShown() {
  if (!canUseStorage()) {
    return;
  }
  sessionStorage.setItem(SKIP_SPLASH_KEY, "1");
}

export function peekListOpenDisplayName(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return sessionStorage.getItem(DISPLAY_NAME_KEY);
}

export function getListOpenDisplayNameSnapshot(): string | null {
  return peekListOpenDisplayName();
}

/** Always null — sessionStorage is client-only; avoids hydration mismatch. */
export function getListOpenDisplayNameServerSnapshot(): string | null {
  return null;
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
  sessionStorage.removeItem(DISPLAY_NAME_KEY);
  sessionStorage.removeItem(SKIP_SPLASH_KEY);
  sessionStorage.removeItem(NAV_DIRECTION_KEY);
  sessionStorage.removeItem(OPEN_SPLASH_KEY);
  emitFactionListeners();
}

/** True while opening a list from the library — survives nav-direction cleanup. */
export function peekListOpenSplash(): boolean {
  if (!canUseStorage()) {
    return false;
  }
  return sessionStorage.getItem(OPEN_SPLASH_KEY) === "1";
}

export function clearListOpenSplash() {
  if (!canUseStorage()) {
    return;
  }
  sessionStorage.removeItem(OPEN_SPLASH_KEY);
}

/** iOS-style stack push/pop between library and list builder. */
export function rememberListNavigation(direction: ListNavDirection) {
  if (!canUseStorage()) {
    return;
  }
  sessionStorage.setItem(NAV_DIRECTION_KEY, direction);
  if (direction === "forward") {
    sessionStorage.setItem(OPEN_SPLASH_KEY, "1");
  }
}

export function peekListNavigationDirection(): ListNavDirection | null {
  if (!canUseStorage()) {
    return null;
  }
  const value = sessionStorage.getItem(NAV_DIRECTION_KEY);
  if (value === "forward" || value === "back") {
    return value;
  }
  return null;
}

export function clearListNavigationDirection() {
  if (!canUseStorage()) {
    return;
  }
  sessionStorage.removeItem(NAV_DIRECTION_KEY);
}

export function consumeListNavigationDirection(): ListNavDirection | null {
  const value = peekListNavigationDirection();
  clearListNavigationDirection();
  return value;
}
