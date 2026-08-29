"use client";

import {
  LIST_LANDING_CONTENT_CLASS,
  LIST_LANDING_CONTENT_HIDDEN_CLASS,
  LIST_LANDING_CONTENT_VISIBLE_CLASS,
} from "@/lib/builderUi";
import { BrandMark } from "./BrandMark";

type Props = {
  factionName?: string | null;
  label?: string;
  /** Fade out while builder content fades in underneath. */
  fading?: boolean;
};

/** Spinner over faction art while the list opens. */
export function ListLoadingSplash({
  factionName,
  label = "Opening your list",
  fading = false,
}: Props) {
  return (
    <div
      className={`relative z-30 h-full min-h-[100dvh] bg-transparent text-parchment ${LIST_LANDING_CONTENT_CLASS} ${
        fading ? LIST_LANDING_CONTENT_HIDDEN_CLASS : LIST_LANDING_CONTENT_VISIBLE_CLASS
      }`}
      role="status"
      aria-live="polite"
      aria-busy={!fading}
    >
      <div className="list-splash-content relative z-10 flex min-h-[100dvh] flex-col items-center px-6 text-center">
        <BrandMark size={48} className="h-12 w-auto drop-shadow-lg" priority />
        {factionName ? (
          <p className="mt-4 font-serif text-2xl text-parchment drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-3xl">
            {factionName}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col items-center gap-3">
          <span
            className="size-7 animate-spin rounded-full border-2 border-parchment/25 border-t-sigmarite"
            aria-hidden="true"
          />
          <p className="text-sm font-medium tracking-wide text-parchment">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
