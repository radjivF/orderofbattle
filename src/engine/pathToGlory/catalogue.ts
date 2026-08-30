import type { PathToGloryPackId, PathToGloryScarSeverity } from "../types";
import { resolveBattlepacks } from "./packs";
import type { PathToGloryBattlepackPreset } from "../types";

export type PathToGloryPath = {
  id: string;
  name: string;
  pack: PathToGloryPackId;
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

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function paths(
  pack: PathToGloryPackId,
  names: string[],
): PathToGloryPath[] {
  return names.map((name) => ({ id: slug(name), name, pack }));
}

/** Names from BSData / New Recruit Path to Glory catalogues. No ability text. */
export const PATH_TO_GLORY_PATHS: PathToGloryPath[] = [
  ...paths("ascension", [
    "Path of the Attacker",
    "Path of the Defender",
    "Path of the Devout",
    "Path of the Leader",
    "Path of the Mage",
    "Path of the Warrior",
  ]),
  ...paths("ravaged-coast", [
    "Path of the Artillerist",
    "Path of the Behemoth",
    "Path of the Brawler",
    "Path of the Bulwark",
    "Path of the Cavalier",
    "Path of the Colossus",
    "Path of the Conjurer",
    "Path of the Dragoon",
    "Path of the Duellist",
    "Path of the Guardian",
    "Path of the Invoker",
    "Path of the Pack",
    "Path of the Ruler",
    "Path of the Sorcerer",
    "Path of the Warmonger",
    "Path of the Zealot",
  ]),
];

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

export function pathsForPreset(
  preset: PathToGloryBattlepackPreset,
): PathToGloryPath[] {
  const packs = new Set(resolveBattlepacks(preset));
  return PATH_TO_GLORY_PATHS.filter((path) => packs.has(path.pack));
}

export function findPath(pathId: string | null | undefined) {
  if (!pathId) {
    return undefined;
  }
  return PATH_TO_GLORY_PATHS.find((path) => path.id === pathId);
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
