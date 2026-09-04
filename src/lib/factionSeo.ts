import type { FactionCatalogue } from "@/engine/types";
import type { FactionMetadata } from "@/engine/data/load";

export type FactionSeoStats = {
  unitCount: number;
  heroCount: number;
  uniqueCount: number;
  formationNames: string[];
  spellLoreNames: string[];
  prayerLoreNames: string[];
  manifestationLoreNames: string[];
  rorCount: number;
  rorNames: string[];
  pointsCap: number;
};

export function factionSeoStats(faction: FactionCatalogue): FactionSeoStats {
  const heroes = faction.units.filter((unit) => unit.hero);
  const unique = faction.units.filter((unit) => unit.unique);
  return {
    unitCount: faction.units.length,
    heroCount: heroes.length,
    uniqueCount: unique.length,
    formationNames: faction.formations.map((item) => item.name),
    spellLoreNames: faction.spellLores.map((item) => item.name),
    prayerLoreNames: faction.prayerLores.map((item) => item.name),
    manifestationLoreNames: faction.manifestationLores.map((item) =>
      item.name,
    ),
    rorCount: 0,
    rorNames: [],
    pointsCap: faction.pointsCapDefault,
  };
}

/** Hero vs non-hero warscroll counts for faction pickers. */
export function factionPickerCounts(
  factionOrMetadata: FactionCatalogue | FactionMetadata,
): {
  heroes: number;
  units: number;
} {
  if ("units" in factionOrMetadata) {
    const heroes = factionOrMetadata.units.filter((unit) => unit.hero).length;
    return {
      heroes,
      units: factionOrMetadata.units.length - heroes,
    };
  }
  return {
    heroes: factionOrMetadata.heroCount,
    units: factionOrMetadata.unitCount - factionOrMetadata.heroCount,
  };
}
