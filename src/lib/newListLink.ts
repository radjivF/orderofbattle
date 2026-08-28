import {
  armyOfRenownName,
  getFaction,
  isArmyOfRenown,
} from "@/engine/queries";
import type { FactionCatalogue } from "@/engine/types";

export const NEW_LIST_PARAM = "new";
export const NEW_LIST_FACTION_PARAM = "faction";

export type NewListDraft = {
  faction: FactionCatalogue | null;
  parent: FactionCatalogue | null;
  name: string;
  points: number;
};

/** Deep-link to My lists with the new-list sheet open. */
export function newListPath(factionId?: string): string {
  const params = new URLSearchParams();
  params.set(NEW_LIST_PARAM, "1");
  if (factionId) {
    params.set(NEW_LIST_FACTION_PARAM, factionId);
  }
  return `/dashboard?${params.toString()}`;
}

export function resolveNewListFaction(
  factionId: string | null | undefined,
): { faction: FactionCatalogue; parent: FactionCatalogue } | null {
  if (!factionId) {
    return null;
  }
  const faction = getFaction(factionId);
  if (!faction) {
    return null;
  }
  if (isArmyOfRenown(faction)) {
    const parentId = faction.parentFactionIds?.[0];
    const parent = parentId ? getFaction(parentId) : undefined;
    return { faction, parent: parent ?? faction };
  }
  return { faction, parent: faction };
}

/** `null` when the URL is not a new-list intent. */
export function newListDraftFromSearch(
  search: URLSearchParams,
): NewListDraft | null {
  if (search.get(NEW_LIST_PARAM) !== "1") {
    return null;
  }
  const resolved = resolveNewListFaction(
    search.get(NEW_LIST_FACTION_PARAM)?.trim() || null,
  );
  if (!resolved) {
    return { faction: null, parent: null, name: "", points: 2000 };
  }
  return {
    faction: resolved.faction,
    parent: resolved.parent,
    name: `My ${armyOfRenownName(resolved.faction)}`,
    points: resolved.faction.pointsCapDefault,
  };
}
