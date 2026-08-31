export type PathToGloryRank =
  | "untested"
  | "aspiring"
  | "elite"
  | "mighty"
  | "legendary";

export const PATH_ABILITY_RANKS = [
  "aspiring",
  "elite",
  "mighty",
  "legendary",
] as const;

export type PathAbilityRank = (typeof PATH_ABILITY_RANKS)[number];

export function rankForRenown(renown: number): PathToGloryRank {
  if (renown >= 45) {
    return "legendary";
  }
  if (renown >= 30) {
    return "mighty";
  }
  if (renown >= 15) {
    return "elite";
  }
  if (renown >= 5) {
    return "aspiring";
  }
  return "untested";
}

export function rankLabel(rank: PathToGloryRank): string {
  if (rank === "untested") {
    return "Untested";
  }
  if (rank === "aspiring") {
    return "Aspiring";
  }
  if (rank === "elite") {
    return "Elite";
  }
  if (rank === "mighty") {
    return "Mighty";
  }
  return "Legendary";
}

export function renownToUnlockRank(rank: PathAbilityRank): number {
  if (rank === "aspiring") {
    return 5;
  }
  if (rank === "elite") {
    return 15;
  }
  if (rank === "mighty") {
    return 30;
  }
  return 45;
}

export function rankAbilityUnlocked(
  renown: number,
  rank: PathAbilityRank,
): boolean {
  return renown >= renownToUnlockRank(rank);
}

export function clampRenown(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(99, Math.floor(value));
}
