import { describe, expect, it, beforeAll } from "vitest";
import {
  auxiliaryPickerUnits,
  getFaction,
} from "@/engine/queries";
import { ensureAllFactions } from "@/engine/data/load";

describe("auxiliaryPickerUnits", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  it("includes heroes so units like Harbinger of Decay can be auxiliaries", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const units = auxiliaryPickerUnits(faction);
    const heroes = units.filter((unit) => unit.hero);
    expect(heroes.length).toBeGreaterThan(0);
    expect(
      heroes.some((unit) => unit.name.includes("Harbinger of Decay")),
    ).toBe(true);
  });
});
