"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { factionArtSrc } from "@/lib/factionArt";
import { BrandMark } from "./BrandMark";

/** Short enough to stay snappy; long enough to read the art. */
const MIN_SPLASH_MS = 650;
const MAX_WAIT_MS = 1600;

type Props = {
  factionId: string | null | undefined;
  factionName?: string;
  children: ReactNode;
};

/**
 * Short faction splash, then list UI over a dimmed art background.
 * No art → plain ink (unchanged).
 */
export function FactionBackdrop({ factionId, factionName, children }: Props) {
  const src = factionArtSrc(factionId);
  const [splash, setSplash] = useState(Boolean(src));
  const [contentIn, setContentIn] = useState(!src);

  useEffect(() => {
    if (!src) {
      setSplash(false);
      setContentIn(true);
      return;
    }

    let cancelled = false;
    let finished = false;
    let revealTimer = 0;
    let hideTimer = 0;
    const started = Date.now();
    setSplash(true);
    setContentIn(false);

    function done() {
      if (cancelled || finished) return;
      finished = true;
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
      revealTimer = window.setTimeout(() => {
        if (cancelled) return;
        setContentIn(true);
        hideTimer = window.setTimeout(() => {
          if (!cancelled) setSplash(false);
        }, 320);
      }, wait);
    }

    const img = new window.Image();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    const cap = window.setTimeout(done, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, [src]);

  if (!src) {
    return <div className="min-h-full bg-ink text-parchment">{children}</div>;
  }

  return (
    <div className="relative min-h-full w-full max-w-[100vw] overflow-x-hidden text-parchment">
      {/* Must stay z-0 (not negative) or body bg-ink paints over it. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <Image
          src={src}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/78 via-ink/88 to-ink/94" />
      </div>

      {splash ? (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-end pb-16 transition-opacity duration-300 ${
            contentIn ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-busy={!contentIn}
          aria-live="polite"
        >
          <Image
            src={src}
            alt={factionName ? `${factionName} artwork` : "Faction artwork"}
            fill
            sizes="100vw"
            quality={75}
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <BrandMark size={48} className="h-12 w-auto drop-shadow-lg" />
            {factionName ? (
              <p className="gold-text font-serif text-2xl drop-shadow-md sm:text-3xl">
                {factionName}
              </p>
            ) : null}
            <p className="text-xs tracking-[0.3em] text-parchment/80 uppercase">
              Opening list
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={`relative z-10 min-h-full transition-opacity duration-300 ${
          contentIn ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
