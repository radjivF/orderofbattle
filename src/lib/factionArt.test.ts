import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  factionArtScrimClass,
  isBackdropArtReady,
  listBackdropArtSrc,
  preloadBackdropArt,
  scourgeRealmVeilClass,
} from "./factionArt";

describe("factionArtScrimClass", () => {
  it("uses a stable dark scrim for backdrop art", () => {
    expect(factionArtScrimClass()).toContain("from-ink/78");
  });
});

describe("scourgeRealmVeilClass", () => {
  it("tints aqshy and ghyran art and stays clear for core lists", () => {
    expect(scourgeRealmVeilClass("aqshy")).toContain("120,45,12");
    expect(scourgeRealmVeilClass("ghyran")).toContain("28,90,48");
    expect(scourgeRealmVeilClass(null)).toBe("bg-transparent");
  });
});

describe("listBackdropArtSrc", () => {
  it("falls back to faction art when scourge season files are unavailable", () => {
    expect(listBackdropArtSrc("stormcast-eternals", "aqshy")).toBe(
      "/factions/stormcast-eternals.webp?v=2",
    );
  });

  it("falls back to faction art when no scourge season is set", () => {
    expect(listBackdropArtSrc("daughters-of-khaine", null)).toBe(
      "/factions/daughters-of-khaine.webp",
    );
  });
});

describe("preloadBackdropArt", () => {
  it("marks art ready after preload resolves", async () => {
    const src = listBackdropArtSrc("stormcast-eternals", null);
    expect(src).toBeTruthy();
    expect(isBackdropArtReady("stormcast-eternals", null)).toBe(false);
    await preloadBackdropArt("stormcast-eternals", null);
    expect(isBackdropArtReady("stormcast-eternals", null)).toBe(true);
  });
});

describe("faction art LCP", () => {
  it("loads backdrop art with high priority native img", () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const backdrop = readFileSync(
      path.resolve(dir, "../components/FactionArtBackground.tsx"),
      "utf8",
    );
    expect(backdrop).toContain('decoding="sync"');
    expect(backdrop).toContain('fetchPriority="high"');
    expect(backdrop).not.toContain("scale-[1.03]");
    expect(backdrop).toContain("LIST_DETAIL_BACKDROP_TRANSITION_CLASS");
    expect(backdrop).toContain("scrim ? \"opacity-100\" : \"opacity-0\"");

    const builder = readFileSync(
      path.resolve(dir, "../components/BuilderScreen.tsx"),
      "utf8",
    );
    expect(builder).toContain("scrim={scrimOn}");

    const library = readFileSync(
      path.resolve(dir, "../components/LibraryCreateFlow.tsx"),
      "utf8",
    );
    const libraryCard = readFileSync(
      path.resolve(dir, "../components/LibraryListCard.tsx"),
      "utf8",
    );
    expect(library).toContain("scrim={false}");
    expect(library).not.toMatch(
      /libraryCreatingSplashVisible[\s\S]*bg-ink/,
    );

    const factions = readFileSync(
      path.resolve(dir, "../app/factions/page.tsx"),
      "utf8",
    );
    expect(factions).toContain('loading={index === 0 ? "eager" : "lazy"}');
    expect(libraryCard).toContain('loading={index === 0 ? "eager" : "lazy"}');
  });
});
