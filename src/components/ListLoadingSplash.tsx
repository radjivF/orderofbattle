"use client";

import Image from "next/image";
import { factionArtSrc, factionBackdropArtClass } from "@/lib/factionArt";
import { BrandMark } from "./BrandMark";

type Props = {
  factionId?: string | null;
  factionName?: string | null;
  label?: string;
};

/** Full-bleed hold while creating or opening a list — art + small spinner. */
export function ListLoadingSplash({
  factionId,
  factionName,
  label = "Opening your list",
}: Props) {
  const src = factionArtSrc(factionId);
  const artClass = factionBackdropArtClass(factionId);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink text-parchment"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={factionName ? `${factionName} artwork` : ""}
            fill
            sizes="100vw"
            quality={75}
            priority
            unoptimized
            className={artClass}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/50 to-ink/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-ink" />
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        <BrandMark size={48} className="h-12 w-auto drop-shadow-lg" priority />
        {factionName ? (
          <p className="gold-text font-serif text-2xl drop-shadow-md sm:text-3xl">
            {factionName}
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-3">
          <span
            className="size-7 animate-spin rounded-full border-2 border-parchment/25 border-t-sigmarite"
            aria-hidden="true"
          />
          <p className="text-xs tracking-[0.3em] text-parchment/80 uppercase">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
