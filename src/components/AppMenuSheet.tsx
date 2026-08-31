"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
  SHEET_HEADER_CLASS,
} from "@/lib/builderUi";
import {
  acquireModalLayer,
  isTopModal,
  releaseModalLayer,
} from "@/lib/modalLock";
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
        className="modal-scrim absolute inset-0 bg-ink/70"
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
  const router = useRouter();

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
                selected={active === row.id}
                onSelect={() => {
                  onSelect(row.id);
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
            <MenuRow
              label={TRACK_GAME_MENU_ROW.label}
              selected={false}
              onSelect={() => {
                close();
                router.push("/battle-record");
              }}
            />
          </ul>
        </>
      )}
    </LeftDrawer>
  );
}

function MenuRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`${SHEET_CHECKLIST_ITEM_CLASS} w-full items-center text-left ${
          selected ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS : ""
        }`}
      >
        <span className={`min-w-0 flex-1 font-medium ${selected ? "text-aether" : ""}`}>
          {label}
        </span>
        {selected ? (
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
        ) : null}
      </button>
    </li>
  );
}
