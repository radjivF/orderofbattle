"use client";

import { LIST_IMPORT_HELP } from "@/engine/listPortable";

type Props = {
  draft: string;
  onDraftChange: (value: string) => void;
};

export function LibraryImportPanel({ draft, onDraftChange }: Props) {
  return (
    <>
      <p className="px-5 pb-3 text-sm leading-relaxed text-sheet-muted">
        {LIST_IMPORT_HELP}
      </p>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Paste a Warhammer App, New Recruit, or Order of Battle list…"
        aria-label="List to import"
        className="mx-5 mb-4 block min-h-[16rem] w-[calc(100%-2.5rem)] resize-none rounded-xl bg-parchment-ink/5 px-3 py-3 font-mono text-xs leading-relaxed text-parchment-ink outline-none ring-1 ring-parchment-ink/10 placeholder:text-sheet-muted/70"
      />
    </>
  );
}
