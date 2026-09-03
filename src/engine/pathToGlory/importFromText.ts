import type {
  ArmyList,
  CatalogueUnit,
  FactionCatalogue,
  PathToGlorySelectionState,
  Selection,
} from "../types";
import { isAnvilOfApotheosis, pickAnvilOption } from "./anvil";
import {
  PATH_TO_GLORY_PATHS,
  PATH_TO_GLORY_SCARS,
  PATH_TO_GLORY_WOUNDS,
  findPath,
} from "./catalogue";
import { pickPathOption } from "./pathOptions";
import { renownToUnlockRank } from "./ranks";
import { mergePathToGlory } from "./roster";
import { isPathToGloryList } from "./packs";

export function applyImportedPathToGloryModifier(
  list: ArmyList,
  faction: FactionCatalogue,
  raw: string,
  selection: Selection,
): boolean {
  if (!raw) {
    return false;
  }
  // Allow PTG modifier application even if list isn't PTG yet (detection may upgrade it)
  const name = tidyImportedModifier(raw);
  if (!name) {
    return false;
  }
  const unit = faction.units.find((item) => item.id === selection.unitId);
  if (applyAnvilModifier(selection, unit, name)) {
    return true;
  }
  if (applyPathModifier(selection, name)) {
    return true;
  }
  if (applyWoundOrScar(selection, name)) {
    return true;
  }
  // Only try hero gear if list is PTG (these are PTG-specific enhancements)
  if (isPathToGloryList(list) && applyHeroGear(selection, faction, name)) {
    return true;
  }
  return false;
}

function applyAnvilModifier(
  selection: Selection,
  unit: CatalogueUnit | undefined,
  name: string,
): boolean {
  if (!unit || !isAnvilOfApotheosis(unit)) {
    return false;
  }
  const rank = unit.anvilRanks?.find((item) => namesEqual(item.name, name));
  if (rank) {
    patch(selection, { anvilRankId: rank.id });
    return true;
  }
  for (const group of unit.anvilForge ?? []) {
    const option = group.options.find((item) => namesEqual(item.name, name));
    if (!option) {
      continue;
    }
    patch(selection, {
      anvilPickIds: pickAnvilOption(
        unit,
        selection.pathToGlory?.anvilPickIds ?? [],
        group.id,
        option.id,
      ),
    });
    return true;
  }
  return false;
}

function applyPathModifier(selection: Selection, name: string): boolean {
  const renown = parseRenown(name);
  if (renown != null) {
    patch(selection, { renown });
    return true;
  }
  const path = PATH_TO_GLORY_PATHS.find((item) => namesEqual(item.name, name));
  if (path) {
    patch(selection, { pathId: path.id });
    return true;
  }
  const currentPath = findPath(selection.pathToGlory?.pathId);
  const onCurrent = currentPath?.options.find((item) =>
    namesEqual(item.name, name),
  );
  if (currentPath && onCurrent) {
    const nextRenown = Math.max(
      selection.pathToGlory?.renown ?? 0,
      renownToUnlockRank(onCurrent.rank),
    );
    patch(selection, {
      renown: nextRenown,
      pathOptionIds: pickPathOption(
        currentPath,
        selection.pathToGlory?.pathOptionIds ?? [],
        onCurrent.id,
        nextRenown,
      ),
    });
    return true;
  }
  for (const item of PATH_TO_GLORY_PATHS) {
    const option = item.options.find((entry) => namesEqual(entry.name, name));
    if (!option) {
      continue;
    }
    const nextRenown = Math.max(
      selection.pathToGlory?.renown ?? 0,
      renownToUnlockRank(option.rank),
    );
    patch(selection, {
      pathId: item.id,
      renown: nextRenown,
      pathOptionIds: pickPathOption(
        item,
        selection.pathToGlory?.pathOptionIds ?? [],
        option.id,
        nextRenown,
      ),
    });
    return true;
  }
  return false;
}

function applyWoundOrScar(selection: Selection, name: string): boolean {
  const wound = PATH_TO_GLORY_WOUNDS.find((item) => namesEqual(item.name, name));
  if (wound) {
    patch(selection, { battleWoundId: wound.id });
    return true;
  }
  const scar = PATH_TO_GLORY_SCARS.find((item) => namesEqual(item.name, name));
  if (scar) {
    patch(selection, { scarId: scar.id });
    return true;
  }
  return false;
}

function applyHeroGear(
  selection: Selection,
  faction: FactionCatalogue,
  name: string,
): boolean {
  const artefact = faction.artefacts.find((item) => namesEqual(item.name, name));
  if (artefact) {
    patch(selection, { artefactId: artefact.id });
    return true;
  }
  const trait = faction.heroicTraits.find((item) => namesEqual(item.name, name));
  if (trait) {
    patch(selection, { heroicTraitId: trait.id });
    return true;
  }
  return false;
}

function parseRenown(name: string): number | null {
  const match =
    name.match(/^(\d+)\s*renown$/i) || name.match(/^renown[:\s]+(\d+)$/i);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(value) ? value : null;
}

function patch(selection: Selection, next: Partial<PathToGlorySelectionState>) {
  const merged = mergePathToGlory(selection, next);
  selection.pathToGlory = merged.pathToGlory;
}

function tidyImportedModifier(raw: string): string {
  const labeled = raw.match(
    /^(Artefact|Heroic Trait|Path|Renown|Battle Wound|Scar)\s*[-–—:]\s*(.+)$/i,
  );
  const value = labeled ? (labeled[2] ?? "").trim() : raw;
  return value
    .replace(/\s*[·•]\s*[+-]?\d+\s*(pts?|dest(iny)?)\.?$/i, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();
}

function namesEqual(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘‛]/g, "'")
    .replace(/[-–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
