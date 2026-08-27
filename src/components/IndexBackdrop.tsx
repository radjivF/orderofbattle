"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { INDEX_BACKDROP_SRC } from "@/lib/siteArt";

type Props = {
  children: ReactNode;
  /** Softer veil on marketing; slightly denser on list UI. */
  veil?: "hero" | "page";
};

/**
 * Two-army battle art behind landing + library.
 * Cover fills the screen on mobile (contain left large black bars).
 */
export function IndexBackdrop({ children, veil = "page" }: Props) {
  const scrub =
    veil === "hero"
      ? "bg-gradient-to-b from-ink/15 via-ink/25 to-ink/70"
      : "bg-gradient-to-b from-ink/25 via-ink/35 to-ink/72";

  return (
    <div className="relative min-h-full text-parchment">
      <div className="pointer-events-none fixed inset-0 z-0 bg-ink" aria-hidden="true">
        <Image
          src={INDEX_BACKDROP_SRC}
          alt=""
          fill
          sizes="100vw"
          quality={78}
          priority
          className="object-cover object-[center_62%]"
        />
        <div className={`absolute inset-0 ${scrub}`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,5,5,0.28)_100%)]" />
      </div>
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}
