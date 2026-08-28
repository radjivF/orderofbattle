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
  const dragRef = useRef({
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
    dragging: false,
  });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function sheetScrollEl() {
    return panelRef.current?.querySelector<HTMLElement>(".overflow-y-auto");
  }

  function dismissSheet() {
    const height = panelRef.current?.offsetHeight ?? 400;
    dragOffsetRef.current = height;
    setDragAnimating(true);
    setDragOffset(height);
    window.setTimeout(() => onCloseRef.current(), 240);
  }

  function resetSheetDrag() {
    setDragAnimating(true);
    setDragOffset(0);
    window.setTimeout(() => setDragAnimating(false), 280);
  }

  function onSheetPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (variant !== "sheet") {
      return;
    }
    if (window.matchMedia("(min-width: 640px)").matches) {
      return;
    }
    if (!isTopModal(closeHandlerRef.current)) {
      return;
    }

    const fromGrabber = (event.target as HTMLElement).closest(".modal-grabber");
    const scrollEl = sheetScrollEl();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scrollEl?.scrollTop ?? 0,
      dragging: Boolean(fromGrabber),
    };

    if (fromGrabber) {
      event.preventDefault();
      panelRef.current?.setPointerCapture(event.pointerId);
      setDragAnimating(false);
    }
  }

  function onSheetPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const dy = event.clientY - drag.startY;

    if (!drag.dragging) {
      if (drag.startScrollTop > 0) {
        return;
      }
      if (dy <= 8) {
        return;
      }
      drag.dragging = true;
      setDragAnimating(false);
      panelRef.current?.setPointerCapture(event.pointerId);
    }

    if (!drag.dragging) {
      return;
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
      const threshold = (panelRef.current?.offsetHeight ?? 320) * 0.22;
      if (dragOffsetRef.current >= threshold) {
        dismissSheet();
      } else {
        dragOffsetRef.current = 0;
        resetSheetDrag();
      }
    }

    dragRef.current = {
      pointerId: -1,
      startY: 0,
      startScrollTop: 0,
      dragging: false,
    };
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
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      releaseModalLayer(closeHandlerRef.current);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  if (typeof document === "undefined" || zIndex === null) {
    return null;
  }

  const sheet = variant === "sheet";
  const frameClass = sheet
    ? "flex items-end justify-center pt-10 sm:items-center sm:p-4"
    : "flex items-center justify-center p-4";

  return createPortal(
    <div
      className={`pointer-events-auto fixed inset-0 ${frameClass}`}
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
          onSheetPointerDown(event);
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
