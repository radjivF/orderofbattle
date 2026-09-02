"use client";

import type { StoredList } from "@/engine/storedList";
import type { PortableFormat } from "@/engine/listPortable";
import { SHEET_INLINE_LINK_CLASS } from "@/lib/builderUi";
import { LibraryExportPickList } from "./LibraryExportPickList";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";

type Props = {
  phase: "pick" | "preview";
  lists: StoredList[] | undefined;
  selectedIds: string[];
  exportLists: StoredList[];
  exportContent: string;
  exportFormat: PortableFormat;
  onSelectAll: () => void;
  onToggle: (listId: string) => void;
  onFormatChange: (next: PortableFormat) => void;
};

export function LibraryExportPanel({
  phase,
  lists,
  selectedIds,
  exportLists,
  exportContent,
  exportFormat,
  onSelectAll,
  onToggle,
  onFormatChange,
}: Props) {
  if (phase === "pick") {
    return (
      <>
        <p className="px-5 pb-3 text-sm leading-relaxed text-sheet-muted">
          Choose one or more lists to export.
        </p>
        {lists && lists.length > 1 ? (
          <div className="px-5 pb-2">
            <button
              type="button"
              onClick={onSelectAll}
              className={SHEET_INLINE_LINK_CLASS}
            >
              Select all
            </button>
          </div>
        ) : null}
        {lists && lists.length > 0 ? (
          <LibraryExportPickList
            lists={lists}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        ) : (
          <p className="px-5 pb-4 text-sm text-sheet-muted">
            No lists to export yet.
          </p>
        )}
      </>
    );
  }

  return (
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
          onChange={(next) => onFormatChange(next as PortableFormat)}
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
  );
}
