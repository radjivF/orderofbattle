import type {
  PathToGloryBattlepackPreset,
  PathToGloryPackId,
  PathToGloryScarSeverity,
  UnitAbility,
} from "../types";
import extractedPaths from "../data/path-to-glory-paths.json";
import { normalizePackIds, resolveBattlepacks } from "./packs";
import type { PathAbilityRank } from "./ranks";

export type PathToGloryPathOption = {
  id: string;
  name: string;
  rank: PathAbilityRank;
  ability: UnitAbility;
};

export type PathToGloryPath = {
  id: string;
  name: string;
  pack: PathToGloryPackId;
  options: PathToGloryPathOption[];
};

export type PathToGloryWound = {
  id: string;
  name: string;
};

export type PathToGloryScar = {
  id: string;
  name: string;
  severity: PathToGloryScarSeverity;
};

/** Names and ability profiles from BSData Path to Glory catalogues. */
export const PATH_TO_GLORY_PATHS: PathToGloryPath[] =
  extractedPaths as PathToGloryPath[];

export const PATH_TO_GLORY_WOUNDS: PathToGloryWound[] = [
  { id: "drained", name: "Drained" },
];

export const PATH_TO_GLORY_SCARS: PathToGloryScar[] = [
  { id: "ash-blighted", name: "Ash-blighted", severity: "critical" },
  { id: "hissing-wheezes", name: "Hissing Wheezes", severity: "critical" },
  { id: "raging-agonies", name: "Raging Agonies", severity: "critical" },
  { id: "scorched-limbs", name: "Scorched Limbs", severity: "serious" },
  { id: "smouldering-scars", name: "Smouldering Scars", severity: "serious" },
  { id: "unyielding-blisters", name: "Unyielding Blisters", severity: "serious" },
  {
    id: "blood-deep-corruption",
    name: "Blood-deep Corruption",
    severity: "severe",
  },
];

export function pathsForPacks(
  packIds: PathToGloryPackId[],
): PathToGloryPath[] {
  const packs = new Set(normalizePackIds(packIds));
  return PATH_TO_GLORY_PATHS.filter((path) => packs.has(path.pack));
}

export function pathsForPreset(
  preset: PathToGloryBattlepackPreset,
): PathToGloryPath[] {
  return pathsForPacks(resolveBattlepacks(preset));
}

export function findPath(pathId: string | null | undefined) {
  if (!pathId) {
    return undefined;
  }
  return PATH_TO_GLORY_PATHS.find((path) => path.id === pathId);
}

export function findPathOption(
  path: PathToGloryPath | undefined,
  optionId: string | null | undefined,
) {
  if (!path || !optionId) {
    return undefined;
  }
  return path.options.find((option) => option.id === optionId);
}

export function findWound(woundId: string | null | undefined) {
  if (!woundId) {
    return undefined;
  }
  return PATH_TO_GLORY_WOUNDS.find((wound) => wound.id === woundId);
}

export function findScar(scarId: string | null | undefined) {
  if (!scarId) {
    return undefined;
  }
  return PATH_TO_GLORY_SCARS.find((scar) => scar.id === scarId);
}

export function scarSeverityLabel(severity: PathToGloryScarSeverity): string {
  if (severity === "critical") {
    return "Critical";
  }
  if (severity === "serious") {
    return "Serious";
  }
  return "Severe";
}
