export const ACTIVE_MENU_IDS = [
  "aos",
  "tow",
  "tactics",
  "core-rules",
  "scourge-rules",
] as const;

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

export type GameFeatureId =
  | "lists"
  | "battle-record"
  | "spearhead-record"
  | "core-rules"
  | "scourge-rules";

export type MenuEntryId = GameFeatureId | "coming-soon";

export const LISTS_MENU_LABEL = "List builder";

export const BATTLE_RECORD_MENU_LABEL = "Battle record";

export const SPEARHEAD_RECORD_MENU_LABEL = "Spearhead record";

export const CORE_RULES_MENU_LABEL = "Core rules";

export const SCOURGE_RULES_MENU_LABEL = "Scourge of Aqshy rules";

export const GAME_FEATURE_ROWS: readonly {
  id: GameFeatureId;
  label: string;
}[] = [
  { id: "lists", label: LISTS_MENU_LABEL },
  { id: "battle-record", label: BATTLE_RECORD_MENU_LABEL },
  { id: "spearhead-record", label: SPEARHEAD_RECORD_MENU_LABEL },
  { id: "core-rules", label: CORE_RULES_MENU_LABEL },
  { id: "scourge-rules", label: SCOURGE_RULES_MENU_LABEL },
];

export type MenuSectionEntry = {
  id: MenuEntryId;
  label: string;
  actionName: string;
  comingSoon?: boolean;
  menu?: ActiveMenu;
  href?: "/dashboard" | "/battle-record" | "/core-rules" | "/scourge-rules";
};

const MUTED_MENU_TITLE_CLASS = "font-serif text-lg text-sheet-muted";

export const MENU_SECTIONS: readonly {
  id: GameSystemId;
  label: string;
  titleClass?: string;
  entries: readonly MenuSectionEntry[];
}[] = [
  {
    id: "aos",
    label: "AOS",
    entries: [
      {
        id: "lists",
        label: LISTS_MENU_LABEL,
        actionName: LISTS_MENU_LABEL,
        menu: "aos",
        href: "/dashboard",
      },
      {
        id: "battle-record",
        label: BATTLE_RECORD_MENU_LABEL,
        actionName: BATTLE_RECORD_MENU_LABEL,
        menu: "tactics",
        href: "/battle-record",
      },
      {
        id: "spearhead-record",
        label: SPEARHEAD_RECORD_MENU_LABEL,
        actionName: SPEARHEAD_RECORD_MENU_LABEL,
        comingSoon: true,
      },
      {
        id: "core-rules",
        label: CORE_RULES_MENU_LABEL,
        actionName: CORE_RULES_MENU_LABEL,
        menu: "core-rules",
        href: "/core-rules",
      },
      {
        id: "scourge-rules",
        label: SCOURGE_RULES_MENU_LABEL,
        actionName: SCOURGE_RULES_MENU_LABEL,
        menu: "scourge-rules",
        href: "/scourge-rules",
      },
    ],
  },
  {
    id: "40k",
    label: "40k",
    titleClass: MUTED_MENU_TITLE_CLASS,
    entries: [
      {
        id: "coming-soon",
        label: "Coming soon",
        actionName: "40k coming soon",
        comingSoon: true,
      },
    ],
  },
  {
    id: "tow",
    label: "The old world",
    titleClass: MUTED_MENU_TITLE_CLASS,
    entries: [
      {
        id: "coming-soon",
        label: "Coming soon",
        actionName: "The old world coming soon",
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

export const CORE_RULES_MENU_ROW: {
  id: Extract<ActiveMenu, "core-rules">;
  label: string;
  brandSubtitle: string;
} = {
  id: "core-rules",
  label: CORE_RULES_MENU_LABEL,
  brandSubtitle: "Core rules for Age of Sigmar",
};

export const SCOURGE_RULES_MENU_ROW: {
  id: Extract<ActiveMenu, "scourge-rules">;
  label: string;
  brandSubtitle: string;
} = {
  id: "scourge-rules",
  label: SCOURGE_RULES_MENU_LABEL,
  brandSubtitle: "Scourge of Aqshy for Age of Sigmar",
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
  CORE_RULES_MENU_ROW,
  SCOURGE_RULES_MENU_ROW,
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
  if (
    value === "tow" ||
    value === "tactics" ||
    value === "core-rules" ||
    value === "scourge-rules"
  ) {
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

export function menuIdForPathname(
  pathname: string | null | undefined,
  stored: ActiveMenu,
): ActiveMenu {
  if (!pathname) {
    return stored;
  }
  if (pathname === "/battle-record" || pathname.startsWith("/battle-record/")) {
    return "tactics";
  }
  if (pathname === "/core-rules") {
    return "core-rules";
  }
  if (pathname === "/scourge-rules") {
    return "scourge-rules";
  }
  return stored;
}

export function gameComingSoon(gameId: GameSystemId): boolean {
  const section = MENU_SECTIONS.find((item) => item.id === gameId);
  return Boolean(
    section &&
      section.entries.length > 0 &&
      section.entries.every((entry) => entry.comingSoon),
  );
}

export function gameFeatureEnabled(
  gameId: GameSystemId,
  feature: GameFeatureId,
): boolean {
  const entry = MENU_SECTIONS.find((section) => section.id === gameId)?.entries.find(
    (item) => item.id === feature,
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
    gameBattleRecordSelected(pathname, gameId) ||
    gameCoreRulesSelected(pathname, gameId) ||
    gameScourgeRulesSelected(pathname, gameId)
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

export function gameCoreRulesSelected(
  pathname: string,
  gameId: GameSystemId,
): boolean {
  if (gameId !== "aos") {
    return false;
  }
  return pathname === "/core-rules";
}

export function gameScourgeRulesSelected(
  pathname: string,
  gameId: GameSystemId,
): boolean {
  if (gameId !== "aos") {
    return false;
  }
  return pathname === "/scourge-rules";
}

export function menuEntrySelected(
  pathname: string,
  activeMenu: ActiveMenu,
  gameId: GameSystemId,
  feature: MenuEntryId,
): boolean {
  if (gameId !== "aos") {
    return false;
  }
  if (feature === "lists") {
    return gameListsSelected(pathname, "aos", activeMenu);
  }
  if (feature === "battle-record") {
    return gameBattleRecordSelected(pathname, "aos");
  }
  if (feature === "core-rules") {
    return gameCoreRulesSelected(pathname, "aos");
  }
  if (feature === "scourge-rules") {
    return gameScourgeRulesSelected(pathname, "aos");
  }
  return false;
}

export function menuPlaceholderCopy(
  menu: ActiveMenu,
): { title: string; body: string } | null {
  if (
    menuShowsListLibrary(menu) ||
    menu === "core-rules" ||
    menu === "scourge-rules"
  ) {
    return null;
  }
  return {
    title: "Battle record",
    body: "Open Battle record from the menu to score a live game.",
  };
}
