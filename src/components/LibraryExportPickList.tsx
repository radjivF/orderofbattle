"use client";

import { getFaction } from "@/engine/queries";
import {
  catalogueForList,
  isSpearheadList,
} from "@/engine/spearhead";
import { isTowList, type StoredList } from "@/engine/storedList";
import { getTowFaction } from "@/engine/tow/queries";
import { summarize } from "@/engine/validate";
import {
  libraryListExportSubtitle,
  SHEET_CHECKLIST_ITEM_CLASS,
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
} from "@/lib/builderUi";

type Props = {
  lists: StoredList[];
  selectedIds: string[];
  onToggle: (listId: string) => void;
};

function exportSubtitle(list: StoredList): string {
  if (isTowList(list)) {
    return libraryListExportSubtitle({
      factionName: getTowFaction(list.factionId)?.name ?? "Unknown faction",
      spearhead: false,
      pointsCap: list.pointsCap,
    });
  }
  const playCatalogue = catalogueForList(list);
  return libraryListExportSubtitle({
    factionName: getFaction(list.factionId)?.name ?? "Unknown faction",
    spearhead: isSpearheadList(list),
    pointsCap: list.pointsCap,
    spearheadBoxName: playCatalogue?.name,
    drops: playCatalogue ? summarize(list, playCatalogue).drops : undefined,
  });
}

export function LibraryExportPickList({
  lists,
  selectedIds,
  onToggle,
}: Props) {
  return (
    <ul className="flex flex-col gap-2 px-3 pb-4">
      {lists.map((list) => {
        const checked = selectedIds.includes(list.id);
        return (
          <li key={list.id}>
            <label
              className={`${SHEET_CHECKLIST_ITEM_CLASS} ${
                checked ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(list.id)}
                aria-label={`Export ${list.name}`}
                className="mt-0.5 size-5 shrink-0 accent-aether"
              />
              <span className="min-w-0">
                <span className="block font-medium text-parchment-ink">
                  {list.name}
                </span>
                <span className="block text-sm text-sheet-muted">
                  {exportSubtitle(list)}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
