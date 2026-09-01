import { describe, expect, it } from "vitest";
import { datasheetKeywords, keywordChipClass } from "./keywordChip";

describe("keywordChipClass", () => {
  it("gives each coded keyword a distinct token", () => {
    const hero = keywordChipClass("HERO");
    const infantry = keywordChipClass("INFANTRY");
    const cavalry = keywordChipClass("CAVALRY");
    const monster = keywordChipClass("MONSTER");
    const warMachine = keywordChipClass("WAR MACHINE");
    const fly = keywordChipClass("FLY");
    const wizard = keywordChipClass("WIZARD");
    const priest = keywordChipClass("PRIEST");
    const faction = keywordChipClass("CASTELITE");

    expect(hero).toContain("gold-deep");
    expect(infantry).toContain("olive");
    expect(cavalry).toContain("aether");
    expect(monster).toContain("illegal");
    expect(warMachine).toContain("copper");
    expect(fly).toContain("sky");
    expect(wizard).toContain("arcane");
    expect(priest).toContain("sigmarite");
    expect(faction).toContain("parchment-ink");

    const colors = [
      hero,
      infantry,
      cavalry,
      monster,
      warMachine,
      fly,
      wizard,
      priest,
      faction,
    ];
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("keeps infantry, fly, and war machine on different hues, not grey-blue", () => {
    expect(keywordChipClass("INFANTRY")).toContain("olive");
    expect(keywordChipClass("FLY")).toContain("sky");
    expect(keywordChipClass("WAR MACHINE")).toContain("copper");
    expect(keywordChipClass("INFANTRY")).not.toContain("sky");
    expect(keywordChipClass("INFANTRY")).not.toContain("steel");
    expect(keywordChipClass("INFANTRY")).not.toContain("gold-deep");
    expect(keywordChipClass("WAR MACHINE")).not.toContain("gold-deep");
    expect(keywordChipClass("WAR MACHINE")).not.toContain("steel");
    expect(keywordChipClass("WAR MACHINE")).not.toContain("parchment-ink");
  });

  it("colors Beast without using Hero gold", () => {
    expect(keywordChipClass("BEAST")).toContain("legal");
    expect(keywordChipClass("BEAST")).not.toContain("gold-deep");
  });

  it("is case-insensitive", () => {
    expect(keywordChipClass("hero")).toBe(keywordChipClass("HERO"));
    expect(keywordChipClass("war machine")).toBe(
      keywordChipClass("WAR MACHINE"),
    );
  });
});

describe("datasheetKeywords", () => {
  it("keeps every keyword in original order, including faction names", () => {
    expect(
      datasheetKeywords([
        "FLY",
        "CASTELITE",
        "WIZARD (1)",
        "INFANTRY",
        "HERO",
        "PRIEST (1)",
      ]),
    ).toEqual([
      "FLY",
      "CASTELITE",
      "WIZARD (1)",
      "INFANTRY",
      "HERO",
      "PRIEST (1)",
    ]);
  });

  it("includes Beast and War Machine", () => {
    expect(datasheetKeywords(["CASTELITE", "WAR MACHINE", "BEAST"])).toEqual([
      "CASTELITE",
      "WAR MACHINE",
      "BEAST",
    ]);
  });

  it("drops Ward because it is already a stat", () => {
    expect(datasheetKeywords([])).toEqual([]);
    expect(datasheetKeywords(["CASTELITE", "WARD (6+)"])).toEqual(["CASTELITE"]);
    expect(datasheetKeywords(["WARD (6+)"])).toEqual([]);
  });

  it("keeps Wizard and Priest ranks as written", () => {
    expect(
      datasheetKeywords(["WIZARD (2)", "PRIEST (1)", "WARD (6+)"]),
    ).toEqual(["WIZARD (2)", "PRIEST (1)"]);
    expect(keywordChipClass("PRIEST (1)")).toContain("sigmarite");
    expect(keywordChipClass("WIZARD (2)")).toContain("arcane");
  });
});
