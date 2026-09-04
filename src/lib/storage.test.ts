import { describe, expect, it, beforeAll } from "vitest";
import { createId } from "./id";
import {
  appendRegimentWithHero,
  blankArmy,
  blankSpearhead,
  duplicateArmy,
  prepareImportedArmy,
} from "@/engine/listFactories";
import { getFaction } from "@/engine/queries";
import { getSpearhead } from "@/engine/spearhead";
import { ensureAllFactions } from "@/engine/data/load";

describe("blankArmy", () => {
  it("creates a matched list with faction defaults", () => {
    const list = blankArmy("stormcast-eternals", "My list", 2000);
    expect(list.kind).toBe("matched");
    expect(list.name).toBe("My list");
    expect(list.pointsCap).toBe(2000);
    expect(list.factionId).toBe("stormcast-eternals");
    expect(list.regiments).toEqual([]);
  });
});

describe("blankSpearhead", () => {
  it("seeds roster from spearhead manifest", () => {
    const box = getSpearhead("cities-of-sigmar-fusil-platoon");
    expect(box).toBeTruthy();
    if (!box) return;

    const list = blankSpearhead("cities-of-sigmar-fusil-platoon");
    expect(list.kind).toBe("spearhead");
    expect(list.spearheadId).toBe("cities-of-sigmar-fusil-platoon");
    expect(list.regiments).toHaveLength(1);
    expect(list.regiments[0]?.hero).toBeTruthy();
  });
});

describe("appendRegimentWithHero", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });

  it("adds a regiment and sets general when missing", () => {
    const list = blankArmy("stormcast-eternals");
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero);
    expect(hero).toBeTruthy();
    if (!hero) return;

    const regimentId = createId();
    const heroSelectionId = createId();
    const next = appendRegimentWithHero(list, hero.id, {
      regimentId,
      heroSelectionId,
    });
    expect(next?.regiments).toHaveLength(1);
    expect(next?.generalRegimentId).toBe(regimentId);
  });

  it("returns null at regiment cap", () => {
    let list = blankArmy("stormcast-eternals");
    const faction = getFaction("stormcast-eternals");
    expect(faction).toBeTruthy();
    if (!faction) return;

    const hero = faction.units.find((unit) => unit.hero);
    expect(hero).toBeTruthy();
    if (!hero) return;

    for (let i = 0; i < 5; i += 1) {
      const next = appendRegimentWithHero(list, hero.id, {
        regimentId: createId(),
        heroSelectionId: createId(),
      });
      expect(next).toBeTruthy();
      list = next!;
    }

    expect(
      appendRegimentWithHero(list, hero.id, {
        regimentId: createId(),
        heroSelectionId: createId(),
      }),
    ).toBeNull();
  });
});

describe("duplicateArmy", () => {
  it("clones with a new id and copy suffix", () => {
    const source = blankArmy("stormcast-eternals", "Original");
    const copy = duplicateArmy(source);
    expect(copy.id).not.toBe(source.id);
    expect(copy.name).toBe("Original copy");
    expect(copy.factionId).toBe(source.factionId);
  });
});

describe("prepareImportedArmy", () => {
  it("assigns a fresh id and timestamps", () => {
    const source = blankArmy("stormcast-eternals", "Portable");
    const imported = prepareImportedArmy(source);
    expect(imported.id).not.toBe(source.id);
    expect(imported.name).toBe("Portable");
    expect(imported.updatedAt).toBeGreaterThan(0);
  });
});
