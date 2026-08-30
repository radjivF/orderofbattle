"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useEffect, useCallback, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { getFaction, armyOfRenownName } from "@/engine/queries";
import {
  catalogueForList,
  getSpearhead,
  isSpearheadList,
} from "@/engine/spearhead";
import { parseNewListArmyValue } from "@/lib/newListArmyOptions";
import { summarize } from "@/engine/validate";
import {
  LIST_IMPORT_HELP,
  parsePortableLists,
  partitionPortableLists,
  portableAllListsFileName,
  portableListFileName,
  portableMimeType,
  serializeListsForFormat,
  type PortableFormat,
} from "@/engine/listPortable";
import type { ArmyList, FactionCatalogue } from "@/engine/types";
import { factionPickerCounts } from "@/lib/factionSeo";
import { downloadTextFile } from "@/lib/downloadFile";
import {
  blankArmy,
  blankSpearhead,
  deleteArmy,
  duplicateArmy,
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  importArmies,
  saveArmy,
  subscribeArmies,
} from "@/lib/storage";
import {
  rememberListCreate,
  peekListCreateSplash,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import {
  libraryCreatingSplashVisible,
} from "@/lib/listFlowNav";
import { newListDraftFromSearch } from "@/lib/newListLink";
import {
  getLibrarySortServerSnapshot,
  getLibrarySortSnapshot,
  setLibrarySortMode,
  sortLibraryLists,
  subscribeLibrarySort,
  type LibrarySortMode,
} from "@/lib/librarySort";
import {
  CONFIRM_CANCEL_BUTTON_CLASS,
  CONFIRM_SHEET_ACTIONS_CLASS,
  CONFIRM_SHEET_PANEL_CLASS,
  IOS_LIQUID_CTA_CLASS,
  SHEET_CHECKLIST_ITEM_CLASS,
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  MODAL_SHEET_FOOTER_CLASS,
  SHEET_INLINE_LINK_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  SHEET_HEADER_CLASS,
  LIBRARY_OPTIONS_SHEET_PANEL_CLASS,
  libraryListExportSubtitle,
} from "@/lib/builderUi";
import { useListFlowChrome } from "./ListFlowShell";
import { FactionArtLayers } from "./FactionArtBackground";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { LibraryCreateSheet } from "./LibraryCreateSheet";
import { LibraryImportConfirm } from "./LibraryImportConfirm";
import { LibraryListCard } from "./LibraryListCard";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { ListLoadingSplash } from "./ListLoadingSplash";
import { ModalFrame } from "./ModalFrame";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SiteFooter } from "./SiteFooter";

type LibrarySheetTab = "import" | "export";
type ExportPhase = "pick" | "preview";

