"use client";

import type { StoredList } from "@/engine/storedList";
import type { LibrarySortMode } from "@/lib/librarySort";
import {
  LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS,
  LIBRARY_OPTIONS_SHEET_PANEL_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_HEADER_CLASS,
} from "@/lib/builderUi";
import { LibraryExportPanel } from "./LibraryExportPanel";
import { LibraryImportConfirm } from "./LibraryImportConfirm";
import { LibraryImportError } from "./LibraryImportError";
import { LibraryImportPanel } from "./LibraryImportPanel";
import { LibraryOptionsFooter } from "./LibraryOptionsFooter";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { ModalFrame } from "./ModalFrame";
import { useLibraryOptions } from "./useLibraryOptions";

type Props = {
  open: boolean;
  lists: StoredList[] | undefined;
  sortMode: LibrarySortMode;
  onSortModeChange: (next: string) => void;
  onClose: () => void;
};

export function LibraryOptionsSheet({
  open,
  lists,
  sortMode,
  onSortModeChange,
  onClose,
}: Props) {
  const {
    importError,
    importDraft,
    importConfirm,
    tab,
    exportPhase,
    exportSelectedIds,
    exportPickError,
    exportFormat,
    exportCopied,
    importInputRef,
    exportLists,
    exportContent,
    setImportDraft,
    setImportConfirm,
    setImportError,
    setExportFormat,
    setExportCopied,
    onTabChange,
    toggleExportList,
    selectAllForExport,
    confirmExportSelection,
    backToExportPicker,
    copyExport,
    downloadExport,
    beginImport,
    onImportFile,
    confirmImport,
  } = useLibraryOptions(open, lists, onClose);

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.json,text/plain,application/json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void onImportFile(event)}
      />
      {open ? (
        <ModalFrame
          label="List options"
          onClose={onClose}
          panelClassName={LIBRARY_OPTIONS_SHEET_PANEL_CLASS}
        >
          <div className={SHEET_HEADER_CLASS}>
            <h2 className="font-serif text-2xl">List options</h2>
            <SheetCloseButton label="Close list options" onClick={onClose} />
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
            <div
              role="separator"
              className={LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS}
            />
            <div className="shrink-0 px-5 pb-4 pt-4">
              <IosSegmentedControl
                ariaLabel="Import or export lists"
                value={tab}
                onChange={onTabChange}
                options={[
                  { value: "import", label: "Import" },
                  { value: "export", label: "Export" },
                ]}
              />
            </div>
            <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
              <div className={MODAL_SHEET_SCROLL_CLASS}>
                {tab === "import" ? (
                  <LibraryImportPanel
                    draft={importDraft}
                    onDraftChange={setImportDraft}
                  />
                ) : (
                  <LibraryExportPanel
                    phase={exportPhase}
                    lists={lists}
                    selectedIds={exportSelectedIds}
                    exportLists={exportLists}
                    exportContent={exportContent}
                    exportFormat={exportFormat}
                    onSelectAll={selectAllForExport}
                    onToggle={toggleExportList}
                    onFormatChange={(next) => {
                      setExportFormat(next);
                      setExportCopied(false);
                    }}
                  />
                )}
              </div>
            </div>
            {tab === "import" ? (
              <LibraryOptionsFooter
                kind="import"
                draft={importDraft}
                onImport={() => beginImport(importDraft)}
                onChooseFile={() => importInputRef.current?.click()}
              />
            ) : exportPhase === "pick" ? (
              <LibraryOptionsFooter
                kind="export-pick"
                error={exportPickError}
                onContinue={confirmExportSelection}
              />
            ) : (
              <LibraryOptionsFooter
                kind="export-preview"
                copied={exportCopied}
                format={exportFormat}
                onCopy={() => void copyExport()}
                onDownload={downloadExport}
                onBack={backToExportPicker}
              />
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
        <LibraryImportError
          error={importError}
          onClose={() => setImportError(null)}
        />
      ) : null}
    </>
  );
}
