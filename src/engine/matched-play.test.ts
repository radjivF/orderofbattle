import { describe, expect, it } from "vitest";
import { warscrollAbilities } from "./coreRules";
import { factions } from "./data/load";
import { buildPhaseBoards } from "./phases";
import { getFaction, listFactions } from "./queries";
import {
  catalogueForList,
  isSpearheadList,
} from "./spearhead";
import { blankArmy } from "@/lib/storage";
import { summarize } from "./validate";
import {
  builderPlayTabs,
  playPhaseShowsCommandTab,
  playPhaseShowsCoreRulesTab,
} from "@/lib/builderUi";

describe("matched-play lists", () => {
  it("creates matched lists, not Spearhead", () => {
    const list = blankArmy("stormcast-eternals");
    expect(list.kind).toBe("matched");
    expect(list.spearheadId).toBeNull();
    expect(isSpearheadList(list)).toBe(false);
    expect(catalogueForList(list)?.id).toBe("stormcast-eternals");
    expect(list.pointsCap).toBeGreaterThan(0);
  });

  it("keeps Magic, Commands, and points chrome for matched play", () => {
    expect(builderPlayTabs(false).map((item) => item.value)).toEqual([
      "units",
      "magic",
      "phases",
    ]);
    expect(playPhaseShowsCommandTab(false)).toBe(true);
    expect(playPhaseShowsCoreRulesTab(false)).toBe(false);
  });

  it("leaves every matched-play warscroll ability untouched", () => {
    for (const faction of factions) {
      for (const unit of faction.units) {
        expect(
          warscrollAbilities(unit),
          `${faction.id} ${unit.name}`,
        ).toEqual(unit.abilities);
        expect(unit.points, `${faction.id} ${unit.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("summarizes a blank list for every catalogue without Spearhead rules", () => {
    for (const faction of factions) {
      const list = blankArmy(faction.id);
      expect(isSpearheadList(list)).toBe(false);
      expect(() => summarize(list, faction)).not.toThrow();
      const boards = buildPhaseBoards(list, faction);
      expect(boards.length).toBeGreaterThan(0);
    }
  });

  it("keeps core faction heroes and weapons on matched-play sheets", () => {
    for (const faction of listFactions()) {
      const heroes = faction.units.filter((unit) => unit.hero);
      expect(heroes.length, faction.id).toBeGreaterThan(0);
      const armed = faction.units.filter((unit) => unit.weapons.length > 0);
      expect(armed.length, faction.id).toBeGreaterThan(0);
      const sample = getFaction(faction.id);
      expect(sample?.game).not.toMatch(/Spearhead/i);
    }
  });
});
