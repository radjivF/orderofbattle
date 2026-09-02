import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  parsePortableLists,
  partitionPortableLists,
  portableAllListsFileName,
  portableListFileName,
  portableMimeType,
  serializeListsForFormat,
  type PortableFormat,
} from "@/engine/listPortable";
import type { ArmyList } from "@/engine/types";
import type { StoredList } from "@/engine/storedList";
import { isTowList } from "@/engine/storedList";
import { serializeTowListText } from "@/engine/tow/validate";
import { downloadTextFile } from "@/lib/downloadFile";
import { importArmies } from "@/lib/storage";

type LibrarySheetTab = "import" | "export";
export type LibraryExportPhase = "pick" | "preview";

export function useLibraryOptions(
  open: boolean,
  lists: StoredList[] | undefined,
  onClose: () => void,
) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState("");
  const [importConfirm, setImportConfirm] = useState<{
    novel: ArmyList[];
    skipped: number;
  } | null>(null);
  const [tab, setTab] = useState<LibrarySheetTab>("import");
  const [exportPhase, setExportPhase] = useState<LibraryExportPhase>("pick");
  const [exportSelectedIds, setExportSelectedIds] = useState<string[]>([]);
  const [exportPickError, setExportPickError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<PortableFormat>("text");
  const [exportCopied, setExportCopied] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const exportLists = useMemo(() => {
    if (!lists || !open || tab !== "export" || exportPhase !== "preview") {
      return [];
    }
    const selected = new Set(exportSelectedIds);
    return lists.filter((list) => selected.has(list.id));
  }, [exportPhase, exportSelectedIds, lists, open, tab]);

  const exportContent = useMemo(() => {
    if (exportLists.length === 0) {
      return "";
    }
    if (exportLists.every(isTowList)) {
      return exportFormat === "json"
        ? `${JSON.stringify(exportLists, null, 2)}\n`
        : exportLists.map(serializeTowListText).join("\n\n");
    }
    return serializeListsForFormat(
      exportLists.filter((list): list is ArmyList => !isTowList(list)),
      exportFormat,
    );
  }, [exportFormat, exportLists]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTab("import");
    setImportDraft("");
    setExportPhase("pick");
    setExportSelectedIds([]);
    setExportPickError(null);
    setExportFormat("text");
    setExportCopied(false);
  }, [open]);

  function resetExportState() {
    setExportPhase("pick");
    setExportSelectedIds([]);
    setExportPickError(null);
    setExportFormat("text");
    setExportCopied(false);
  }

  function onTabChange(next: string) {
    const nextTab = next as LibrarySheetTab;
    if (nextTab === tab) {
      return;
    }
    setTab(nextTab);
    setImportDraft("");
    resetExportState();
  }

  function toggleExportList(listId: string) {
    setExportPickError(null);
    setExportSelectedIds((current) =>
      current.includes(listId)
        ? current.filter((id) => id !== listId)
        : [...current, listId],
    );
  }

  function selectAllForExport() {
    setExportPickError(null);
    setExportSelectedIds(lists?.map((list) => list.id) ?? []);
  }

  function confirmExportSelection() {
    if (!lists || exportSelectedIds.length === 0) {
      setExportPickError("Select a list to export it.");
      return;
    }
    setExportPickError(null);
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

  function beginImport(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    onClose();
    const parsed = parsePortableLists(trimmed);
    if (!parsed.ok) {
      setImportError(parsed.error);
      return;
    }
    setImportConfirm(
      partitionPortableLists(
        parsed.lists,
        (lists ?? []).filter((item): item is ArmyList => !isTowList(item)),
      ),
    );
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

  return {
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
  };
}
