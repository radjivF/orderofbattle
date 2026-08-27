"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName: string;
  zClass?: string;
};

export function ModalFrame({
  label,
  onClose,
  children,
  panelClassName,
  zClass = "z-50",
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
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center p-4`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/70"
        onPointerDown={() => {
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
        className={`relative z-10 outline-none ${panelClassName}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
