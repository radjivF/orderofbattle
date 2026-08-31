import type {
  ArmyList,
  FactionCatalogue,
  ManifestationModel,
  UnitAbility,
} from "../types";
import { isPathToGloryList } from "./packs";

export type LearnedSpell = {
  key: string;
  loreId: string;
  loreName: string;
  power: UnitAbility;
};

export type LearnedManifestation = {
  loreId: string;
  loreName: string;
  model: ManifestationModel;
};

export function learnedSpellKey(loreId: string, name: string): string {
  return `${loreId}::${name}`;
}

export function factionSpellPicks(faction: FactionCatalogue): LearnedSpell[] {
  return faction.spellLores.flatMap((lore) =>
    lore.powers.map((power) => ({
      key: learnedSpellKey(lore.id, power.name),
      loreId: lore.id,
      loreName: lore.name,
      power,
    })),
  );
}

export function factionManifestationPicks(
  faction: FactionCatalogue,
): LearnedManifestation[] {
  return faction.manifestationLores.flatMap((lore) =>
    lore.manifestations.map((model) => ({
      loreId: lore.id,
      loreName: lore.name,
      model,
    })),
  );
}

export function pathToGlorySpellIds(list: ArmyList): string[] {
  if (!isPathToGloryList(list)) {
    return [];
  }
  return list.pathToGlory?.spellIds ?? [];
}

export function pathToGloryManifestationIds(list: ArmyList): string[] {
  if (!isPathToGloryList(list)) {
    return [];
  }
  return list.pathToGlory?.manifestationIds ?? [];
}

export function learnedSpellsForList(
  list: ArmyList,
  faction: FactionCatalogue,
): LearnedSpell[] {
  const picked = new Set(pathToGlorySpellIds(list));
  return factionSpellPicks(faction).filter((item) => picked.has(item.key));
}

export function learnedManifestationsForList(
  list: ArmyList,
  faction: FactionCatalogue,
): ManifestationModel[] {
  const picked = new Set(pathToGloryManifestationIds(list));
  return factionManifestationPicks(faction)
    .filter((item) => picked.has(item.model.id))
    .map((item) => item.model);
}

export function pathToGloryManifestationPoints(
  list: ArmyList,
  faction: FactionCatalogue,
): number {
  return learnedManifestationsForList(list, faction).reduce(
    (sum, model) => sum + (model.points ?? 0),
    0,
  );
}

export function findLearnedSpell(
  list: ArmyList,
  faction: FactionCatalogue,
  name: string,
): UnitAbility | undefined {
  return learnedSpellsForList(list, faction).find(
    (item) => item.power.name === name,
  )?.power;
}
