"use client";

import {
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
  shouldBeginSheetDrag,
  shouldCommitSheetDismiss,
  sheetDismissEligible,
} from "@/lib/sheetDismiss";

type Props = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName: string;
  /** @deprecated z-index comes from the modal stack */
  zClass?: string;
  /** "sheet" pins to the bottom edge on phones (iOS style); "center" always floats. */
  variant?: "sheet" | "center";
};

type SheetDragState = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  dragging: boolean;
  dismissEligible: boolean;
  scrollEl: HTMLElement | null;
};

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

export function ModalFrame({
  label,
  onClose,
  children,
  panelClassName,
  variant = "sheet",
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

  function dismissSheet() {
    const height = panelRef.current?.offsetHeight ?? 400;
    dragOffsetRef.current = height;
    setDragAnimating(true);
    setDragOffset(height);
    window.setTimeout(() => onCloseRef.current(), 240);
  }

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
    panelRef.current?.setPointerCapture(pointerId);
    const scrollEl = drag.scrollEl;
    if (scrollEl) {
      scrollEl.style.overflow = "hidden";
      scrollEl.style.touchAction = "none";
    }
  }

  function primeSheetDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isMobileSheet(variant) || !isTopModal(closeHandlerRef.current)) {
      return;
    }

    const target = event.target as HTMLElement;
    const scrollEl = sheetScrollEl();
    const fromGrabber = Boolean(target.closest(".modal-grabber"));
    const inScrollArea = Boolean(scrollEl?.contains(target));
    const scrollTop = scrollEl?.scrollTop ?? 0;
    const dismissEligible = sheetDismissEligible({
      fromGrabber,
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

    if (panelRef.current?.hasPointerCapture(event.pointerId)) {
      panelRef.current.releasePointerCapture(event.pointerId);
    }

    if (drag.dragging) {
      const threshold = panelRef.current?.offsetHeight ?? 320;
      if (
        shouldCommitSheetDismiss(dragOffsetRef.current, threshold)
      ) {
        dismissSheet();
      } else {
        dragOffsetRef.current = 0;
        resetSheetDrag();
      }
    }

    dragRef.current = emptyDragState();
  }

  useLayoutEffect(() => {
    closeHandlerRef.current = () => onCloseRef.current();
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
          onCloseRef.current();
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
    if (!sheetPanel || !scrollContainer || !isMobileSheet(variant)) {
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
      const inScrollArea = scrollEl.contains(target);
      const scrollTop = scrollEl.scrollTop;
      dragRef.current = {
        pointerId: touch.identifier,
        startY: touch.clientY,
        startScrollTop: scrollTop,
        dragging: fromGrabber,
        dismissEligible: sheetDismissEligible({
          fromGrabber,
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
          dismissSheet();
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
  }, [variant, zIndex]);

  if (typeof document === "undefined" || zIndex === null) {
    return null;
  }

  const sheet = variant === "sheet";
  const frameClass = sheet
    ? "flex items-end justify-center pt-10 sm:items-center sm:p-4"
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
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative z-10 outline-none ${sheet ? "modal-sheet" : ""} ${dragAnimating ? "modal-sheet--animating" : ""} ${panelClassName}`}
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
            className="modal-grabber sm:hidden"
            style={{ touchAction: "none" }}
          />
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
