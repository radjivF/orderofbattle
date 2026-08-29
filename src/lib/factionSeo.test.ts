import { describe, expect, it } from "vitest";
import { getFaction } from "@/engine/queries";
import { factionPickerCounts } from "./factionSeo";

describe("factionPickerCounts", () => {
  it("splits heroes from non-hero units", () => {
    const faction = getFaction("lumineth-realm-lords");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const { heroes, units } = factionPickerCounts(faction);
    expect(heroes).toBeGreaterThan(0);
    expect(units).toBeGreaterThan(0);
    expect(heroes + units).toBe(faction.units.length);
  });
});
