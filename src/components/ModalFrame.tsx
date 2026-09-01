"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  acquireModalLayer,
  isTopModal,
  releaseModalLayer,
} from "@/lib/modalLock";
import {
  isSheetDragControl,
  shouldBeginSheetDrag,
  shouldCommitSheetDismiss,
  sheetDismissEligible,
} from "@/lib/sheetDismiss";

const ModalDismissContext = createContext<() => void>(() => {});

export function useModalDismiss() {
  return useContext(ModalDismissContext);
}

type Props = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName: string;
  /** @deprecated z-index comes from the modal stack */
  zClass?: string;
  /** "sheet" pins to the bottom edge on phones (iOS style); "center" always floats. */
  variant?: "sheet" | "center";
  /** Full-page sheet: one rise from the bottom, tiny peek of the screen behind. */
  fullPage?: boolean;
};

type SheetDragState = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  dragging: boolean;
  dismissEligible: boolean;
  scrollEl: HTMLElement | null;
};

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

const SHEET_SLIDE_MS = 280;

function emptyDragState(): SheetDragState {
  return {
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    dragging: false,
    dismissEligible: false,
    scrollEl: null,
  };
}

function isMobileSheet(variant: Props["variant"]) {
  return (
    variant === "sheet" &&
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches
  );
}

function sheetDragEnabled(
  variant: Props["variant"],
  fullPage: boolean,
): boolean {
  if (variant !== "sheet") {
    return false;
  }
  if (fullPage) {
    return true;
  }
  return isMobileSheet(variant);
}

