"use client";

import { IOS_NAV_ICON_BUTTON_CLASS, IOS_NAV_MENU_BUTTON_CLASS, IOS_NAV_MENU_ICON_CLASS, LIBRARY_HEADER_OPTIONS_BUTTON_CLASS } from "@/lib/builderUi";
import { IosEditIcon } from "./SheetIconButton";

type Props = {
  label: string;
  onClick: () => void;
};

export function IosNavAddButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={IOS_NAV_ICON_BUTTON_CLASS}
    >
      <IosPlusIcon />
    </button>
  );
}

export function IosNavOptionsButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={LIBRARY_HEADER_OPTIONS_BUTTON_CLASS}
    >
      <IosEllipsisIcon />
    </button>
  );
}

export function IosNavBackButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={IOS_NAV_ICON_BUTTON_CLASS}
    >
      <IosChevronLeftIcon />
    </button>
  );
}

export function IosNavCloseButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={IOS_NAV_ICON_BUTTON_CLASS}
    >
      <IosCloseIcon />
    </button>
  );
}

export function IosNavEditButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={LIBRARY_HEADER_OPTIONS_BUTTON_CLASS}
    >
      <IosEditIcon />
    </button>
  );
}

export function IosNavMenuButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={IOS_NAV_MENU_BUTTON_CLASS}
    >
      <IosMenuIcon />
    </button>
  );
}

function IosChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="block h-5 w-5">
      <path
        d="M12.5 5 7.5 10l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IosCloseIcon() {
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

function IosPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
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

function IosEllipsisIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <circle cx="10" cy="5" r="1.35" fill="currentColor" />
      <circle cx="10" cy="10" r="1.35" fill="currentColor" />
      <circle cx="10" cy="15" r="1.35" fill="currentColor" />
    </svg>
  );
}

function IosMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={IOS_NAV_MENU_ICON_CLASS}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
