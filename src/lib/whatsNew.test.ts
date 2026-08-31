// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  WHATS_NEW_ITEMS,
  WHATS_NEW_VERSION,
  getSeenWhatsNewVersion,
  markWhatsNewSeen,
  shouldShowWhatsNew,
} from "./whatsNew";

describe("shouldShowWhatsNew", () => {
  it("hides while lists are still loading", () => {
    expect(
      shouldShowWhatsNew({ lists: undefined, seenVersion: null }),
    ).toBe(false);
  });

  it("hides for a first-time visitor with no saved lists", () => {
    expect(shouldShowWhatsNew({ lists: [], seenVersion: null })).toBe(false);
  });

  it("shows for a returning user who has a list and has not seen this version", () => {
    expect(
      shouldShowWhatsNew({ lists: [{ id: "list-1" }], seenVersion: null }),
    ).toBe(true);
  });

  it("hides after this version was dismissed", () => {
    expect(
      shouldShowWhatsNew({
        lists: [{ id: "list-1" }],
        seenVersion: WHATS_NEW_VERSION,
      }),
    ).toBe(false);
  });

  it("shows again when the changelog version changes", () => {
    expect(
      shouldShowWhatsNew({
        lists: [{ id: "list-1" }],
        seenVersion: "older-notes",
        version: "newer-notes",
      }),
    ).toBe(true);
  });
});

describe("WHATS_NEW_ITEMS", () => {
  it("lists this release's play-mode ability fix", () => {
    expect(WHATS_NEW_ITEMS.some((item) => /abilit/i.test(item))).toBe(true);
  });
});

describe("whatsNew persistence", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts unseen", () => {
    expect(getSeenWhatsNewVersion()).toBeNull();
  });

  it("remembers the dismissed version", () => {
    markWhatsNewSeen();
    expect(getSeenWhatsNewVersion()).toBe(WHATS_NEW_VERSION);
  });
});
