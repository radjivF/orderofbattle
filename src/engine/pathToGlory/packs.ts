import type {
  ArmyList,
  PathToGloryBattlepackPreset,
  PathToGloryPackId,
  PathToGloryState,
} from "../types";

export const PATH_TO_GLORY_PACKS: {
  id: PathToGloryPackId;
  label: string;
}[] = [
  { id: "ascension", label: "Ascension" },
  { id: "ravaged-coast", label: "Ravaged Coast" },
  { id: "blighted-wilds", label: "Blighted Wilds" },
];

const PACK_ORDER: PathToGloryPackId[] = PATH_TO_GLORY_PACKS.map(
  (pack) => pack.id,
);

export type LegacyPathToGloryState = {
  packIds?: PathToGloryPackId[];
  battlepackPreset?: PathToGloryBattlepackPreset;
  spellIds?: string[];
  manifestationIds?: string[];
  warlordSelectionId?: string | null;
  questId?: string | null;
  questPoints?: number;
  battleplanId?: string | null;
};

export function isPathToGloryPackId(
  value: string,
): value is PathToGloryPackId {
  return PACK_ORDER.includes(value as PathToGloryPackId);
}

export function normalizePackIds(
  ids: readonly string[] | undefined,
): PathToGloryPackId[] {
  const picked = new Set(ids?.filter(isPathToGloryPackId));
  const next = PACK_ORDER.filter((id) => picked.has(id));
  return next.length > 0 ? next : ["ascension"];
}

export function togglePathToGloryPack(
  ids: PathToGloryPackId[],
  id: PathToGloryPackId,
): PathToGloryPackId[] {
  const picked = new Set(normalizePackIds(ids));
  if (picked.has(id)) {
    picked.delete(id);
  } else {
    picked.add(id);
  }
  return normalizePackIds([...picked]);
}

/** Old nested presets → pack ids. New lists store packs independently. */
export function resolveBattlepacks(
  preset: PathToGloryBattlepackPreset,
): PathToGloryPackId[] {
  if (preset === "ascension") {
    return ["ascension"];
  }
  if (preset === "ravaged-coast") {
    return ["ascension", "ravaged-coast"];
  }
  return ["ascension", "ravaged-coast", "blighted-wilds"];
}

export function packIdsFromState(
  state: LegacyPathToGloryState | undefined,
): PathToGloryPackId[] {
  if (state?.packIds && state.packIds.length > 0) {
    return normalizePackIds(state.packIds);
  }
  if (state?.battlepackPreset) {
    return resolveBattlepacks(state.battlepackPreset);
  }
  return ["ascension"];
}

export function uniqueLearnedIds(ids: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of ids ?? []) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function toggleLearnedId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }
  return [...ids, id];
}

export function normalizePathToGloryState(
  state: LegacyPathToGloryState | undefined,
): PathToGloryState {
  return {
    packIds: packIdsFromState(state),
    spellIds: uniqueLearnedIds(state?.spellIds),
    manifestationIds: uniqueLearnedIds(state?.manifestationIds),
    warlordSelectionId: state?.warlordSelectionId ?? null,
    questId: state?.questId ?? null,
    questPoints: state?.questPoints ?? 0,
    battleplanId: state?.battleplanId ?? null,
  };
}

export function isPathToGloryList(list: ArmyList): boolean {
  return list.kind === "pathToGlory";
}

export function pathToGloryPackIds(list: ArmyList): PathToGloryPackId[] {
  if (!isPathToGloryList(list)) {
    return [];
  }
  return packIdsFromState(list.pathToGlory);
}

/** Always true for PTG (Battle Wounds + Drained always visible). */
export function showsBattleWoundsAndScars(list: ArmyList): boolean {
  return isPathToGloryList(list);
}

/** True if Ravaged Coast or Blighted Wilds pack is on (Scar field visible). */
export function showsScars(list: ArmyList): boolean {
  const packIds = pathToGloryPackIds(list);
  return packIds.includes("ravaged-coast") || packIds.includes("blighted-wilds");
}

export function packLabel(id: PathToGloryPackId): string {
  return PATH_TO_GLORY_PACKS.find((pack) => pack.id === id)?.label ?? id;
}

/** New Recruit / App headers like "Path to Glory: Ravaged Coast". */
export function packsFromImportText(text: string): PathToGloryPackId[] | null {
  // Explicit pack mentions
  if (/path\s+to\s+glory/i.test(text)) {
    if (/blighted\s+wilds/i.test(text)) {
      return resolveBattlepacks("blighted-wilds");
    }
    if (/ravaged\s+coast/i.test(text)) {
      return resolveBattlepacks("ravaged-coast");
    }
    return ["ascension"];
  }
  
  // Detect PTG by content markers (path names, renown, scars, battle wounds)
  // Require at least 2 strong markers to avoid false positives
  // (Anvil unit name appears in catalogs, so don't use it alone)
  const hasRenown = /\b\d+\s+renown\b/i.test(text);
  const hasPath = /\bpath\s+of\s+the\s+(warrior|leader|mage|devout|attacker|defender|artillerist|behemoth|brawler|bulwark|cavalier|colossus|conjurer|dragoon|duellist|guardian|invoker|pack|ruler|sorcerer|warmonger|zealot|foresters|weald-born|alchemist|woodsman|thyrian\s+druid|sacrifice\s+master)\b/i.test(text);
  const hasScar = /\b(ash-blighted|hissing\s+wheezes|raging\s+agonies|scorched\s+limbs|smouldering\s+scars|unyielding\s+blisters|blood-deep\s+corruption)\b/i.test(text);
  const hasBattleWounds = /\bbattle\s+wounds?\s*:\s*\d+\b/i.test(text);
  
  // Require at least 2 strong markers
  const markerCount = [hasRenown, hasPath, hasScar, hasBattleWounds].filter(Boolean).length;
  const looksLikePTG = markerCount >= 2;
  
  if (!looksLikePTG) {
    return null;
  }
  
  // Infer pack from path names or default to Ascension
  if (/path\s+of\s+the\s+(foresters|weald-born|alchemist|woodsman|thyrian\s+druid|sacrifice\s+master)\b/i.test(text)) {
    return resolveBattlepacks("blighted-wilds");
  }
  if (/path\s+of\s+the\s+(artillerist|behemoth|brawler|bulwark|cavalier|colossus|conjurer|dragoon|duellist|guardian|invoker|pack|ruler|sorcerer|warmonger|zealot)\b/i.test(text)) {
    return resolveBattlepacks("ravaged-coast");
  }
  
  return ["ascension"];
}

export function pathToGloryPacksLabel(packIds: PathToGloryPackId[]): string {
  return normalizePackIds(packIds).map(packLabel).join(" · ");
}
