import type {
  ArmyList,
  CatalogueUnit,
  FactionCatalogue,
  SpearheadCatalogue,
} from "./types";
import { spearheads } from "./data/spearhead/manifest";
import { getFaction, loadFaction } from "./queries";

const byId = new Map(spearheads.map((item) => [item.id, item]));

export function listSpearheads(): SpearheadCatalogue[] {
  return [...spearheads].sort((a, b) => a.name.localeCompare(b.name));
}

export function listSpearheadsForFaction(
  factionId: string,
): SpearheadCatalogue[] {
  return listSpearheads().filter((item) => item.parentFactionId === factionId);
}

export function getSpearhead(id: string): SpearheadCatalogue | undefined {
  return byId.get(id);
}

export function isSpearheadList(list: ArmyList): boolean {
  return list.kind === "spearhead";
}

export function spearheadAsFaction(
  spearhead: SpearheadCatalogue,
): FactionCatalogue {
  return {
    id: spearhead.id,
    name: spearhead.name,
    game: spearhead.game,
    source: spearhead.source,
    pointsCapDefault: 0,
    formations: spearhead.regimentAbilities,
    battleTraits: spearhead.battleTraits,
    spellLores: [],
    prayerLores: [],
    manifestationLores: [],
    artefacts: [],
    heroicTraits: spearhead.enhancements,
    terrain: [],
    units: spearhead.units,
    parentFactionIds: [spearhead.parentFactionId],
  };
}

export function catalogueForList(
  list: ArmyList,
): FactionCatalogue | undefined {
  if (isSpearheadList(list) && list.spearheadId) {
    const box = getSpearhead(list.spearheadId);
    return box ? spearheadAsFaction(box) : undefined;
  }
  return getFaction(list.factionId);
}

export async function catalogueForListAsync(
  list: ArmyList,
): Promise<FactionCatalogue | undefined> {
  if (isSpearheadList(list) && list.spearheadId) {
    const box = getSpearhead(list.spearheadId);
    return box ? spearheadAsFaction(box) : undefined;
  }
  return loadFaction(list.factionId);
}

export function spearheadGeneralUnit(
  spearhead: SpearheadCatalogue,
): CatalogueUnit | undefined {
  const general = spearhead.roster.find((item) => item.general);
  if (!general) {
    return spearhead.units.find((unit) => unit.hero);
  }
  return spearhead.units.find((unit) => unit.id === general.unitId);
}
