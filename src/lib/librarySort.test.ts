import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArmyList } from "@/engine/types";
import {
  getLibrarySortSnapshot,
  libraryAlphabeticSortLabel,
  librarySortModeLabel,
  setLibrarySortMode,
  sortLibraryLists,
} from "./librarySort";

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

function sampleList(
  id: string,
  name: string,
  lastOpenedAt: number,
  factionId = "stormcast-eternals",
): ArmyList {
  return {
    id,
    name,
    factionId,
    pointsCap: 2000,
    updatedAt: lastOpenedAt,
    lastOpenedAt,
    regiments: [],
    auxiliaries: [],
    regimentOfRenown: null,
    formationId: null,
    spellLoreId: null,
    prayerLoreId: null,
    manifestationLoreId: null,
    artefact: null,
    heroicTrait: null,
    monstrousTrait: null,
    visionOfFate: null,
    specialEnhancements: [],
    battleTacticCardIds: [],
    battleTacticStage: {},
    powerBinds: {},
    scourgeRealm: null,
    generalRegimentId: null,
    createdAt: lastOpenedAt,
    kind: "matched",
    spearheadId: null,
    regimentAbilityId: null,
  };
}

describe("sortLibraryLists", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("sorts by recency descending by default mode", () => {
    const lists = [
      sampleList("a", "Alpha", 100),
      sampleList("b", "Bravo", 300),
      sampleList("c", "Charlie", 200),
    ];
    expect(sortLibraryLists(lists, "recent").map((list) => list.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("sorts alphabetically by list name when titles are custom", () => {
    const lists = [
      sampleList("1", "Zulu", 500),
      sampleList("2", "Alpha", 100),
      sampleList("3", "Mike", 300),
    ];
    expect(sortLibraryLists(lists, "alphabetic").map((list) => list.name)).toEqual(
      ["Alpha", "Mike", "Zulu"],
    );
  });

  it("sorts default My lists by faction name", () => {
    const lists = [
      sampleList("1", "My Zzz", 100, "skaven"),
      sampleList("2", "My Aaa", 200, "lumineth-realm-lords"),
      sampleList("3", "My Mmm", 300, "maggotkin-of-nurgle"),
    ];
    expect(
      sortLibraryLists(lists, "alphabetic").map((list) =>
        libraryAlphabeticSortLabel(list),
      ),
    ).toEqual([
      "Lumineth Realm-lords",
      "Maggotkin of Nurgle",
      "Skaven",
    ]);
  });

  it("sorts custom names by title and My lists by faction", () => {
    const lists = [
      sampleList("1", "Full", 100, "soulblight-gravelords"),
      sampleList("2", "My Bleak Host", 200, "maggotkin-of-nurgle"),
      sampleList("3", "Alpha", 300, "cities-of-sigmar"),
    ];
    expect(sortLibraryLists(lists, "alphabetic").map((list) => list.name)).toEqual(
      ["Alpha", "Full", "My Bleak Host"],
    );
  });
});

describe("library sort preference", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("persists alphabetic mode in localStorage", () => {
    expect(getLibrarySortSnapshot()).toBe("recent");
    setLibrarySortMode("alphabetic");
    expect(getLibrarySortSnapshot()).toBe("alphabetic");
    expect(librarySortModeLabel("alphabetic")).toBe("A–Z");
    expect(librarySortModeLabel("recent")).toBe("Recently used");
  });
});
