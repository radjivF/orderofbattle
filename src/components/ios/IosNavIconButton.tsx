"use client";

import Link from "next/link";
import { IOS_NAV_ICON_BUTTON_CLASS } from "@/lib/builderUi";

type Props = {
  label: string;
  onClick?: () => void;
  href?: string;
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

export function IosNavBackButton({ label, onClick, href }: Props) {
  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        aria-label={label}
        onClick={onClick}
        className={IOS_NAV_ICON_BUTTON_CLASS}
      >
        <IosChevronLeftIcon />
      </Link>
    );
  }
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

function IosChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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
