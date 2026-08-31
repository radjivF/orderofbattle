export const ACTIVE_MENU_IDS = ["aos", "tow", "tactics"] as const;

export type ActiveMenu = (typeof ACTIVE_MENU_IDS)[number];

export const GAME_MENU_ROWS: readonly {
  id: Exclude<ActiveMenu, "tactics">;
  label: string;
  brandSubtitle: string;
}[] = [
  {
    id: "aos",
    label: "Age of Sigmar",
    brandSubtitle: "Army lists for Age of Sigmar",
  },
  {
    id: "tow",
    label: "The Old World",
    brandSubtitle: "Army lists for The Old World",
  },
];

export const TRACK_GAME_MENU_ROW: {
  id: Extract<ActiveMenu, "tactics">;
  label: string;
  brandSubtitle: string;
} = {
  id: "tactics",
  label: "Tabletop Tactics",
  brandSubtitle: "Play companion",
};

export const MENU_ROWS: readonly {
  id: ActiveMenu;
  label: string;
  brandSubtitle: string;
}[] = [...GAME_MENU_ROWS, TRACK_GAME_MENU_ROW];

const STORAGE_KEY = "oob:active-menu";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeActiveMenu(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function parseActiveMenu(value: string | null): ActiveMenu {
  if (value === "tow" || value === "tactics") {
    return value;
  }
  return "aos";
}

export function getActiveMenuSnapshot(): ActiveMenu {
  if (!canUseStorage()) {
    return "aos";
  }
  return parseActiveMenu(localStorage.getItem(STORAGE_KEY));
}

/** Default for SSR — matches first client paint before localStorage read. */
export function getActiveMenuServerSnapshot(): ActiveMenu {
  return "aos";
}

export function setActiveMenu(menu: ActiveMenu) {
  if (!canUseStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, menu);
  emit();
}

export function brandSubtitleForMenu(menu: ActiveMenu): string {
  return (
    MENU_ROWS.find((row) => row.id === menu)?.brandSubtitle ??
    MENU_ROWS[0].brandSubtitle
  );
}

export function menuShowsListLibrary(menu: ActiveMenu): boolean {
  return menu === "aos" || menu === "tow";
}

export function menuPlaceholderCopy(
  menu: ActiveMenu,
): { title: string; body: string } | null {
  if (menuShowsListLibrary(menu)) {
    return null;
  }
  if (menu === "tow") {
    return {
      title: "The Old World",
      body: "Coming on its branch.",
    };
  }
  return {
    title: "Tabletop Tactics",
    body: "Coming on its branch.",
  };
}
