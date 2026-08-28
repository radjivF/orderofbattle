import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearListNavigationDirection,
  clearListOpenMemory,
  clearListOpenSplash,
  consumeListNavigationDirection,
  consumeSkipListSplash,
  getListOpenDisplayNameServerSnapshot,
  getListOpenDisplayNameSnapshot,
  getListOpenFactionServerSnapshot,
  getListOpenFactionSnapshot,
  markListSplashShown,
  peekListNavigationDirection,
  peekListOpenFactionId,
  peekListOpenSplash,
  rememberListNavigation,
  rememberListOpen,
} from "@/lib/listTransition";

function installSessionStorage() {
  const store = new Map<string, string>();
  const sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  vi.stubGlobal("window", { sessionStorage });
  vi.stubGlobal("sessionStorage", sessionStorage);
  return store;
}

describe("listTransition hydration safety", () => {
  beforeEach(() => {
    installSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("server snapshot is always null so SSR matches first client paint", () => {
    rememberListOpen("sylvaneth");
    expect(getListOpenFactionServerSnapshot()).toBeNull();
    expect(getListOpenFactionSnapshot()).toBe("sylvaneth");
  });

  it("remembers faction id for list open without skipping backdrop splash", () => {
    rememberListOpen("kruleboyz");
    expect(peekListOpenFactionId()).toBe("kruleboyz");
    expect(consumeSkipListSplash()).toBe(false);
  });

  it("markListSplashShown skips the faction backdrop splash once", () => {
    markListSplashShown();
    expect(consumeSkipListSplash()).toBe(true);
    expect(consumeSkipListSplash()).toBe(false);
  });

  it("clearListOpenMemory wipes faction and skip flags", () => {
    rememberListOpen("stormcast-eternals");
    clearListOpenMemory();
    expect(peekListOpenFactionId()).toBeNull();
    expect(consumeSkipListSplash()).toBe(false);
  });

  it("forward navigation requests an opening splash until cleared", () => {
    rememberListNavigation("forward");
    expect(peekListOpenSplash()).toBe(true);
    clearListOpenSplash();
    expect(peekListOpenSplash()).toBe(false);
  });

  it("remembers display name for the builder header during hydration", () => {
    rememberListOpen("daughters-of-khaine", "  My Daughters  ");
    expect(getListOpenDisplayNameSnapshot()).toBe("My Daughters");
    expect(getListOpenDisplayNameServerSnapshot()).toBeNull();
  });

  it("back navigation does not request an opening splash", () => {
    rememberListNavigation("back");
    expect(peekListOpenSplash()).toBe(false);
    expect(peekListNavigationDirection()).toBe("back");
  });

  it("keeps the opening splash after nav direction is cleared", () => {
    rememberListNavigation("forward");
    clearListNavigationDirection();
    expect(peekListNavigationDirection()).toBeNull();
    expect(peekListOpenSplash()).toBe(true);
  });

  it("consumeListNavigationDirection returns and clears the direction", () => {
    rememberListNavigation("forward");
    expect(consumeListNavigationDirection()).toBe("forward");
    expect(peekListNavigationDirection()).toBeNull();
    expect(peekListOpenSplash()).toBe(true);
  });
});
