"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { getFaction, armyOfRenownName } from "@/engine/queries";
import {
  catalogueForList,
  getSpearhead,
  isSpearheadList,
} from "@/engine/spearhead";
import { listFactionsByGrandAlliance } from "@/lib/factionAlliance";
import { formatPoints } from "@/engine/pointsCap";
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
import { catalogueArtClass, catalogueArtSrc, factionArtSrc, preloadBackdropArt } from "@/lib/factionArt";
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
  rememberListNavigation,
  rememberListOpen,
  peekListCreateSplash,
  subscribeListOpenFaction,
} from "@/lib/listTransition";
import {
  libraryCreatingSplashVisible,
  listOpenDisplayNameForHeader,
} from "@/lib/listFlowNav";
import { newListDraftFromSearch } from "@/lib/newListLink";
import {
  encodeNewListArmyValue,
  newListArmySelectGroups,
  newListArmySelectHasExtras,
  parseNewListArmyValue,
} from "@/lib/newListArmyOptions";
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
  EMPTY_LIBRARY_CTA_CLASS,
  EMPTY_LIBRARY_PANEL_CLASS,
  EMPTY_LIBRARY_SECONDARY_CLASS,
  IOS_LIQUID_CTA_CLASS,
  LIBRARY_OPTIONS_BUTTON_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SHEET_CHECKLIST_ITEM_CLASS,
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
  SHEET_FOOTER_ACTIONS_CLASS,
  SHEET_INLINE_LINK_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
  LIBRARY_CARD_ACTION_BUTTON_CLASS,
  LIBRARY_CARD_ACTIONS_CLASS,
  LIBRARY_CARD_CLASS,
  LIBRARY_CARD_DELETE_BUTTON_CLASS,
  LIBRARY_CARD_LIST_NAME_INPUT_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
  libraryListExportSubtitle,
} from "@/lib/builderUi";
import { useListFlowChrome } from "./ListFlowShell";
import { FactionArtLayers } from "./FactionArtBackground";
import { BrandMark } from "./BrandMark";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { ListLoadingSplash } from "./ListLoadingSplash";
import { ModalFrame } from "./ModalFrame";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { SheetFormActions } from "./SheetFormActions";
import { PointsCapField } from "./PointsCapField";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SiteFooter } from "./SiteFooter";

type LibrarySheetTab = "import" | "export";
type ExportPhase = "pick" | "preview";

function LibraryOptionsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <circle cx="10" cy="5" r="1.35" fill="currentColor" />
      <circle cx="10" cy="10" r="1.35" fill="currentColor" />
      <circle cx="10" cy="15" r="1.35" fill="currentColor" />
    </svg>
  );
}

