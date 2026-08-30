export type PathToGloryRank =
  | "untested"
  | "aspiring"
  | "elite"
  | "mighty"
  | "legendary";

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

export function clampRenown(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(99, Math.floor(value));
}
