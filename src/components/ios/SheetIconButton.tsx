"use client";

import type { MouseEvent, ReactNode } from "react";

export const SHEET_CLOSE_BUTTON_CLASS =
  "pressable -mr-1 inline-flex h-10 w-10 shrink-0 items-start justify-center self-start rounded-full pt-0.5 text-parchment-ink/70";

export const SHEET_LINK_BUTTON_CLASS =
  "pressable inline-flex h-11 w-11 shrink-0 items-center justify-center text-aether";

const SHEET_LINK_ICON_WRAP_CLASS =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center text-aether";

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

const OPEN_SHEET_BUTTON_CLASS =
  "pressable flex max-w-full min-w-0 cursor-pointer items-start gap-0 text-left";

function OpenSheetButton({
  name,
  subtitle,
  subtitleBeside = false,
  sheetLabel,
  onOpenSheet,
  reinforced,
  iconClassName,
  nameClassName,
  subtitleClassName,
}: {
  name: string;
  subtitle?: string;
  subtitleBeside?: boolean;
  sheetLabel: string;
  onOpenSheet: (event: MouseEvent<HTMLButtonElement>) => void;
  reinforced?: boolean;
  iconClassName: string;
  nameClassName: string;
  subtitleClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-label={sheetLabel}
      onClick={onOpenSheet}
      className={`${OPEN_SHEET_BUTTON_CLASS} ${subtitleBeside ? "w-full" : "w-fit"}`}
    >
      <span className={iconClassName}>
        <IosDatasheetIcon />
      </span>
      <span
        className={
          subtitleBeside
            ? "flex min-w-0 flex-1 items-baseline justify-between gap-x-2 py-2 pr-2"
            : "min-w-0 py-2 pr-2"
        }
      >
        <p className={`${nameClassName} ${subtitleBeside ? "min-w-0 truncate" : ""}`}>
          {name}
          {reinforced ? (
            <span className="ml-2 font-sans text-xs text-sheet-muted">
              reinforced
            </span>
          ) : null}
        </p>
        {subtitle ? (
          <p
            className={
              subtitleClassName ?? "mt-0.5 text-sm text-sheet-muted"
            }
          >
            {subtitle}
          </p>
        ) : null}
      </span>
    </button>
  );
}

/** Play-mode unit row: sheet icon · name/stats · optional damage track. */
export function PlaySlotRow({
  name,
  subtitle,
  subtitleBeside = false,
  sheetLabel,
  onOpenSheet,
  trailing,
  reinforced,
}: {
  name: string;
  subtitle?: string;
  subtitleBeside?: boolean;
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
      <OpenSheetButton
        name={name}
        subtitle={subtitle}
        subtitleBeside={subtitleBeside}
        sheetLabel={sheetLabel}
        onOpenSheet={openSheet}
        reinforced={reinforced}
        iconClassName={`${SHEET_LINK_ICON_WRAP_CLASS} h-10 w-10 sm:h-11 sm:w-11`}
        nameClassName="font-serif text-base leading-snug sm:text-lg sm:leading-tight"
        subtitleClassName={
          subtitleBeside
            ? "shrink-0 text-sm font-medium text-parchment-ink"
            : "mt-1 text-xs leading-relaxed text-sheet-muted sm:mt-0.5 sm:text-sm"
        }
      />
      {trailing ? (
        <div className="w-full shrink-0 sm:ml-auto sm:w-auto">{trailing}</div>
      ) : null}
    </div>
  );
}

/** Build-mode unit row: sheet icon · name/stats · trailing actions. */
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
    <div className="flex min-h-11 items-center gap-1 rounded-xl bg-parchment-ink/5 cursor-pointer" onClick={onOpenSheet}>
      <div className="flex min-w-0 flex-1 items-center pl-1">
        <OpenSheetButton
          name={name}
          subtitle={subtitle}
          sheetLabel={sheetLabel}
          onOpenSheet={openSheet}
          reinforced={reinforced}
          iconClassName={SHEET_LINK_ICON_WRAP_CLASS}
          nameClassName="font-serif text-lg leading-tight"
        />
      </div>
      {trailing ? (
        <div className="ml-auto flex shrink-0 items-stretch" onClick={(e) => e.stopPropagation()}>
          {trailing}
        </div>
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

export function IosSearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <circle
        cx="9"
        cy="9"
        r="4.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m12.8 12.8 3.2 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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

export function IosInfoIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <circle
        cx="10"
        cy="10"
        r="8.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M10 9v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6.25" r="1.1" fill="currentColor" />
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