function rememberOpenList(list: ArmyList) {
  const faction = getFaction(list.factionId);
  const artId =
    faction?.parentFactionIds?.[0] ??
    (factionArtSrc(list.factionId) ? list.factionId : null) ??
    list.factionId;
  rememberListOpen(artId, listOpenDisplayNameForHeader(list), list.scourgeRealm);
  void preloadBackdropArt(artId, list.scourgeRealm);
  rememberListNavigation("forward");
}

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

  function openLibraryOptions() {
    openLibrarySheet("import");
  }

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

  const { setLibraryChrome } = useListFlowChrome();

  useLayoutEffect(() => {
    setLibraryChrome({ openNewList: () => setPicking(true) });
    return () => setLibraryChrome(null);
  }, [setLibraryChrome]);

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
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 sm:px-6 lg:max-w-5xl">
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <button
            type="button"
            aria-label="List options"
            onClick={openLibraryOptions}
            className={LIBRARY_OPTIONS_BUTTON_CLASS}
          >
            <LibraryOptionsIcon />
          </button>
          <h1 className={LIBRARY_TITLE_CLASS}>My lists</h1>
        </div>
      </div>
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
          <div className={EMPTY_LIBRARY_PANEL_CLASS}>
            <BrandMark
              size={40}
              className="mx-auto mb-4 h-10 w-auto opacity-40"
            />
            <p className="font-serif text-3xl leading-snug text-parchment">
              No armies yet
            </p>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className={EMPTY_LIBRARY_CTA_CLASS}
            >
              Make your first list
            </button>
            <button
              type="button"
              onClick={openImportPicker}
              className={EMPTY_LIBRARY_SECONDARY_CLASS}
            >
              Import a list
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2 lg:gap-5">
            {displayedLists.map((list, index) => {
              const faction = getFaction(list.factionId);
              const playCatalogue = catalogueForList(list);
              const totals = playCatalogue
                ? summarize(list, playCatalogue)
                : null;
              const formation = playCatalogue?.formations.find(
                (item) => item.id === (list.regimentAbilityId ?? list.formationId),
              );
              const spearhead = isSpearheadList(list);
              const artSrc = catalogueArtSrc(faction);
              return (
                <li key={list.id}>
                  <article className={LIBRARY_CARD_CLASS}>
                    <Link
                      href={`/lists/${list.id}`}
                      scroll={false}
                      aria-label={`Open ${list.name}`}
                      onClick={() => rememberOpenList(list)}
                      className="absolute inset-0 z-[1]"
                    />
                    <div className="pointer-events-none relative z-[2] flex min-w-0 flex-col p-4 sm:p-5">
                      <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                        {faction?.name ?? "Unknown faction"}
                      </p>
                      <input
                        aria-label="List name"
                        defaultValue={list.name}
                        onBlur={(event) =>
                          void onRename(list, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        className={LIBRARY_CARD_LIST_NAME_INPUT_CLASS}
                      />
                      <div className="mt-2 flex w-full flex-1 items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-gold-deep">
                            {spearhead
                              ? "Spearhead"
                              : `${formatPoints(totals?.points ?? 0)} / ${formatPoints(list.pointsCap)}`}
                          </p>
                          <p className="mt-0.5 text-sm text-sheet-muted sm:text-base">
                            {spearhead
                              ? playCatalogue?.name ?? "Spearhead"
                              : (formation?.name ?? "No formation")}
                          </p>
                        </div>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 12 20"
                          className="size-5 shrink-0 self-center text-parchment-ink/35"
                        >
                          <path
                            d="M2.5 2.5 9.5 10l-7 7.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div
                        className={`pointer-events-auto relative ${LIBRARY_CARD_ACTIONS_CLASS}`}
                      >
                        <button
                          type="button"
                          className={LIBRARY_CARD_ACTION_BUTTON_CLASS}
                          onClick={() => void onDuplicate(list)}
                        >
                          Duplicate
                        </button>
                        <span
                          aria-hidden="true"
                          className="text-parchment-ink/25"
                        >
                          ·
                        </span>
                        <button
                          type="button"
                          className={LIBRARY_CARD_DELETE_BUTTON_CLASS}
                          onClick={() => setDeleteTarget(list)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {artSrc ? (
                      <div className="pointer-events-none relative min-h-[8.5rem] overflow-hidden border-l border-parchment-ink/10">
                        <Image
                          src={artSrc}
                          alt=""
                          aria-hidden
                          fill
                          sizes="152px"
                          quality={68}
                          unoptimized
                          priority={index === 0}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : undefined}
                          className={catalogueArtClass(faction)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#efe6d2]/35" />
                      </div>
                    ) : (
                      <div className="pointer-events-none min-h-[8.5rem] border-l border-parchment-ink/10 bg-parchment-ink/5" />
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />

      {librarySheetOpen ? (
        <ModalFrame
          label="List options"
          onClose={closeLibrarySheet}
          panelClassName={SHEET_PANEL_CLASS}
        >
          <div className={SHEET_HEADER_CLASS}>
            <h2 className="font-serif text-2xl">List options</h2>
            <SheetCloseButton
              label="Close list options"
              onClick={closeLibrarySheet}
            />
          </div>
          <div className="px-5 pb-4">
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
          <div className="px-5 pb-4">
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
                className="mx-5 mb-4 min-h-[16rem] flex-1 resize-none rounded-xl bg-parchment-ink/5 px-3 py-3 font-mono text-xs leading-relaxed text-parchment-ink outline-none ring-1 ring-parchment-ink/10 placeholder:text-sheet-muted/70"
              />
              <div className={SHEET_FOOTER_ACTIONS_CLASS}>
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
                <ul className="modal-sheet-scroll flex max-h-[min(24rem,50vh)] flex-col gap-2 overflow-y-auto px-3 pb-4">
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
                            checked ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS : ""
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
                                factionName: faction?.name ?? "Unknown faction",
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
              <div className={SHEET_FOOTER_ACTIONS_CLASS}>
                <button
                  type="button"
                  disabled={exportSelectedIds.length === 0}
                  onClick={confirmExportSelection}
                  className={IOS_LIQUID_CTA_CLASS}
                >
                  Continue
                </button>
              </div>
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
                className="mx-5 mb-4 min-h-[16rem] flex-1 resize-none rounded-xl bg-parchment-ink/5 px-3 py-3 font-mono text-xs leading-relaxed text-parchment-ink outline-none ring-1 ring-parchment-ink/10"
              />
              <div className={SHEET_FOOTER_ACTIONS_CLASS}>
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
            </>
          )}
        </ModalFrame>
      ) : null}

      {importConfirm ? (
        <ModalFrame
          label={
            importConfirm.novel.length === 0
              ? "Already in My lists"
              : "Add lists?"
          }
          onClose={() => setImportConfirm(null)}
          panelClassName={CONFIRM_SHEET_PANEL_CLASS}
        >
          <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
            {importConfirm.novel.length === 0 ? (
              "Those lists are already in My lists. Nothing will be added."
            ) : (
              <>
                {importConfirm.novel.length === 1
                  ? `Add ${importConfirm.novel[0]?.name ?? "this list"} to My lists?`
                  : `Add ${importConfirm.novel.length} lists to My lists?`}
                {importConfirm.skipped === 1
                  ? " 1 list is already here and will be skipped."
                  : importConfirm.skipped > 1
                    ? ` ${importConfirm.skipped} lists are already here and will be skipped.`
                    : null}
              </>
            )}
          </p>
          <div className={CONFIRM_SHEET_ACTIONS_CLASS}>
            {importConfirm.novel.length === 0 ? (
              <button
                type="button"
                onClick={() => setImportConfirm(null)}
                className={IOS_LIQUID_CTA_CLASS}
              >
                OK
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void confirmImport()}
                  className={IOS_LIQUID_CTA_CLASS}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setImportConfirm(null)}
                  className={CONFIRM_CANCEL_BUTTON_CLASS}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </ModalFrame>
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
        <ModalFrame
          label="New list"
          onClose={closePicker}
          panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
        >
            <div className={SHEET_HEADER_CLASS}>
              <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="font-serif text-2xl">
                  {draftFaction ? "Create new list" : "Choose a faction"}
                </h2>
                {createCounts ? (
                  <p className="shrink-0 text-xs leading-snug text-sheet-muted sm:text-sm">
                    {createCounts.heroes} heroes · {createCounts.units} units
                  </p>
                ) : null}
              </div>
              <SheetCloseButton label="Close picker" onClick={closePicker} />
            </div>

            {draftFaction ? (
              <div className="modal-sheet-scroll flex flex-col gap-4 overflow-y-auto px-5 pb-6">
                <p className="text-base text-sheet-muted">
                  {(draftParent ?? draftFaction).name}
                </p>
                {draftParent && newListArmySelectHasExtras(draftParent.id) ? (
                  <label className="flex flex-col gap-2 text-base text-sheet-muted">
                    Army
                    <select
                      value={
                        draftMode === "spearhead" && draftSpearheadId
                          ? encodeNewListArmyValue({
                              kind: "spearhead",
                              spearheadId: draftSpearheadId,
                            })
                          : draftFaction.id
                      }
                      onChange={(event) => {
                        const parsed = parseNewListArmyValue(event.target.value);
                        const previousLabel =
                          draftMode === "spearhead" && draftSpearheadId
                            ? (getSpearhead(draftSpearheadId)?.name ??
                              draftParent.name)
                            : armyOfRenownName(draftFaction);
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
                        const next =
                          getFaction(parsed.factionId) ?? draftParent;
                        setDraftMode("points");
                        setDraftSpearheadId(null);
                        setDraftFaction(next);
                        setDraftName((current) =>
                          current === `My ${previousLabel}`
                            ? `My ${armyOfRenownName(next)}`
                            : current,
                        );
                      }}
                      className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink"
                    >
                      {newListArmySelectGroups(draftParent.id).map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="flex flex-col gap-2 text-base text-sheet-muted">
                  List name
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void onCreate();
                      }
                    }}
                    placeholder={`My ${armyOfRenownName(draftFaction)}`}
                    className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
                  />
                </label>
                {draftMode === "spearhead" ? null : (
                  <PointsCapField
                    value={draftPoints}
                    onChange={setDraftPoints}
                    variant="parchment"
                  />
                )}
                <SheetFormActions
                  primaryLabel={creating ? "Creating…" : "Create"}
                  onPrimary={() => void onCreate()}
                  secondaryLabel="Back"
                  onSecondary={() => {
                    setDraftFaction(null);
                    setDraftParent(null);
                    setDraftName("");
                    setDraftMode("points");
                    setDraftSpearheadId(null);
                  }}
                  primaryDisabled={creating}
                  secondaryDisabled={creating}
                />
              </div>
            ) : (
              <ul className="modal-sheet-scroll overflow-y-auto px-3 pb-6">
                {listFactionsByGrandAlliance().map((group, groupIndex) => (
                  <li key={group.alliance} className="list-none">
                    <p
                      className={`px-3 pb-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted ${
                        groupIndex === 0 ? "pt-1" : "pt-4"
                      }`}
                    >
                      {group.label}
                    </p>
                    <ul className="flex flex-col">
                      {group.factions.map((faction) => (
                        <li key={faction.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftParent(faction);
                              setDraftFaction(faction);
                              setDraftName(`My ${faction.name}`);
                              setDraftPoints(faction.pointsCapDefault);
                            }}
                            className="flex min-h-12 w-full items-center rounded-lg px-3 py-2.5 text-left hover:bg-parchment-ink/5"
                          >
                            <span className="min-w-0 font-serif text-xl text-parchment-ink">
                              {faction.name}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
        </ModalFrame>
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
