import { describe, expect, it } from "vitest";
import {
  auxiliaryPickerUnits,
  getFaction,
} from "@/engine/queries";

describe("auxiliaryPickerUnits", () => {
  it("includes heroes so units like Harbinger of Decay can be auxiliaries", () => {
    const faction = getFaction("maggotkin-of-nurgle");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const units = auxiliaryPickerUnits(faction, null);
    const heroes = units.filter((unit) => unit.hero);
    expect(heroes.length).toBeGreaterThan(0);
    expect(
      heroes.some((unit) => unit.name.includes("Harbinger of Decay")),
    ).toBe(true);
  });
});
