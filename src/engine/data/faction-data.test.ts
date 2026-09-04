import { describe, expect, it } from "vitest";
import {
  ensureAllFactions,
  ensureRegimentsOfRenown,
} from "./load";
import {
  catalogueMatchIds,
  getFaction,
  listArmiesOfRenown,
  listFactions,
  listRegimentsOfRenown,
} from "../queries";
import { blankArmy } from "@/lib/storage";
import { summarize } from "../validate";
import type { FactionCatalogue } from "../types";

/** BSData links that point at units not present in the same catalogue. */
const DANGLING_UNIT_OPTIONS = new Set([
  "cities-of-sigmar|Toll's Companions",
  "daughters-of-khaine|Avatar of Khaine",
  "daughters-of-khaine|The Shadow Queen",
  "daughters-of-khaine-champions-of-the-arena|Avatar of Khaine",
  "daughters-of-khaine-zainthar-kai|The Shadow Queen",
  "ossiarch-bonereapers-the-null-myriad|Gothizzar Harvester",
  "slaves-to-darkness|Singri Brand",
  "slaves-to-darkness|The Oathsworn Kin",
  "slaves-to-darkness-tribes-of-the-snow-peaks|Singri Brand",
  "slaves-to-darkness-tribes-of-the-snow-peaks|The Oathsworn Kin",
  "stormcast-eternals|Lorai, Child of the Abyss",
  "stormcast-eternals|Neave's Companions",
]);

function uniqueIds(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    expect(item.id, label).toBeTruthy();
    expect(seen.has(item.id), `${label} duplicate ${item.id}`).toBe(false);
    seen.add(item.id);
  }
}

function assertNamedList(
  items: { id: string; name: string }[],
  label: string,
) {
  expect(Array.isArray(items), label).toBe(true);
  for (const item of items) {
    expect(item.id, label).toBeTruthy();
    expect(item.name, label).toBeTruthy();
  }
}

function assertCatalogueShape(faction: FactionCatalogue) {
  expect(faction.id).toBeTruthy();
  expect(faction.name).toBeTruthy();
  expect(faction.game).toBeTruthy();
  expect(faction.source).toBeTruthy();
  expect(faction.pointsCapDefault).toBeGreaterThan(0);
  assertNamedList(faction.formations, `${faction.id} formations`);
  assertNamedList(faction.battleTraits, `${faction.id} battleTraits`);
  assertNamedList(faction.spellLores, `${faction.id} spellLores`);
  assertNamedList(faction.prayerLores, `${faction.id} prayerLores`);
  assertNamedList(faction.manifestationLores, `${faction.id} manifestationLores`);
  assertNamedList(faction.artefacts, `${faction.id} artefacts`);
  assertNamedList(faction.heroicTraits, `${faction.id} heroicTraits`);
  expect(Array.isArray(faction.terrain)).toBe(true);
  expect(Array.isArray(faction.units)).toBe(true);
  expect(faction.units.length).toBeGreaterThan(0);
  expect(faction.units.some((unit) => unit.hero)).toBe(true);

  uniqueIds(faction.units, `${faction.id} units`);
  uniqueIds(faction.formations, `${faction.id} formation ids`);
  uniqueIds(faction.artefacts, `${faction.id} artefact ids`);
  uniqueIds(faction.heroicTraits, `${faction.id} heroic trait ids`);

  const unitIds = new Set(faction.units.map((unit) => unit.id));
  for (const unit of faction.units) {
    expect(unit.name).toBeTruthy();
    expect(unit.points).toBeGreaterThan(0);
    expect(typeof unit.hero).toBe("boolean");
    expect(typeof unit.unique).toBe("boolean");
    expect(typeof unit.reinforce).toBe("boolean");
    expect(unit.models).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(unit.categories)).toBe(true);
    expect(unit.stats.move).toBeTruthy();
    expect(unit.stats.health).toBeTruthy();
    expect(unit.stats.save).toBeTruthy();
    expect(unit.stats.control).toBeTruthy();
    expect(Array.isArray(unit.weapons)).toBe(true);
    expect(Array.isArray(unit.abilities)).toBe(true);
    expect(Array.isArray(unit.regimentOptions)).toBe(true);
    expect(Array.isArray(unit.regimentHeroes)).toBe(true);

    for (const opt of [...unit.regimentOptions, ...unit.regimentHeroes]) {
      expect(opt.type === "unit" || opt.type === "category").toBe(true);
      expect(opt.id).toBeTruthy();
      expect(opt.name).toBeTruthy();
      if (opt.type === "unit" && !unitIds.has(opt.id)) {
        const key = `${faction.id}|${opt.name}`;
        expect(
          DANGLING_UNIT_OPTIONS.has(key),
          `dangling ${key} from ${unit.name}`,
        ).toBe(true);
      }
    }
  }

  for (const lore of faction.spellLores) {
    expect(Array.isArray(lore.powers)).toBe(true);
  }
  for (const lore of faction.prayerLores) {
    expect(Array.isArray(lore.powers)).toBe(true);
  }
  for (const item of [...faction.artefacts, ...faction.heroicTraits]) {
    expect(Array.isArray(item.abilities)).toBe(true);
  }
  expect(Array.isArray(faction.specialEnhancementTables)).toBe(true);
  for (const table of faction.specialEnhancementTables ?? []) {
    expect(table.id).toBeTruthy();
    expect(table.name).toBeTruthy();
    assertNamedList(table.options, `${faction.id} ${table.name}`);
    uniqueIds(table.options, `${faction.id} ${table.id} options`);
  }
}

