"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GAME_MENU_ROWS,
  TRACK_GAME_MENU_ROW,
  type ActiveMenu,
} from "@/lib/activeMenu";
import {
  APP_MENU_DRAWER_MS,
  APP_MENU_DRAWER_PANEL_CLASS,
  LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS,
  SHEET_CHECKLIST_ITEM_CLASS,
  SHEET_CHECKLIST_ITEM_IDLE_CLASS,
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
  SHEET_HEADER_CLASS,
} from "@/lib/builderUi";
import {
  acquireModalLayer,
  isTopModal,
  releaseModalLayer,
} from "@/lib/modalLock";
import { isBattleRecordPath } from "./BattleRecordHost";
import { SheetCloseButton } from "./ios/SheetIconButton";

type Props = {
  active: ActiveMenu;
  onSelect: (menu: ActiveMenu) => void;
  onClose: () => void;
};

function LeftDrawer({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeHandlerRef = useRef<() => void>(() => onCloseRef.current());
  const backdropArmed = useRef(false);
  const [zIndex, setZIndex] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const beginClose = useCallback(() => {
    setLeaving(true);
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }
    const id = window.setTimeout(() => onCloseRef.current(), APP_MENU_DRAWER_MS);
    return () => window.clearTimeout(id);
  }, [leaving]);

  useLayoutEffect(() => {
    closeHandlerRef.current = () => beginClose();
    const layer = acquireModalLayer(closeHandlerRef.current);
    setZIndex(layer);

    const panel = panelRef.current;
    const previous = document.activeElement;
    panel?.focus();
    backdropArmed.current = false;
    const arm = window.setTimeout(() => {
      backdropArmed.current = true;
    }, 250);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isTopModal(closeHandlerRef.current)) {
        beginClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("keydown", onKeyDown);
      releaseModalLayer(closeHandlerRef.current);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [beginClose]);

  if (typeof document === "undefined" || zIndex === null) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 flex items-stretch justify-start overscroll-none"
      style={{ zIndex }}
      data-modal-overlay=""
    >
      <div
        aria-hidden="true"
        className={`modal-scrim absolute inset-0 ${
          leaving ? "bg-ink" : "bg-ink/70"
        }`}
        onPointerDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          if (backdropArmed.current && isTopModal(closeHandlerRef.current)) {
            beginClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-edge="left"
        tabIndex={-1}
        className={`app-menu-drawer relative z-10 outline-none ${
          leaving ? "app-menu-drawer--out" : ""
        } ${APP_MENU_DRAWER_PANEL_CLASS}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children(beginClose)}
      </div>
    </div>,
    document.body,
  );
}

export function AppMenuSheet({ active, onSelect, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const onBattleRecord = isBattleRecordPath(pathname);
  const selected = onBattleRecord ? "tactics" : active;

  return (
    <LeftDrawer label="Menu" onClose={onClose}>
      {(close) => (
        <>
          <div className={SHEET_HEADER_CLASS}>
            <h2 className="font-serif text-2xl">Menu</h2>
            <SheetCloseButton label="Close menu" onClick={close} />
          </div>
          <h3 className="px-5 pb-2 text-sm font-medium text-sheet-muted">Games</h3>
          <ul className="flex flex-col gap-2 px-3 pb-4">
            {GAME_MENU_ROWS.map((row) => (
              <MenuRow
                key={row.id}
                label={row.label}
                selected={selected === row.id}
                disabled={row.disabled}
                onSelect={() => {
                  if (row.disabled) {
                    return;
                  }
                  onSelect(row.id);
                  if (onBattleRecord) {
                    // Swap under the open drawer/scrim, then slide the menu out.
                    // Instant close flashes the page; leave-then-nav remounts the drawer.
                    router.push("/dashboard", { scroll: false });
                  }
                  close();
                }}
              />
            ))}
          </ul>
          <div
            role="separator"
            className={LIBRARY_OPTIONS_SECTION_DIVIDER_CLASS}
          />
          <h3 className="px-5 pt-4 pb-2 text-sm font-medium text-sheet-muted">
            Track a game
          </h3>
          <ul className="flex flex-col gap-2 px-3 pb-6">
            <MenuLinkRow
              href="/battle-record"
              label={TRACK_GAME_MENU_ROW.label}
              selected={selected === "tactics"}
              onSelect={() => {
                onSelect("tactics");
                close();
              }}
            />
          </ul>
        </>
      )}
    </LeftDrawer>
  );
}

function rowClassName(selected: boolean) {
  return `${SHEET_CHECKLIST_ITEM_CLASS} pressable w-full items-center text-left ${
    selected
      ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS
      : SHEET_CHECKLIST_ITEM_IDLE_CLASS
  }`;
}

function MenuCheck({ selected }: { selected: boolean }) {
  if (!selected) {
    return null;
  }
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-4 shrink-0 fill-none stroke-aether"
    >
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuRow({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={onSelect}
        className={`${rowClassName(selected)} disabled:cursor-not-allowed disabled:opacity-45`}
      >
        <span
          className={`min-w-0 flex-1 font-medium ${selected ? "text-aether" : ""}`}
        >
          {label}
        </span>
        <MenuCheck selected={selected} />
      </button>
    </li>
  );
}

function MenuLinkRow({
  href,
  label,
  selected,
  onSelect,
}: {
  href: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        onClick={onSelect}
        className={rowClassName(selected)}
      >
        <span
          className={`min-w-0 flex-1 font-medium ${selected ? "text-aether" : ""}`}
        >
          {label}
        </span>
        <MenuCheck selected={selected} />
      </Link>
    </li>
  );
}
