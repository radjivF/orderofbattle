export const ACTIVE_MENU_IDS = ["aos", "tow", "tactics"] as const;

export type ActiveMenu = (typeof ACTIVE_MENU_IDS)[number];

export type GameSystemId = "aos" | "tow" | "40k";

export const GAME_MENU_ROWS: readonly {
  id: GameSystemId;
  label: string;
  brandSubtitle: string;
  comingSoon?: boolean;
}[] = [
  {
    id: "aos",
    label: "Age of Sigmar",
    brandSubtitle: "Army lists for Age of Sigmar",
  },
  {
    id: "tow",
    label: "The old world",
    brandSubtitle: "Army lists for The Old World",
    comingSoon: true,
  },
  {
    id: "40k",
    label: "40k",
    brandSubtitle: "Army lists for Warhammer 40,000",
    comingSoon: true,
  },
];

export type GameFeatureId = "lists" | "battle-record";

export type MenuGameId = GameSystemId | "spearhead";

export const LISTS_MENU_LABEL = "List builder";

export const BATTLE_RECORD_MENU_LABEL = "Battle record";

export const GAME_FEATURE_ROWS: readonly {
  id: GameFeatureId;
  label: string;
}[] = [
  { id: "lists", label: LISTS_MENU_LABEL },
  { id: "battle-record", label: BATTLE_RECORD_MENU_LABEL },
];

export type MenuSectionEntry = {
  id: MenuGameId;
  label: string;
  actionName: string;
  comingSoon?: boolean;
  menu?: ActiveMenu;
  href?: "/dashboard" | "/battle-record";
};

export const MENU_SECTIONS: readonly {
  id: GameFeatureId;
  label: string;
  entries: readonly MenuSectionEntry[];
}[] = [
  {
    id: "lists",
    label: LISTS_MENU_LABEL,
    entries: [
      {
        id: "aos",
        label: "AOS",
        actionName: "AOS lists",
        menu: "aos",
        href: "/dashboard",
      },
      {
        id: "tow",
        label: "The old world",
        actionName: "The old world lists",
        comingSoon: true,
      },
      {
        id: "40k",
        label: "40k",
        actionName: "40k lists",
        comingSoon: true,
      },
    ],
  },
  {
    id: "battle-record",
    label: BATTLE_RECORD_MENU_LABEL,
    entries: [
      {
        id: "aos",
        label: "AOS",
        actionName: "AOS battle record",
        menu: "tactics",
        href: "/battle-record",
      },
      {
        id: "tow",
        label: "The old world",
        actionName: "The old world battle record",
        comingSoon: true,
      },
      {
        id: "40k",
        label: "40k",
        actionName: "40k battle record",
        comingSoon: true,
      },
      {
        id: "spearhead",
        label: "Spearhead",
        actionName: "Spearhead battle record",
        comingSoon: true,
      },
    ],
  },
];

export const TRACK_GAME_MENU_ROW: {
  id: Extract<ActiveMenu, "tactics">;
  label: string;
  brandSubtitle: string;
} = {
  id: "tactics",
  label: "Battle record",
  brandSubtitle: "Score a live game",
};

export const MENU_ROWS: readonly {
  id: ActiveMenu;
  label: string;
  brandSubtitle: string;
}[] = [
  {
    id: "aos",
    label: GAME_MENU_ROWS[0].label,
    brandSubtitle: GAME_MENU_ROWS[0].brandSubtitle,
  },
  {
    id: "tow",
    label: GAME_MENU_ROWS[1].label,
    brandSubtitle: GAME_MENU_ROWS[1].brandSubtitle,
  },
  TRACK_GAME_MENU_ROW,
];

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

export function gameComingSoon(gameId: GameSystemId): boolean {
  const entries = MENU_SECTIONS.flatMap((section) =>
    section.entries.filter((entry) => entry.id === gameId),
  );
  return entries.length > 0 && entries.every((entry) => entry.comingSoon);
}

export function gameFeatureEnabled(
  gameId: GameSystemId,
  feature: GameFeatureId,
): boolean {
  const entry = MENU_SECTIONS.find((section) => section.id === feature)?.entries.find(
    (item) => item.id === gameId,
  );
  return Boolean(entry && !entry.comingSoon);
}

/** A game row is current when any of its features is on screen — not the homepage. */
export function gameRootSelected(
  pathname: string,
  gameId: GameSystemId,
): boolean {
  return (
    gameListsSelected(pathname, gameId) ||
    gameBattleRecordSelected(pathname, gameId)
  );
}

export function gameListsSelected(
  pathname: string,
  gameId: GameSystemId,
  activeMenu: ActiveMenu = "aos",
): boolean {
  if (gameId !== "aos" && gameId !== "tow") {
    return false;
  }
  if (
    pathname === "/battle-record" ||
    pathname.startsWith("/battle-record/")
  ) {
    return false;
  }
  if (pathname !== "/dashboard" && !pathname.startsWith("/lists/")) {
    return false;
  }
  return gameId === activeMenu;
}

export function gameBattleRecordSelected(
  pathname: string,
  gameId: GameSystemId,
): boolean {
  if (gameId !== "aos") {
    return false;
  }
  return (
    pathname === "/battle-record" || pathname.startsWith("/battle-record/")
  );
}

export function menuEntrySelected(
  pathname: string,
  activeMenu: ActiveMenu,
  feature: GameFeatureId,
  gameId: MenuGameId,
): boolean {
  if (feature === "lists") {
    if (gameId !== "aos" && gameId !== "tow") {
      return false;
    }
    return gameListsSelected(pathname, gameId, activeMenu);
  }
  if (gameId !== "aos") {
    return false;
  }
  return gameBattleRecordSelected(pathname, "aos");
}

export function menuPlaceholderCopy(
  menu: ActiveMenu,
): { title: string; body: string } | null {
  if (menuShowsListLibrary(menu)) {
    return null;
  }
  return {
    title: "Battle record",
    body: "Open Battle record from the menu to score a live game.",
  };
}
