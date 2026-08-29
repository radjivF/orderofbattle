import type { ArmyList } from "@/engine/types";

export type LibrarySortMode = "recent" | "alphabetic";

const STORAGE_KEY = "oob:library-sort-mode";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLibrarySort(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getLibrarySortSnapshot(): LibrarySortMode {
  if (!canUseStorage()) {
    return "recent";
  }
  return localStorage.getItem(STORAGE_KEY) === "alphabetic"
    ? "alphabetic"
    : "recent";
}

/** Default for SSR — matches first client paint before localStorage read. */
export function getLibrarySortServerSnapshot(): LibrarySortMode {
  return "recent";
}

export function setLibrarySortMode(mode: LibrarySortMode) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, mode);
  emit();
}

export function libraryListRecency(list: ArmyList): number {
  return list.lastOpenedAt ?? list.updatedAt;
}

export function sortLibraryLists(
  lists: ArmyList[],
  mode: LibrarySortMode,
): ArmyList[] {
  const copy = [...lists];
  if (mode === "alphabetic") {
    return copy.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }
  return copy.sort(
    (a, b) => libraryListRecency(b) - libraryListRecency(a),
  );
}

export function librarySortModeLabel(mode: LibrarySortMode): string {
  return mode === "alphabetic" ? "A–Z" : "Recently used";
}
