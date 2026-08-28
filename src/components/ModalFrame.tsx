"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { lockAppPointerEvents, unlockAppPointerEvents } from "@/lib/modalLock";

type Props = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName: string;
  zClass?: string;
  /** "sheet" pins to the bottom edge on phones (iOS style); "center" always floats. */
  variant?: "sheet" | "center";
};

export function ModalFrame({
  label,
  onClose,
  children,
  panelClassName,
  zClass = "z-[100]",
  variant = "sheet",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const backdropArmed = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    const previous = document.activeElement;
    panel?.focus();
    backdropArmed.current = false;
    const arm = window.setTimeout(() => {
      backdropArmed.current = true;
    }, 250);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
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
    lockAppPointerEvents();
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      unlockAppPointerEvents();
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  const sheet = variant === "sheet";
  const frameClass = sheet
    ? "flex items-end justify-center pt-10 sm:items-center sm:p-4"
    : "flex items-center justify-center p-4";

  return createPortal(
    <div
      className={`pointer-events-auto fixed inset-0 ${zClass} ${frameClass}`}
      data-modal-overlay=""
    >
      <div
        aria-hidden="true"
        className="modal-scrim absolute inset-0 bg-ink/70"
        onPointerDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          if (backdropArmed.current) {
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
        className={`relative z-10 outline-none ${sheet ? "modal-sheet" : ""} ${panelClassName}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {sheet ? <div aria-hidden="true" className="modal-grabber sm:hidden" /> : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
