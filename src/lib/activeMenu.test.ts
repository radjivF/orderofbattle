import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BATTLE_RECORD_MENU_LABEL,
  GAME_FEATURE_ROWS,
  GAME_MENU_ROWS,
  LISTS_MENU_LABEL,
  MENU_SECTIONS,
  brandSubtitleForMenu,
  gameBattleRecordSelected,
  gameComingSoon,
  gameFeatureEnabled,
  gameListsSelected,
  gameRootSelected,
  getActiveMenuSnapshot,
  menuEntrySelected,
  menuPlaceholderCopy,
  menuShowsListLibrary,
  setActiveMenu,
} from "./activeMenu";

function installLocalStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
}

describe("active menu preference", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("defaults to Age of Sigmar", () => {
    expect(getActiveMenuSnapshot()).toBe("aos");
    expect(menuShowsListLibrary("aos")).toBe(true);
    expect(menuPlaceholderCopy("aos")).toBeNull();
    expect(brandSubtitleForMenu("aos")).toBe("Army lists for Age of Sigmar");
  });

  it("persists Old World and Battle record menu ids", () => {
    setActiveMenu("tow");
    expect(getActiveMenuSnapshot()).toBe("tow");
    expect(menuShowsListLibrary("tow")).toBe(true);
    expect(menuPlaceholderCopy("tow")).toBeNull();

    setActiveMenu("tactics");
    expect(getActiveMenuSnapshot()).toBe("tactics");
    expect(menuShowsListLibrary("tactics")).toBe(false);
    expect(menuPlaceholderCopy("tactics")?.title).toBe("Battle record");
  });

  it("marks 40k and The old world as coming soon until those games ship", () => {
    const fortyK = GAME_MENU_ROWS.find((row) => row.id === "40k");
    expect(fortyK?.label).toBe("40k");
    expect(gameComingSoon("40k")).toBe(true);
    expect(gameComingSoon("tow")).toBe(true);
    expect(gameComingSoon("aos")).toBe(false);
    expect(gameFeatureEnabled("aos", "lists")).toBe(true);
    expect(gameFeatureEnabled("aos", "battle-record")).toBe(true);
    expect(gameFeatureEnabled("tow", "lists")).toBe(false);
    expect(gameFeatureEnabled("tow", "battle-record")).toBe(false);
    expect(gameFeatureEnabled("40k", "lists")).toBe(false);
    expect(GAME_FEATURE_ROWS.map((row) => row.label)).toEqual([
      LISTS_MENU_LABEL,
      BATTLE_RECORD_MENU_LABEL,
    ]);
    expect(MENU_SECTIONS[0]?.label).toBe("List builder");
    expect(MENU_SECTIONS[1]?.label).toBe("Battle record");
    expect(MENU_SECTIONS[1]?.entries.map((entry) => entry.label)).toEqual([
      "AOS",
      "The old world",
      "40k",
      "Spearhead",
    ]);
  });

  it("treats unknown stored values as Age of Sigmar", () => {
    localStorage.setItem("oob:active-menu", "40k");
    expect(getActiveMenuSnapshot()).toBe("aos");
  });

  it("selects Age of Sigmar on lists or battle record, not the homepage", () => {
    expect(gameRootSelected("/", "aos")).toBe(false);
    expect(gameRootSelected("/dashboard", "aos")).toBe(true);
    expect(gameRootSelected("/lists/abc", "aos")).toBe(true);
    expect(gameRootSelected("/battle-record", "aos")).toBe(true);
    expect(gameListsSelected("/dashboard", "aos")).toBe(true);
    expect(gameListsSelected("/dashboard", "tow", "tow")).toBe(true);
    expect(gameListsSelected("/dashboard", "aos", "tow")).toBe(false);
    expect(gameListsSelected("/battle-record", "aos")).toBe(false);
    expect(gameBattleRecordSelected("/battle-record", "aos")).toBe(true);
    expect(gameBattleRecordSelected("/battle-record/game-1", "aos")).toBe(true);
    expect(gameBattleRecordSelected("/dashboard", "aos")).toBe(false);
    expect(gameRootSelected("/dashboard", "tow")).toBe(false);
  });

  it("selects List builder and Battle record rows from the route", () => {
    expect(menuEntrySelected("/dashboard", "aos", "lists", "aos")).toBe(true);
    expect(menuEntrySelected("/dashboard", "tow", "lists", "tow")).toBe(true);
    expect(menuEntrySelected("/dashboard", "aos", "lists", "tow")).toBe(false);
    expect(
      menuEntrySelected("/battle-record", "tactics", "battle-record", "aos"),
    ).toBe(true);
    expect(
      menuEntrySelected("/battle-record/game-1", "tactics", "lists", "aos"),
    ).toBe(false);
    expect(
      menuEntrySelected("/battle-record", "tactics", "battle-record", "spearhead"),
    ).toBe(false);
  });
});
