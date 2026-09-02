"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  MENU_SECTIONS,
  menuEntrySelected,
  type ActiveMenu,
  type MenuSectionEntry,
} from "@/lib/activeMenu";
import {
  APP_MENU_DRAWER_MS,
  APP_MENU_DRAWER_PANEL_CLASS,
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
        className={`modal-scrim app-menu-scrim absolute inset-0 bg-ink/70 ${
          leaving ? "app-menu-scrim--out" : ""
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

const MENU_GAME_TITLE_CLASS = "font-serif text-lg";

export function AppMenuSheet({ active, onSelect, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function openEntry(entry: MenuSectionEntry, close: () => void) {
    if (entry.comingSoon || !entry.menu || !entry.href) {
      return;
    }
    onSelect(entry.menu);
    if (pathname !== entry.href) {
      router.push(entry.href, { scroll: false });
    }
    close();
  }

  return (
    <LeftDrawer label="Menu" onClose={onClose}>
      {(close) => (
        <>
          <div className={SHEET_HEADER_CLASS}>
            <h2 className="font-serif text-2xl">Menu</h2>
            <SheetCloseButton label="Close menu" onClick={close} />
          </div>
          <nav className="app-menu-nav">
            <div className="px-5 pb-6">
              {MENU_SECTIONS.map((section, index) => (
                <section
                  key={section.id}
                  className={index === 0 ? undefined : "mt-8"}
                  aria-labelledby={`menu-game-${section.id}`}
                >
                  <h3
                    id={`menu-game-${section.id}`}
                    className={section.titleClass ?? MENU_GAME_TITLE_CLASS}
                  >
                    {section.label}
                  </h3>
                  <ul>
                    {section.entries.map((entry) =>
                      entry.comingSoon ? (
                        <ComingSoonRow key={entry.id} label={entry.label} />
                      ) : (
                        <MenuRow
                          key={entry.id}
                          label={entry.label}
                          actionName={entry.actionName}
                          selected={menuEntrySelected(
                            pathname,
                            active,
                            section.id,
                            entry.id,
                          )}
                          onSelect={() => openEntry(entry, close)}
                        />
                      ),
                    )}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
        </>
      )}
    </LeftDrawer>
  );
}

function rowClassName(selected: boolean) {
  return `flex min-h-11 w-full cursor-pointer items-center gap-3 py-2 text-left ${
    selected ? "text-aether" : "hover:text-aether"
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

function ComingSoonRow({ label }: { label: string }) {
  const soonOnly = /^coming soon$/i.test(label);
  return (
    <li>
      <div
        aria-disabled="true"
        className="pointer-events-none flex min-h-11 w-full cursor-default select-none items-center gap-3 py-2 text-left text-sheet-muted opacity-40"
      >
        <span className="min-w-0 flex-1 font-medium">{label}</span>
        {soonOnly ? null : (
          <span className="shrink-0 text-[13px] font-normal">Coming soon</span>
        )}
      </div>
    </li>
  );
}

function MenuRow({
  label,
  actionName,
  selected,
  onSelect,
}: {
  label: string;
  actionName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-label={actionName}
        aria-pressed={selected}
        onClick={onSelect}
        className={`pressable ${rowClassName(selected)}`}
      >
        <span className="min-w-0 flex-1 font-medium">{label}</span>
        <MenuCheck selected={selected} />
      </button>
    </li>
  );
}

