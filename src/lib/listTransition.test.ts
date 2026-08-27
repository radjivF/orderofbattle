import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearListOpenMemory,
  consumeSkipListSplash,
  getListOpenFactionServerSnapshot,
  getListOpenFactionSnapshot,
  peekListOpenFactionId,
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

  it("remembers faction and skip-splash for list open", () => {
    rememberListOpen("kruleboyz");
    expect(peekListOpenFactionId()).toBe("kruleboyz");
    expect(consumeSkipListSplash()).toBe(true);
    expect(consumeSkipListSplash()).toBe(false);
  });

  it("clearListOpenMemory wipes faction and skip flags", () => {
    rememberListOpen("stormcast-eternals");
    clearListOpenMemory();
    expect(peekListOpenFactionId()).toBeNull();
    expect(consumeSkipListSplash()).toBe(false);
  });
});
