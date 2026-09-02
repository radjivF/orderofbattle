import type { PathToGloryPath } from "./catalogue";
import {
  PATH_ABILITY_RANKS,
  rankAbilityUnlocked,
  type PathAbilityRank,
} from "./ranks";

export function pathOptionsForRank(
  path: PathToGloryPath,
  rank: PathAbilityRank,
) {
  return path.options.filter((option) => option.rank === rank);
}

export function prunePathOptionIds(
  path: PathToGloryPath | undefined,
  optionIds: readonly string[] | undefined,
  renown: number,
): string[] {
  if (!path) {
    return [];
  }
  const kept: string[] = [];
  const seenRank = new Set<PathAbilityRank>();
  for (const optionId of optionIds ?? []) {
    const option = path.options.find((item) => item.id === optionId);
    if (!option || !rankAbilityUnlocked(renown, option.rank)) {
      continue;
    }
    if (seenRank.has(option.rank)) {
      continue;
    }
    seenRank.add(option.rank);
    kept.push(option.id);
  }
  return kept;
}

export function pickPathOption(
  path: PathToGloryPath,
  optionIds: readonly string[],
  optionId: string,
  renown: number,
): string[] {
  const option = path.options.find((item) => item.id === optionId);
  if (!option || !rankAbilityUnlocked(renown, option.rank)) {
    return prunePathOptionIds(path, optionIds, renown);
  }
  const current = prunePathOptionIds(path, optionIds, renown);
  if (current.includes(optionId)) {
    return current.filter((id) => id !== optionId);
  }
  return [
    ...current.filter((id) => {
      const existing = path.options.find((item) => item.id === id);
      return existing?.rank !== option.rank;
    }),
    optionId,
  ];
}

export { PATH_ABILITY_RANKS };
