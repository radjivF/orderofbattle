import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getFaction, listArmiesOfRenown } from "@/engine/queries";
import {
  NEW_LIST_FACTION_PARAM,
  NEW_LIST_PARAM,
  newListDraftFromSearch,
  newListPath,
  resolveNewListFaction,
} from "./newListLink";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("newListPath", () => {
  it("opens the new-list sheet", () => {
    expect(newListPath()).toBe(`/dashboard?${NEW_LIST_PARAM}=1`);
  });

  it("preselects a faction", () => {
    expect(newListPath("cities-of-sigmar")).toBe(
      `/dashboard?${NEW_LIST_PARAM}=1&${NEW_LIST_FACTION_PARAM}=cities-of-sigmar`,
    );
  });
});

describe("newListDraftFromSearch", () => {
  it("ignores unrelated query strings", () => {
    expect(newListDraftFromSearch(new URLSearchParams("foo=1"))).toBeNull();
  });

  it("opens the picker with Cities of Sigmar selected", () => {
    const cities = getFaction("cities-of-sigmar");
    expect(cities).toBeTruthy();
    const draft = newListDraftFromSearch(
      new URLSearchParams(newListPath("cities-of-sigmar").split("?")[1]),
    );
    expect(draft?.faction?.id).toBe("cities-of-sigmar");
    expect(draft?.parent?.id).toBe("cities-of-sigmar");
    expect(draft?.name).toBe("My Cities of Sigmar");
    expect(draft?.points).toBe(cities?.pointsCapDefault);
  });

  it("opens the picker without a faction when the id is unknown", () => {
    const draft = newListDraftFromSearch(
      new URLSearchParams(`${NEW_LIST_PARAM}=1&${NEW_LIST_FACTION_PARAM}=not-a-faction`),
    );
    expect(draft).toEqual({
      faction: null,
      parent: null,
      name: "",
      points: 2000,
    });
  });

  it("selects an army of renown under its parent", () => {
    const aor = listArmiesOfRenown("cities-of-sigmar")[0];
    expect(aor).toBeTruthy();
    const resolved = resolveNewListFaction(aor.id);
    expect(resolved?.parent.id).toBe("cities-of-sigmar");
    expect(resolved?.faction.id).toBe(aor.id);
  });
});

describe("article CTAs", () => {
  it("faction pages link into the new-list sheet", () => {
    const page = readFileSync(
      path.join(here, "../app/factions/[slug]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("StartListCta");
    expect(page).not.toContain("factionId=");
  });

  it("how-to guide opens the new-list sheet", () => {
    const page = readFileSync(
      path.join(
        here,
        "../app/guides/how-to-build-an-age-of-sigmar-army-list/page.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("StartListCta");
    expect(page).not.toContain("factionId=");
  });

  it("Path to Glory guide opens the new-list sheet", () => {
    const page = readFileSync(
      path.join(here, "../app/guides/path-to-glory-age-of-sigmar/page.tsx"),
      "utf8",
    );
    expect(page).toContain("StartListCta");
    expect(page).not.toContain("factionId=");
  });

  it("library applies the new-list query on open", () => {
    const screen = readFileSync(
      path.join(here, "../components/LibraryScreen.tsx"),
      "utf8",
    );
    const createSheet = readFileSync(
      path.join(here, "../components/LibraryCreateSheet.tsx"),
      "utf8",
    );
    expect(screen).toContain("newListDraftFromSearch");
    expect(screen).toContain('router.replace("/dashboard"');
    expect(createSheet).toContain("newListArmySelectGroups");
    expect(createSheet).toContain("<optgroup");
  });
});