export function ModalFrame({
  label,
  onClose,
  children,
  panelClassName,
  variant = "sheet",
  fullPage = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeHandlerRef = useRef<() => void>(() => onCloseRef.current());
  const backdropArmed = useRef(false);
  const [zIndex, setZIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragAnimating, setDragAnimating] = useState(false);
  const dragOffsetRef = useRef(0);
  const dragRef = useRef<SheetDragState>(emptyDragState());
  const dismissingRef = useRef(false);
  const requestCloseRef = useRef<() => void>(() => {});

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function sheetScrollEl(): HTMLElement | null {
    return (
      panelRef.current?.querySelector<HTMLElement>(
        ".modal-sheet-scroll, .overflow-y-auto",
      ) ?? null
    );
  }

  const requestClose = useCallback(() => {
    if (variant !== "sheet") {
      onCloseRef.current();
      return;
    }
    if (dismissingRef.current) {
      return;
    }
    dismissingRef.current = true;
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    const height = panelRef.current?.offsetHeight || 400;
    const fromRest = dragOffsetRef.current === 0;
    const slideOut = () => {
      dragOffsetRef.current = height;
      setDragAnimating(true);
      setDragOffset(height);
    };
    if (fromRest) {
      setDragAnimating(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(slideOut);
      });
    } else {
      slideOut();
    }
    window.setTimeout(() => onCloseRef.current(), SHEET_SLIDE_MS);
  }, [variant]);

  useLayoutEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);

  const dismiss = useCallback(() => {
    requestCloseRef.current();
  }, []);

  function resetSheetDrag() {
    const scrollEl = dragRef.current.scrollEl;
    if (scrollEl) {
      scrollEl.style.overflow = "";
      scrollEl.style.touchAction = "";
    }
    setDragAnimating(true);
    setDragOffset(0);
    window.setTimeout(() => setDragAnimating(false), 280);
  }

  function beginSheetDrag(pointerId: number) {
    const drag = dragRef.current;
    if (drag.dragging) {
      return;
    }
    drag.dragging = true;
    setDragAnimating(false);
    panelRef.current?.setPointerCapture?.(pointerId);
    const scrollEl = drag.scrollEl;
    if (scrollEl) {
      scrollEl.style.overflow = "hidden";
      scrollEl.style.touchAction = "none";
    }
  }

  function primeSheetDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !sheetDragEnabled(variant, fullPage) ||
      !isTopModal(closeHandlerRef.current)
    ) {
      return;
    }

    const target = event.target as HTMLElement;
    const scrollEl = sheetScrollEl();
    const fromGrabber = Boolean(target.closest(".modal-grabber"));
    const fromControl = isSheetDragControl(target);
    const inScrollArea = Boolean(scrollEl?.contains(target));
    const scrollTop = scrollEl?.scrollTop ?? 0;
    const dismissEligible = sheetDismissEligible({
      fromGrabber,
      fromControl,
      inScrollArea,
      scrollTop,
    });

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scrollTop,
      dragging: fromGrabber,
      dismissEligible,
      scrollEl: scrollEl ?? null,
    };

    if (fromGrabber) {
      event.preventDefault();
      beginSheetDrag(event.pointerId);
    }
  }

  function onSheetPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const dy = event.clientY - drag.startY;
    const scrollTop = drag.scrollEl?.scrollTop ?? 0;

    if (!drag.dragging) {
      if (
        !shouldBeginSheetDrag({
          dismissEligible: drag.dismissEligible,
          scrollTop,
          dy,
        })
      ) {
        return;
      }
      beginSheetDrag(event.pointerId);
    }

    event.preventDefault();
    const offset = Math.max(0, dy);
    dragOffsetRef.current = offset;
    setDragOffset(offset);
  }

  function endSheetDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) {
      return;
    }

    if (panelRef.current?.hasPointerCapture?.(event.pointerId)) {
      panelRef.current.releasePointerCapture(event.pointerId);
    }

    if (drag.dragging) {
      const threshold = panelRef.current?.offsetHeight ?? 320;
      if (
        shouldCommitSheetDismiss(dragOffsetRef.current, threshold)
      ) {
        requestClose();
      } else {
        dragOffsetRef.current = 0;
        resetSheetDrag();
      }
    }

    dragRef.current = emptyDragState();
  }

  useLayoutEffect(() => {
    closeHandlerRef.current = () => requestCloseRef.current();
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
      if (event.key === "Escape") {
        if (isTopModal(closeHandlerRef.current)) {
          requestCloseRef.current();
        }
        return;
      }
      if (event.key !== "Tab" || !panel) {
        return;
      }
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((node) => node.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
  }, []);

  useLayoutEffect(() => {
    const sheetPanel = panelRef.current;
    const scrollContainer = sheetScrollEl();
    if (
      !sheetPanel ||
      !scrollContainer ||
      !sheetDragEnabled(variant, fullPage)
    ) {
      return;
    }
    const panel: HTMLDivElement = sheetPanel;
    const scrollEl: HTMLElement = scrollContainer;

    function onTouchStart(event: TouchEvent) {
      if (!isTopModal(closeHandlerRef.current)) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const target = event.target as HTMLElement;
      const fromGrabber = Boolean(target.closest(".modal-grabber"));
      const fromControl = isSheetDragControl(target);
      const inScrollArea = scrollEl.contains(target);
      const scrollTop = scrollEl.scrollTop;
      dragRef.current = {
        pointerId: touch.identifier,
        startY: touch.clientY,
        startScrollTop: scrollTop,
        dragging: fromGrabber,
        dismissEligible: sheetDismissEligible({
          fromGrabber,
          fromControl,
          inScrollArea,
          scrollTop,
        }),
        scrollEl,
      };
      if (fromGrabber) {
        event.preventDefault();
        beginSheetDrag(touch.identifier);
      }
    }

    function onTouchMove(event: TouchEvent) {
      if (!isTopModal(closeHandlerRef.current)) {
        return;
      }
      const touch = event.touches[0];
      const drag = dragRef.current;
      if (!touch || touch.identifier !== drag.pointerId) {
        return;
      }

      const dy = touch.clientY - drag.startY;
      const scrollTop = scrollEl.scrollTop;

      if (!drag.dragging) {
        if (
          !shouldBeginSheetDrag({
            dismissEligible: drag.dismissEligible,
            scrollTop,
            dy,
          })
        ) {
          if (scrollTop <= 0 && dy > 0) {
            event.preventDefault();
          }
          return;
        }
        beginSheetDrag(touch.identifier);
      }

      event.preventDefault();
      const offset = Math.max(0, dy);
      dragOffsetRef.current = offset;
      setDragOffset(offset);
    }

    function onTouchEnd(event: TouchEvent) {
      const drag = dragRef.current;
      const ended = [...event.changedTouches].some(
        (touch) => touch.identifier === drag.pointerId,
      );
      if (!ended) {
        return;
      }

      if (drag.dragging) {
        const threshold = panel.offsetHeight;
        if (shouldCommitSheetDismiss(dragOffsetRef.current, threshold)) {
          requestCloseRef.current();
        } else {
          dragOffsetRef.current = 0;
          resetSheetDrag();
        }
      }
      dragRef.current = emptyDragState();
    }

    panel.addEventListener("touchstart", onTouchStart, { passive: false });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: false });
    panel.addEventListener("touchend", onTouchEnd);
    panel.addEventListener("touchcancel", onTouchEnd);
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      panel.removeEventListener("touchend", onTouchEnd);
      panel.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [variant, fullPage, zIndex]);

  if (typeof document === "undefined" || zIndex === null) {
    return null;
  }

  const sheet = variant === "sheet";
  const frameClass = sheet
    ? fullPage
      ? "flex items-end justify-center pt-2"
      : "flex items-end justify-center pt-10 sm:items-center sm:p-4"
    : "flex items-center justify-center p-4";

  return createPortal(
    <div
      className={`pointer-events-auto fixed inset-0 overscroll-none ${frameClass}`}
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
            requestCloseRef.current();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative z-10 outline-none ${sheet ? "modal-sheet" : ""} ${fullPage ? "modal-sheet--page" : ""} ${dragAnimating ? "modal-sheet--animating" : ""} ${panelClassName}`}
        style={
          sheet && dragOffset > 0
            ? { transform: `translateY(${dragOffset}px)` }
            : undefined
        }
        onPointerDown={(event) => {
          event.stopPropagation();
          primeSheetDrag(event);
        }}
        onPointerMove={onSheetPointerMove}
        onPointerUp={endSheetDrag}
        onPointerCancel={endSheetDrag}
        onClick={(event) => event.stopPropagation()}
      >
        {sheet ? (
          <div
            aria-hidden="true"
            className={`modal-grabber relative z-10 ${fullPage ? "" : "sm:hidden"}`}
            style={{ touchAction: "none" }}
          />
        ) : null}
        <ModalDismissContext.Provider value={dismiss}>
          {children}
        </ModalDismissContext.Provider>
      </div>
    </div>,
    document.body,
  );
}
