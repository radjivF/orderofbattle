import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  brandSubtitleForMenu,
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

  it("persists Old World and Tabletop Tactics", () => {
    setActiveMenu("tow");
    expect(getActiveMenuSnapshot()).toBe("tow");
    expect(menuShowsListLibrary("tow")).toBe(true);
    expect(menuPlaceholderCopy("tow")).toBeNull();

    setActiveMenu("tactics");
    expect(getActiveMenuSnapshot()).toBe("tactics");
    expect(menuShowsListLibrary("tactics")).toBe(false);
    expect(menuPlaceholderCopy("tactics")?.title).toBe("Tabletop Tactics");
  });

  it("treats unknown stored values as Age of Sigmar", () => {
    localStorage.setItem("oob:active-menu", "40k");
    expect(getActiveMenuSnapshot()).toBe("aos");
  });
});
