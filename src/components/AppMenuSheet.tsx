"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  GAME_FEATURE_ROWS,
  GAME_MENU_ROWS,
  gameBattleRecordSelected,
  gameListsSelected,
  type ActiveMenu,
  type GameFeatureId,
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

export function AppMenuSheet({ onSelect, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function openFeature(feature: GameFeatureId, close: () => void) {
    if (feature === "lists") {
      onSelect("aos");
      if (pathname !== "/dashboard") {
        router.push("/dashboard", { scroll: false });
      }
    } else {
      onSelect("tactics");
      if (!pathname.startsWith("/battle-record")) {
        router.push("/battle-record", { scroll: false });
      }
    }
    close();
  }

  function featureSelected(feature: GameFeatureId) {
    return feature === "lists"
      ? gameListsSelected(pathname, "aos")
      : gameBattleRecordSelected(pathname, "aos");
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
              {GAME_MENU_ROWS.map((game, index) => (
                <section
                  key={game.id}
                  className={index === 0 ? undefined : "mt-8"}
                  aria-labelledby={`menu-game-${game.id}`}
                >
                  <h3
                    id={`menu-game-${game.id}`}
                    className={MENU_GAME_TITLE_CLASS}
                  >
                    {game.label}
                  </h3>
                  {game.comingSoon ? (
                    <p className="pt-1 text-[15px] text-sheet-muted">
                      Coming soon
                    </p>
                  ) : (
                    <ul>
                      {GAME_FEATURE_ROWS.map((feature) => (
                        <MenuRow
                          key={feature.id}
                          label={feature.label}
                          selected={featureSelected(feature.id)}
                          onSelect={() => openFeature(feature.id, close)}
                        />
                      ))}
                    </ul>
                  )}
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
        aria-label={label}
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

