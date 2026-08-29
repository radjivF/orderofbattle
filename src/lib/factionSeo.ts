import { listRegimentsOfRenown } from "@/engine/queries";
import type { FactionCatalogue } from "@/engine/types";

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
  const ror = listRegimentsOfRenown(faction.id);
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
    rorCount: ror.length,
    rorNames: ror.map((item) => item.name),
    pointsCap: faction.pointsCapDefault,
  };
}

/** Hero vs non-hero warscroll counts for faction pickers. */
export function factionPickerCounts(faction: FactionCatalogue): {
  heroes: number;
  units: number;
} {
  const heroes = faction.units.filter((unit) => unit.hero).length;
  return {
    heroes,
    units: faction.units.length - heroes,
  };
}