export function LibraryScreen() {
  const router = useRouter();
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [deleteTarget, setDeleteTarget] = useState<ArmyList | null>(null);
  const [picking, setPicking] = useState(false);
  const [draftFaction, setDraftFaction] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftParent, setDraftParent] = useState<FactionCatalogue | null>(
    null,
  );
  const [draftName, setDraftName] = useState("");
  const [draftPoints, setDraftPoints] = useState(2000);
  const [draftMode, setDraftMode] = useState<"points" | "spearhead">("points");
  const [draftSpearheadId, setDraftSpearheadId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState("");
  const [importConfirm, setImportConfirm] = useState<{
    novel: ArmyList[];
    skipped: number;
  } | null>(null);
  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const [librarySheetTab, setLibrarySheetTab] =
    useState<LibrarySheetTab>("import");
  const [exportPhase, setExportPhase] = useState<ExportPhase>("pick");
  const [exportSelectedIds, setExportSelectedIds] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<PortableFormat>("text");
  const [exportCopied, setExportCopied] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sortMode = useSyncExternalStore(
    subscribeLibrarySort,
    getLibrarySortSnapshot,
    getLibrarySortServerSnapshot,
  );
  const displayedLists = useMemo(
    () => (lists ? sortLibraryLists(lists, sortMode) : []),
    [lists, sortMode],
  );
  const createSplash = useSyncExternalStore(
    subscribeListOpenFaction,
    peekListCreateSplash,
    () => false,
  );
  const createCounts = draftFaction
    ? factionPickerCounts(draftFaction)
    : null;

  async function onCreate() {
    if (!draftFaction || creating) {
      return;
    }
    if (draftMode === "spearhead" && !draftSpearheadId) {
      return;
    }
    setCreating(true);
    const artFactionId =
      draftParent?.id ??
      draftFaction.parentFactionIds?.[0] ??
      draftFaction.id;
    rememberListCreate(artFactionId, (draftParent ?? draftFaction).name);
    try {
      const list =
        draftMode === "spearhead" && draftSpearheadId
          ? blankSpearhead(draftSpearheadId, draftName)
          : blankArmy(draftFaction.id, draftName, draftPoints);
      await saveArmy(list);
      setPicking(false);
      router.push(`/lists/${list.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function onDuplicate(list: ArmyList) {
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

  async function onRename(list: ArmyList, name: string) {
    const next = name.trim();
    if (!next || next === list.name) {
      return;
    }
    await saveArmy({ ...list, name: next });
  }

  const exportLists = useMemo(() => {
    if (
      !lists ||
      !librarySheetOpen ||
      librarySheetTab !== "export" ||
      exportPhase !== "preview"
    ) {
      return [];
    }
    const selected = new Set(exportSelectedIds);
    return lists.filter((list) => selected.has(list.id));
  }, [
    exportPhase,
    exportSelectedIds,
    librarySheetOpen,
    librarySheetTab,
    lists,
  ]);

  const exportContent = useMemo(() => {
    if (exportLists.length === 0) {
      return "";
    }
    return serializeListsForFormat(exportLists, exportFormat);
  }, [exportLists, exportFormat]);

  function resetExportState() {
    setExportPhase("pick");
    setExportSelectedIds([]);
    setExportFormat("text");
    setExportCopied(false);
  }

  function openLibrarySheet(tab: LibrarySheetTab = "import") {
    setLibrarySheetTab(tab);
    setImportDraft("");
    resetExportState();
    setLibrarySheetOpen(true);
  }

  function closeLibrarySheet() {
    setLibrarySheetOpen(false);
    setImportDraft("");
    resetExportState();
  }

  const openLibraryOptions = useCallback(() => {
    setLibrarySheetTab("import");
    setImportDraft("");
    setExportPhase("pick");
    setExportSelectedIds([]);
    setExportFormat("text");
    setExportCopied(false);
    setLibrarySheetOpen(true);
  }, []);

  function onLibrarySheetTabChange(next: string) {
    const tab = next as LibrarySheetTab;
    if (tab === librarySheetTab) {
      return;
    }
    setLibrarySheetTab(tab);
    if (tab === "import") {
      resetExportState();
    } else {
      setImportDraft("");
      resetExportState();
    }
  }

  function onSortModeChange(next: string) {
    setLibrarySortMode(next as LibrarySortMode);
  }

  function toggleExportList(listId: string) {
    setExportSelectedIds((current) =>
      current.includes(listId)
        ? current.filter((id) => id !== listId)
        : [...current, listId],
    );
  }

  function selectAllForExport() {
    setExportSelectedIds(lists?.map((list) => list.id) ?? []);
  }

  function confirmExportSelection() {
    if (!lists || exportSelectedIds.length === 0) {
      return;
    }
    setExportFormat("text");
    setExportCopied(false);
    setExportPhase("preview");
  }

  function backToExportPicker() {
    setExportFormat("text");
    setExportCopied(false);
    setExportPhase("pick");
  }

  async function copyExport() {
    if (!exportContent) {
      return;
    }
    await navigator.clipboard.writeText(exportContent);
    setExportCopied(true);
  }

  function downloadExport() {
    if (exportLists.length === 0 || !exportContent) {
      return;
    }
    const filename =
      exportLists.length === 1
        ? portableListFileName(exportLists[0]!.name, exportFormat)
        : portableAllListsFileName(exportFormat);
    downloadTextFile(filename, exportContent, portableMimeType(exportFormat));
  }

  function openImportPicker() {
    openLibrarySheet("import");
  }

  function beginImport(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    closeLibrarySheet();
    const parsed = parsePortableLists(trimmed);
    if (!parsed.ok) {
      setImportError(parsed.error);
      return;
    }
    setImportConfirm(partitionPortableLists(parsed.lists, lists ?? []));
  }

  function importFromDraft() {
    beginImport(importDraft);
  }

  function chooseImportFile() {
    importInputRef.current?.click();
  }

  async function onImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    beginImport(await file.text());
  }

  async function confirmImport() {
    if (!importConfirm || importConfirm.novel.length === 0) {
      setImportConfirm(null);
      return;
    }
    await importArmies(importConfirm.novel);
    setImportConfirm(null);
  }

  function closePicker() {
    if (creating) {
      return;
    }
    setPicking(false);
    setDraftFaction(null);
    setDraftParent(null);
    setDraftName("");
    setDraftPoints(2000);
    setDraftMode("points");
    setDraftSpearheadId(null);
  }

  function onDraftArmyChange(value: string) {
    if (!draftParent) {
      return;
    }
    const parsed = parseNewListArmyValue(value);
    const previousLabel =
      draftMode === "spearhead" && draftSpearheadId
        ? (getSpearhead(draftSpearheadId)?.name ?? draftParent.name)
        : armyOfRenownName(draftFaction ?? draftParent);
    if (parsed.kind === "spearhead") {
      const box = getSpearhead(parsed.spearheadId);
      setDraftMode("spearhead");
      setDraftSpearheadId(parsed.spearheadId);
      setDraftFaction(draftParent);
      setDraftName((current) =>
        current === `My ${previousLabel}`
          ? `My ${box?.name ?? draftParent.name}`
          : current,
      );
      return;
    }
    const next = getFaction(parsed.factionId) ?? draftParent;
    setDraftMode("points");
    setDraftSpearheadId(null);
    setDraftFaction(next);
    setDraftName((current) =>
      current === `My ${previousLabel}`
        ? `My ${armyOfRenownName(next)}`
        : current,
    );
  }

  function backToFactionPicker() {
    setDraftFaction(null);
    setDraftParent(null);
    setDraftName("");
    setDraftMode("points");
    setDraftSpearheadId(null);
  }

  const { setLibraryChrome } = useListFlowChrome();

  useLayoutEffect(() => {
    setLibraryChrome({
      openNewList: () => setPicking(true),
      openLibraryOptions,
    });
    return () => setLibraryChrome(null);
  }, [setLibraryChrome, openLibraryOptions]);

  useEffect(() => {
    if (!createSplash && creating) {
      setCreating(false);
    }
  }, [createSplash, creating]);

  useLayoutEffect(() => {
    const draft = newListDraftFromSearch(
      new URLSearchParams(window.location.search),
    );
    if (!draft) {
      return;
    }
    setPicking(true);
    setDraftFaction(draft.faction);
    setDraftParent(draft.parent);
    setDraftName(draft.name);
    setDraftPoints(draft.points);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  return (
    <div className="relative z-10 min-h-full text-parchment">
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void onImportFile(event)}
      />
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6 lg:max-w-5xl">
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
        ) : lists.length === 0 ? (
          <LibraryEmptyState
            onCreate={() => setPicking(true)}
            onImport={openImportPicker}
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
      <SiteFooter />

      {librarySheetOpen ? (
        <ModalFrame
          label="List options"
          onClose={closeLibrarySheet}
          panelClassName={LIBRARY_OPTIONS_SHEET_PANEL_CLASS}
        >
          <div className={SHEET_HEADER_CLASS}>
            <h2 className="font-serif text-2xl">List options</h2>
            <SheetCloseButton
              label="Close list options"
              onClick={closeLibrarySheet}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-5 pb-4">
              <p className="pb-2 text-sm font-medium text-sheet-muted">
                Sort lists by
              </p>
              <IosSegmentedControl
                ariaLabel="Sort lists"
                value={sortMode}
                onChange={onSortModeChange}
                options={[
                  { value: "recent", label: "Recent" },
                  { value: "alphabetic", label: "A–Z" },
                ]}
              />
            </div>
            <div className="shrink-0 px-5 pb-4">
              <IosSegmentedControl
                ariaLabel="Import or export lists"
                value={librarySheetTab}
                onChange={onLibrarySheetTabChange}
                options={[
                  { value: "import", label: "Import" },
                  { value: "export", label: "Export" },
                ]}
              />
            </div>
            <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
              <div className={MODAL_SHEET_SCROLL_CLASS}>
                {librarySheetTab === "import" ? (
                  <>
                    <p className="px-5 pb-3 text-sm leading-relaxed text-sheet-muted">
                      {LIST_IMPORT_HELP}
                    </p>
                    <textarea
                      value={importDraft}
                      onChange={(event) => setImportDraft(event.target.value)}
                      placeholder="Paste a Warhammer App, New Recruit, or Order of Battle list…"
                      aria-label="List to import"
                      className="mx-5 mb-4 block min-h-[16rem] w-[calc(100%-2.5rem)] resize-none rounded-xl bg-parchment-ink/5 px-3 py-3 font-mono text-xs leading-relaxed text-parchment-ink outline-none ring-1 ring-parchment-ink/10 placeholder:text-sheet-muted/70"
                    />
                  </>
                ) : exportPhase === "pick" ? (
                  <>
                    <p className="px-5 pb-3 text-sm leading-relaxed text-sheet-muted">
                      Choose one or more lists to export.
                    </p>
                    {lists && lists.length > 1 ? (
                      <div className="px-5 pb-2">
                        <button
                          type="button"
                          onClick={selectAllForExport}
                          className={SHEET_INLINE_LINK_CLASS}
                        >
                          Select all
                        </button>
                      </div>
                    ) : null}
                    {lists && lists.length > 0 ? (
                      <ul className="flex flex-col gap-2 px-3 pb-4">
                        {lists.map((list) => {
                          const faction = getFaction(list.factionId);
                          const playCatalogue = catalogueForList(list);
                          const totals = playCatalogue
                            ? summarize(list, playCatalogue)
                            : null;
                          const spearhead = isSpearheadList(list);
                          const checked = exportSelectedIds.includes(list.id);
                          return (
                            <li key={list.id}>
                              <label
                                className={`${SHEET_CHECKLIST_ITEM_CLASS} ${
                                  checked
                                    ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS
                                    : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleExportList(list.id)}
                                  aria-label={`Export ${list.name}`}
                                  className="mt-0.5 size-5 shrink-0 accent-aether"
                                />
                                <span className="min-w-0">
                                  <span className="block font-medium text-parchment-ink">
                                    {list.name}
                                  </span>
                                  <span className="block text-sm text-sheet-muted">
                                    {libraryListExportSubtitle({
                                      factionName:
                                        faction?.name ?? "Unknown faction",
                                      spearhead,
                                      pointsCap: list.pointsCap,
                                      spearheadBoxName: playCatalogue?.name,
                                      drops: totals?.drops,
                                    })}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="px-5 pb-4 text-sm text-sheet-muted">
                        No lists to export yet.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="px-5 pb-3 font-serif text-xl text-parchment-ink">
                      {exportLists.length === 1
                        ? "Export list"
                        : `Export ${exportLists.length} lists`}
                    </h3>
                    <div className="px-5 pb-3">
                      <IosSegmentedControl
                        ariaLabel="Export format"
                        value={exportFormat}
                        onChange={(next) => {
                          setExportFormat(next as PortableFormat);
                          setExportCopied(false);
                        }}
                        options={[
                          { value: "text", label: "Text" },
                          { value: "json", label: "JSON" },
                        ]}
                      />
                    </div>
                    <textarea
                      readOnly
                      value={exportContent}
                      aria-label="Exported list"
                      className="mx-5 mb-4 block min-h-[16rem] w-[calc(100%-2.5rem)] resize-none rounded-xl bg-parchment-ink/5 px-3 py-3 font-mono text-xs leading-relaxed text-parchment-ink outline-none ring-1 ring-parchment-ink/10"
                    />
                  </>
                )}
              </div>
            </div>
            {librarySheetTab === "import" ? (
              <div className={MODAL_SHEET_FOOTER_CLASS}>
                <button
                  type="button"
                  disabled={importDraft.trim().length === 0}
                  onClick={importFromDraft}
                  className={IOS_LIQUID_CTA_CLASS}
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={chooseImportFile}
                  className={SHEET_SECONDARY_BUTTON_CLASS}
                >
                  Choose file
                </button>
              </div>
            ) : exportPhase === "pick" ? (
              <div className={MODAL_SHEET_FOOTER_CLASS}>
                <button
                  type="button"
                  disabled={exportSelectedIds.length === 0}
                  onClick={confirmExportSelection}
                  className={IOS_LIQUID_CTA_CLASS}
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className={MODAL_SHEET_FOOTER_CLASS}>
                <button
                  type="button"
                  onClick={() => void copyExport()}
                  className={IOS_LIQUID_CTA_CLASS}
                >
                  {exportCopied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadExport}
                  className={SHEET_SECONDARY_BUTTON_CLASS}
                >
                  {exportFormat === "json" ? "Download .json" : "Download .txt"}
                </button>
                <button
                  type="button"
                  onClick={backToExportPicker}
                  className={CONFIRM_CANCEL_BUTTON_CLASS}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </ModalFrame>
      ) : null}

      {importConfirm ? (
        <LibraryImportConfirm
          importConfirm={importConfirm}
          onClose={() => setImportConfirm(null)}
          onConfirm={() => void confirmImport()}
        />
      ) : null}

      {importError ? (
        <ModalFrame
          label="Import failed"
          onClose={() => setImportError(null)}
          panelClassName={CONFIRM_SHEET_PANEL_CLASS}
        >
          <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
            {importError}
          </p>
          <div className={CONFIRM_SHEET_ACTIONS_CLASS}>
            <button
              type="button"
              onClick={() => setImportError(null)}
              className={IOS_LIQUID_CTA_CLASS}
            >
              OK
            </button>
          </div>
        </ModalFrame>
      ) : null}

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

      {picking && !creating ? (
        <LibraryCreateSheet
          open
          creating={creating}
          draftFaction={draftFaction}
          draftParent={draftParent}
          draftName={draftName}
          draftPoints={draftPoints}
          draftMode={draftMode}
          draftSpearheadId={draftSpearheadId}
          createCounts={createCounts}
          onClose={closePicker}
          onCreate={onCreate}
          onDraftNameChange={setDraftName}
          onDraftPointsChange={setDraftPoints}
          onSelectFaction={(faction) => {
            setDraftParent(faction);
            setDraftFaction(faction);
            setDraftName(`My ${faction.name}`);
            setDraftPoints(faction.pointsCapDefault);
          }}
          onArmyChange={onDraftArmyChange}
          onBackToFactions={backToFactionPicker}
        />
      ) : null}

      {libraryCreatingSplashVisible(creating, createSplash) && draftFaction ? (
        <div className="fixed inset-0 z-[60] text-parchment">
          <div className="absolute inset-0" aria-hidden="true">
            <FactionArtLayers
              factionId={
                draftParent?.id ??
                draftFaction.parentFactionIds?.[0] ??
                draftFaction.id
              }
              scrim={false}
            />
          </div>
          <ListLoadingSplash
            factionName={(draftParent ?? draftFaction).name}
            label="Creating your list"
          />
        </div>
      ) : null}
    </div>
  );
}
