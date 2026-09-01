"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { StoredList } from "@/engine/storedList";
import { listGame } from "@/engine/storedList";
import {
  getActiveMenuServerSnapshot,
  getActiveMenuSnapshot,
  menuShowsListLibrary,
  subscribeActiveMenu,
} from "@/lib/activeMenu";
import {
  CONFIRM_SHEET_PANEL_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import {
  deleteArmy,
  duplicateArmy,
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import {
  getLibrarySortServerSnapshot,
  getLibrarySortSnapshot,
  setLibrarySortMode,
  sortLibraryLists,
  type LibrarySortMode,
  subscribeLibrarySort,
} from "@/lib/librarySort";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { LibraryCreateFlow } from "./LibraryCreateFlow";
import { LibraryListCard } from "./LibraryListCard";
import { LibraryOptionsSheet } from "./LibraryOptionsSheet";
import {
  BattleRecordHost,
  isBattleRecordPath,
} from "./BattleRecordHost";
import { ModalFrame } from "./ModalFrame";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { IosNavAddButton, IosNavOptionsButton } from "./ios/IosNavIconButton";
import { SiteFooter } from "./SiteFooter";

export function LibraryScreen() {
  const pathname = usePathname();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const activeMenu = useSyncExternalStore(
    subscribeActiveMenu,
    getActiveMenuSnapshot,
    getActiveMenuServerSnapshot,
  );
  const sortMode = useSyncExternalStore(
    subscribeLibrarySort,
    getLibrarySortSnapshot,
    getLibrarySortServerSnapshot,
  );
  const [deleteTarget, setDeleteTarget] = useState<StoredList | null>(null);
  const [picking, setPicking] = useState(false);
  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const displayedLists = useMemo(() => {
    const libraryMenu = menuShowsListLibrary(activeMenu) ? activeMenu : "aos";
    const scoped = (lists ?? []).filter((list) => listGame(list) === libraryMenu);
    return sortLibraryLists(scoped, sortMode);
  }, [activeMenu, lists, sortMode]);
  const onBattleRecord = isBattleRecordPath(pathname);

  async function onDuplicate(list: StoredList) {
    await saveArmy(duplicateArmy(list));
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await deleteArmy(id);
  }

  async function onRename(list: StoredList, name: string) {
    const next = name.trim();
    if (!next || next === list.name) {
      return;
    }
    await saveArmy({ ...list, name: next });
  }

  function onSortModeChange(next: string) {
    setLibrarySortMode(next as LibrarySortMode);
  }

  const listsPane = (
    <div className="relative z-10 min-h-full text-parchment">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavOptionsButton
            label="List options"
            onClick={() => setLibrarySheetOpen(true)}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>My lists</h1>
          <IosNavAddButton
            label="New list"
            onClick={() => setPicking(true)}
          />
        </div>
      </div>
      <main className={`${SITE_COLUMN_CLASS} pb-20`}>
        {lists === undefined ? (
          <div
            className="flex flex-col items-center py-16"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span
              className="size-7 animate-spin rounded-full border-2 border-parchment/25 border-t-sigmarite"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium tracking-wide text-parchment">
              Loading your lists
            </p>
          </div>
        ) : displayedLists.length === 0 ? (
          <LibraryEmptyState
            onCreate={() => setPicking(true)}
            onImport={() => setLibrarySheetOpen(true)}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2 lg:gap-5">
            {displayedLists.map((list, index) => (
              <li key={list.id}>
                <LibraryListCard
                  list={list}
                  index={index}
                  onRename={onRename}
                  onDuplicate={onDuplicate}
                  onDelete={setDeleteTarget}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter showPitch={false} />

      <LibraryOptionsSheet
        open={librarySheetOpen}
        lists={displayedLists}
        sortMode={sortMode}
        onSortModeChange={onSortModeChange}
        onClose={() => setLibrarySheetOpen(false)}
      />

      {deleteTarget ? (
        <ModalFrame
          label="Delete list"
          onClose={() => setDeleteTarget(null)}
          panelClassName={CONFIRM_SHEET_PANEL_CLASS}
        >
          <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
            <span className="font-serif text-base text-parchment-ink">
              {deleteTarget.name}
            </span>{" "}
            will be removed from this device. This cannot be undone.
          </p>
          <ConfirmSheetActions
            onConfirm={() => void confirmDelete()}
            onCancel={() => setDeleteTarget(null)}
          />
        </ModalFrame>
      ) : null}

      <LibraryCreateFlow open={picking} onOpenChange={setPicking} />
    </div>
  );

  return (
    <>
      <div hidden={!onBattleRecord}>
        <BattleRecordHost />
      </div>
      <div hidden={onBattleRecord}>{listsPane}</div>
    </>
  );
}
