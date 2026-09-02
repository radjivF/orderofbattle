import { createId } from "@/lib/id";
import type { TowList, TowSelection } from "./types";
import { getTowFaction, getTowUnit } from "./queries";

export function isTowList(list: { game?: string } | null | undefined): list is TowList {
  return list?.game === "tow";
}

export function normalizeTowList(list: TowList): TowList {
  const selections = Array.isArray(list.selections) ? list.selections : [];
  return {
    ...list,
    game: "tow",
    generalSelectionId: list.generalSelectionId ?? null,
    selections: selections.map(normalizeSelection),
    lastOpenedAt: list.lastOpenedAt ?? list.updatedAt,
  };
}

function normalizeSelection(selection: TowSelection): TowSelection {
  return {
    ...selection,
    commandIds: Array.isArray(selection.commandIds) ? selection.commandIds : [],
    optionIds: Array.isArray(selection.optionIds) ? selection.optionIds : [],
    magicItemIds: Array.isArray(selection.magicItemIds)
      ? selection.magicItemIds
      : [],
    joinSelectionId: selection.joinSelectionId ?? null,
    detachments: Array.isArray(selection.detachments)
      ? selection.detachments.map(normalizeSelection)
      : [],
  };
}

export function blankTowArmy(
  factionId: string,
  name?: string,
  pointsCap?: number,
): TowList {
  const faction = getTowFaction(factionId);
  const now = Date.now();
  return {
    game: "tow",
    id: createId(),
    name: name?.trim() || faction?.name || "New list",
    factionId,
    pointsCap: pointsCap ?? faction?.pointsCapDefault ?? 2000,
    generalSelectionId: null,
    selections: [],
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

function makeTowSelection(
  unitId: string,
  category: TowList["selections"][number]["category"],
  models: number,
): TowSelection {
  return {
    id: createId(),
    unitId,
    category,
    models,
    commandIds: [],
    optionIds: [],
    magicItemIds: [],
    joinSelectionId: null,
    detachments: [],
  };
}

function mapTree(
  selections: TowSelection[],
  id: string,
  fn: (selection: TowSelection) => TowSelection,
): TowSelection[] {
  return selections.map((selection) => {
    if (selection.id === id) {
      return fn(selection);
    }
    return {
      ...selection,
      detachments: mapTree(selection.detachments, id, fn),
    };
  });
}

function removeTree(selections: TowSelection[], id: string): TowSelection[] {
  return selections
    .filter((selection) => selection.id !== id)
    .map((selection) => ({
      ...selection,
      joinSelectionId:
        selection.joinSelectionId === id ? null : selection.joinSelectionId,
      detachments: removeTree(selection.detachments, id),
    }));
}

function firstCharacterId(list: TowList): string | null {
  const faction = getTowFaction(list.factionId);
  for (const selection of list.selections) {
    const unit = faction ? getTowUnit(faction, selection.unitId) : undefined;
    if (unit?.character) {
      return selection.id;
    }
  }
  return null;
}

export function setTowModels(
  list: TowList,
  selectionId: string,
  models: number,
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      models,
    })),
  };
}

export function toggleTowCommand(
  list: TowList,
  selectionId: string,
  commandId: string,
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      commandIds: selection.commandIds.includes(commandId)
        ? selection.commandIds.filter((id) => id !== commandId)
        : [...selection.commandIds, commandId],
    })),
  };
}

export function toggleTowOption(
  list: TowList,
  selectionId: string,
  optionId: string,
  groupOptionIds: string[],
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => {
      if (selection.optionIds.includes(optionId)) {
        return {
          ...selection,
          optionIds: selection.optionIds.filter((id) => id !== optionId),
        };
      }
      return {
        ...selection,
        optionIds: [
          ...selection.optionIds.filter((id) => !groupOptionIds.includes(id)),
          optionId,
        ],
      };
    }),
  };
}

export function setTowMagicItems(
  list: TowList,
  selectionId: string,
  magicItemIds: string[],
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      magicItemIds,
    })),
  };
}

export function setTowCharacterLoadout(
  list: TowList,
  selectionId: string,
  loadout: {
    optionIds: string[];
    commandIds: string[];
    magicItemIds: string[];
  },
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      optionIds: loadout.optionIds,
      commandIds: loadout.commandIds,
      magicItemIds: loadout.magicItemIds,
    })),
  };
}

export function setTowGeneral(list: TowList, selectionId: string): TowList {
  return { ...list, generalSelectionId: selectionId };
}

export function setTowJoin(
  list: TowList,
  selectionId: string,
  joinSelectionId: string | null,
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      joinSelectionId,
    })),
  };
}

export function setTowPlayDamage(
  list: TowList,
  selectionId: string,
  damage: number,
): TowList {
  return {
    ...list,
    selections: mapTree(list.selections, selectionId, (selection) => ({
      ...selection,
      play: { damage: Math.max(0, damage) },
    })),
  };
}

export function removeTowSelection(list: TowList, selectionId: string): TowList {
  const next: TowList = {
    ...list,
    selections: removeTree(list.selections, selectionId),
  };
  if (next.generalSelectionId === selectionId) {
    next.generalSelectionId = firstCharacterId(next);
  }
  return next;
}


export function addTowUnit(
  list: TowList,
  unitId: string,
): TowList | null {
  const faction = getTowFaction(list.factionId);
  const unit = faction ? getTowUnit(faction, unitId) : undefined;
  if (!unit) {
    return null;
  }
  const selection = makeTowSelection(unit.id, unit.category, unit.minModels);
  const next: TowList = {
    ...list,
    selections: [...list.selections, selection],
  };
  if (!next.generalSelectionId && unit.character) {
    next.generalSelectionId = selection.id;
  }
  return next;
}

export function addTowDetachment(
  list: TowList,
  parentId: string,
  unitId: string,
): TowList | null {
  const faction = getTowFaction(list.factionId);
  const unit = faction ? getTowUnit(faction, unitId) : undefined;
  if (!unit || unit.character) {
    return null;
  }
  return {
    ...list,
    selections: list.selections.map((selection) => {
      if (selection.id !== parentId || selection.detachments.length >= 2) {
        return selection;
      }
      return {
        ...selection,
        detachments: [
          ...selection.detachments,
          makeTowSelection(unit.id, selection.category, unit.minModels),
        ],
      };
    }),
  };
}
