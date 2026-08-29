import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  factionArtScrimClass,
  listBackdropArtSrc,
  scourgeRealmVeilClass,
} from "./factionArt";

describe("factionArtScrimClass", () => {
  it("uses a lighter scrim while the open splash is visible", () => {
    const splash = factionArtScrimClass(true);
    const builder = factionArtScrimClass(false);

    expect(splash).toContain("from-ink/38");
    expect(builder).toContain("from-ink/78");
    expect(splash).not.toBe(builder);
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

describe("faction art LCP", () => {
  it("loads above-the-fold Stormcast art eagerly", () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const backdrop = readFileSync(
      path.resolve(dir, "../components/FactionArtBackground.tsx"),
      "utf8",
    );
    expect(backdrop).toContain('loading="eager"');
    expect(backdrop).toContain('fetchPriority="high"');
    expect(backdrop).toContain("priority");

    const factions = readFileSync(
      path.resolve(dir, "../app/factions/page.tsx"),
      "utf8",
    );
    expect(factions).toContain('loading={index === 0 ? "eager" : "lazy"}');

    const library = readFileSync(
      path.resolve(dir, "../components/LibraryScreen.tsx"),
      "utf8",
    );
    expect(library).toContain('loading={index === 0 ? "eager" : "lazy"}');
  });
});
