import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "@/lib/id";
import { blankArmy } from "@/lib/storage";
import {
  canBeGeneral,
  canJoinRegiment,
  getFaction,
  listFactions,
  selectionPoints,
} from "./queries";
import { ensureAllFactions } from "@/engine/data/load";

describe("listFactions", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  it("lists parent factions with Stormcast first", () => {
    const factions = listFactions();
    expect(factions.length).toBeGreaterThan(0);
    expect(factions[0]?.id).toBe("stormcast-eternals");
    expect(factions.every((f) => !f.parentFactionIds?.length)).toBe(true);
  });
});

describe("getFaction", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("returns catalogue by id", () => {
    expect(getFaction("stormcast-eternals")?.name).toContain("Stormcast");
    expect(getFaction("missing-faction")).toBeUndefined();
  });
});

describe("selectionPoints", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("doubles points when reinforced", () => {
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const unit = faction.units.find((item) => item.points > 0);
    expect(unit).toBeTruthy();
    if (!unit) return;

    expect(selectionPoints(unit, false)).toBe(unit.points);
    expect(selectionPoints(unit, true)).toBe(unit.points * 2);
  });
});

describe("canJoinRegiment", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("blocks a hero from joining its own regiment as a duplicate", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    expect(hero).toBeTruthy();
    if (!hero) return;

    expect(canJoinRegiment(hero, hero, faction)).toBe(false);
  });

  it("allows legal companions from regiment options", () => {
    const faction = getFaction("sylvaneth");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.name === "Arch-Revenant");
    const companion = faction.units.find((unit) => unit.name === "Treelord");
    expect(hero && companion).toBeTruthy();
    if (!hero || !companion) return;

    expect(canJoinRegiment(hero, companion, faction)).toBe(true);
  });
});

describe("canBeGeneral", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("restricts general to warmaster regiments when present", () => {
    const faction = getFaction("hedonites-of-slaanesh");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const warmaster = faction.units.find((unit) =>
      unit.categories.some((c) => c.includes("WARMASTER")),
    );
    expect(warmaster).toBeTruthy();
    if (!warmaster) return;

    const warmasterRegimentId = "warmaster-reg";
    const otherRegimentId = "other-reg";
    const list = {
      ...blankArmy(faction.id),
      regiments: [
        {
          id: warmasterRegimentId,
          hero: { id: createId(), unitId: warmaster.id, reinforced: false },
          units: [],
        },
        {
          id: otherRegimentId,
          hero: {
            id: createId(),
            unitId: faction.units.find((u) => u.hero && u.id !== warmaster.id)
              ?.id ?? warmaster.id,
            reinforced: false,
          },
          units: [],
        },
      ],
    };

    expect(canBeGeneral(list, faction, warmasterRegimentId)).toBe(true);
    expect(canBeGeneral(list, faction, otherRegimentId)).toBe(false);
  });
});
