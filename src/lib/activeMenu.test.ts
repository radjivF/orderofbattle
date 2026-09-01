import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BATTLE_RECORD_MENU_LABEL,
  GAME_FEATURE_ROWS,
  GAME_MENU_ROWS,
  LISTS_MENU_LABEL,
  brandSubtitleForMenu,
  gameBattleRecordSelected,
  gameComingSoon,
  gameFeatureEnabled,
  gameListsSelected,
  gameRootSelected,
  getActiveMenuSnapshot,
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

  it("marks The old world and 40k as coming soon until those games ship", () => {
    const tow = GAME_MENU_ROWS.find((row) => row.id === "tow");
    expect(tow?.label).toBe("The old world");
    expect(tow?.comingSoon).toBe(true);
    const fortyK = GAME_MENU_ROWS.find((row) => row.id === "40k");
    expect(fortyK?.label).toBe("40k");
    expect(fortyK?.comingSoon).toBe(true);
    expect(gameComingSoon("40k")).toBe(true);
    expect(gameComingSoon("aos")).toBe(false);
    expect(gameFeatureEnabled("aos", "lists")).toBe(true);
    expect(gameFeatureEnabled("aos", "battle-record")).toBe(true);
    expect(gameFeatureEnabled("40k", "lists")).toBe(false);
    expect(GAME_FEATURE_ROWS.map((row) => row.label)).toEqual([
      LISTS_MENU_LABEL,
      BATTLE_RECORD_MENU_LABEL,
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
    expect(gameListsSelected("/battle-record", "aos")).toBe(false);
    expect(gameBattleRecordSelected("/battle-record", "aos")).toBe(true);
    expect(gameBattleRecordSelected("/dashboard", "aos")).toBe(false);
    expect(gameRootSelected("/dashboard", "tow")).toBe(false);
  });
});