describe("faction catalogues", () => {
  it("registers unique ids and core vs AoR split", async () => {
    const factions = await ensureAllFactions();
    uniqueIds(factions, "faction");
    const core = listFactions();
    expect(core.length).toBeGreaterThanOrEqual(25);
    expect(core.every((faction) => !faction.parentFactionIds?.length)).toBe(
      true,
    );
    const aor = factions.filter((faction) => faction.parentFactionIds?.length);
    expect(aor.length).toBeGreaterThanOrEqual(1);
    for (const faction of aor) {
      expect(faction.parentFactionIds!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps every catalogue loadable and summarizable", async () => {
    const factions = await ensureAllFactions();
    for (const faction of factions) {
      assertCatalogueShape(faction);
      const list = blankArmy(faction.id);
      if (faction.formations.length > 0) {
        expect(list.formationId).toBe(faction.formations[0].id);
      } else {
        expect(list.formationId).toBeNull();
      }
      expect(() => summarize(list, faction)).not.toThrow();
    }
  });

  it("resolves AoR parents to core factions", async () => {
    const factions = await ensureAllFactions();
    for (const faction of factions) {
      for (const parentId of faction.parentFactionIds ?? []) {
        const parent = getFaction(parentId);
        expect(parent, parentId).toBeTruthy();
        expect(parent!.parentFactionIds?.length ?? 0).toBe(0);
        expect(
          listArmiesOfRenown(parentId).some((item) => item.id === faction.id),
        ).toBe(true);
      }
    }
  });

  it("keeps Regiments of Renown tied to registered core factions", async () => {
    await ensureAllFactions();
    const regimentsOfRenown = await ensureRegimentsOfRenown();
    uniqueIds(regimentsOfRenown, "ror");
    for (const ror of regimentsOfRenown) {
      expect(ror.name).toBeTruthy();
      expect(ror.points).toBeGreaterThan(0);
      expect(ror.factionIds.length).toBeGreaterThan(0);
      for (const factionId of ror.factionIds) {
        const faction = getFaction(factionId);
        expect(faction, factionId).toBeTruthy();
        expect(faction!.parentFactionIds?.length ?? 0).toBe(0);
      }
      for (const unit of ror.units) {
        expect(unit.id).toBeTruthy();
        expect(unit.name).toBeTruthy();
        expect(unit.points).toBeGreaterThanOrEqual(0);
        expect(unit.models).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("treats AoR RoR eligibility via parent match ids", () => {
    const core = getFaction("kruleboyz")!;
    const aor = getFaction("kruleboyz-murkvast-menagerie")!;
    const coreRors = listRegimentsOfRenown(core.id);
    const aorRors = listRegimentsOfRenown(aor.id);
    expect(coreRors.length).toBeGreaterThan(0);
    expect(aorRors.length).toBeGreaterThan(0);

    const pick = aorRors[0];
    const list = {
      ...blankArmy(aor.id),
      regimentOfRenown: {
        renownId: pick.id,
        units: pick.units.map((unit) => ({
          id: `sel-${unit.id}`,
          unitId: unit.id,
          reinforced: false,
        })),
      },
    };
    const totals = summarize(list, aor);
    expect(
      catalogueMatchIds(aor).some((id) => pick.factionIds.includes(id)),
    ).toBe(true);
    expect(
      totals.issues.some((issue) =>
        issue.text.includes("not available to this faction"),
      ),
    ).toBe(false);
  });
});
