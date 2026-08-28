"use client";

import type { MouseEvent, ReactNode } from "react";

export const SHEET_CLOSE_BUTTON_CLASS =
  "pressable -mr-1 inline-flex h-10 w-10 shrink-0 items-start justify-center self-start rounded-full pt-0.5 text-parchment-ink/70";

export const SHEET_LINK_BUTTON_CLASS =
  "pressable inline-flex h-11 w-11 shrink-0 items-center justify-center text-aether";

type CloseProps = {
  label?: string;
  onClick: () => void;
};

type SheetLinkProps = {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function SheetCloseButton({ label = "Close", onClick }: CloseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={SHEET_CLOSE_BUTTON_CLASS}
    >
      <IosXIcon />
    </button>
  );
}

export function SheetLinkButton({
  label,
  onClick,
  className = SHEET_LINK_BUTTON_CLASS,
}: SheetLinkProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      <IosDatasheetIcon />
    </button>
  );
}

export function SheetLinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center text-aether"
    >
      <IosDatasheetIcon className={className} />
    </span>
  );
}

/** Play-mode unit row: sheet icon · name/stats · optional damage track. */
export function PlaySlotRow({
  name,
  subtitle,
  sheetLabel,
  onOpenSheet,
  trailing,
  reinforced,
}: {
  name: string;
  subtitle?: string;
  sheetLabel: string;
  onOpenSheet: () => void;
  trailing?: ReactNode;
  reinforced?: boolean;
}) {
  function openSheet(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenSheet();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <SheetLinkButton
          label={sheetLabel}
          onClick={openSheet}
          className={`${SHEET_LINK_BUTTON_CLASS} h-10 w-10 sm:h-11 sm:w-11`}
        />
        <button
          type="button"
          onClick={openSheet}
          className="min-w-0 flex-1 text-left active:opacity-60"
        >
          <p className="font-serif text-base leading-snug sm:text-lg sm:leading-tight">
            {name}
            {reinforced ? (
              <span className="ml-2 font-sans text-xs text-sheet-muted">
                reinforced
              </span>
            ) : null}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-sheet-muted sm:mt-0.5 sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </button>
      </div>
      {trailing ? (
        <div className="w-full shrink-0 sm:w-auto">{trailing}</div>
      ) : null}
    </div>
  );
}

/** Build-mode unit row: sheet icon · tappable name/stats · trailing actions. */
export function BuildSlotRow({
  name,
  subtitle,
  sheetLabel,
  onOpenSheet,
  trailing,
  reinforced,
}: {
  name: string;
  subtitle?: string;
  sheetLabel: string;
  onOpenSheet: () => void;
  trailing?: ReactNode;
  reinforced?: boolean;
}) {
  function openSheet(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onOpenSheet();
  }

  return (
    <div className="flex min-h-11 items-center gap-1 rounded-xl bg-parchment-ink/5 pl-3">
      <SheetLinkButton label={sheetLabel} onClick={openSheet} />
      <button
        type="button"
        onClick={openSheet}
        className="min-w-0 flex-1 py-2 pr-2 text-left active:opacity-60"
      >
        <p className="font-serif text-lg leading-tight">
          {name}
          {reinforced ? (
            <span className="ml-2 font-sans text-xs text-sheet-muted">
              reinforced
            </span>
          ) : null}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-sheet-muted">{subtitle}</p>
        ) : null}
      </button>
      {trailing ? (
        <div className="flex shrink-0 items-stretch">{trailing}</div>
      ) : null}
    </div>
  );
}

export const EDIT_LINK_BUTTON_CLASS =
  "pressable inline-flex h-11 w-11 shrink-0 items-center justify-center text-sheet-muted";

export const EDIT_LINK_BUTTON_COMPACT_CLASS =
  "pressable inline-flex h-9 w-9 shrink-0 items-center justify-center text-sheet-muted";

type EditLinkProps = {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function EditLinkButton({
  label,
  onClick,
  className = EDIT_LINK_BUTTON_CLASS,
}: EditLinkProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      <IosEditIcon />
    </button>
  );
}

export function IosPlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M10 4.25v11.5M4.25 10h11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IosEditIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M12.8 4.2 15.8 7.2 7.5 15.5H4.5V12.5L12.8 4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 5.5l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IosDatasheetIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M6 3.5h5.2L14.5 6.8V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 3.5V7h4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 10h5M7.5 12.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IosTrashIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M4.5 6.5h11M8 4.5h4a1 1 0 0 1 1 1V6H7v-.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 6.5V15a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 14 15V6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 9v5M11.75 9v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IosXIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <path
        d="m5.5 5.5 9 9M14.5 5.5l-9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
