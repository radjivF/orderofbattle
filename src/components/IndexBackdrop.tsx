"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  LIST_LANDING_CONTENT_CLASS,
  LIST_LANDING_CONTENT_HIDDEN_CLASS,
  LIST_LANDING_CONTENT_VISIBLE_CLASS,
} from "@/lib/builderUi";
import { INDEX_BACKDROP_ART_CLASS, INDEX_BACKDROP_SRC } from "@/lib/siteArt";

type Props = {
  children: ReactNode;
  /** Softer veil on marketing; slightly denser on list UI. */
  veil?: "hero" | "page";
};

/**
 * Full-bleed battle art on a fixed layer (img + object-cover).
 * iOS mishandles background-attachment:fixed — zoom, blur, and scroll jitter.
 */
export function IndexBackdropLayer({
  veil = "page",
  revealed = true,
  transitionClass = LIST_LANDING_CONTENT_CLASS,
}: {
  veil?: "hero" | "page";
  /** Fade in when returning from a list — layer stays mounted for a smooth crossfade. */
  revealed?: boolean;
  transitionClass?: string;
}) {
  const scrub =
    veil === "hero"
      ? "bg-gradient-to-b from-ink/10 via-ink/20 to-ink/65"
      : "bg-gradient-to-b from-ink/20 via-ink/28 to-ink/68";
  const eager = veil === "hero";

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink ${transitionClass} ${
        revealed
          ? LIST_LANDING_CONTENT_VISIBLE_CLASS
          : LIST_LANDING_CONTENT_HIDDEN_CLASS
      }`}
      aria-hidden="true"
    >
      <Image
        src={INDEX_BACKDROP_SRC}
        alt=""
        fill
        sizes="100vw"
        quality={75}
        priority={eager}
        loading="eager"
        className={INDEX_BACKDROP_ART_CLASS}
      />
      <div className={`absolute inset-0 ${scrub}`} />
    </div>
  );
}

export function IndexBackdrop({ children, veil = "page" }: Props) {
  return (
    <div className="relative min-h-full text-parchment">
      <IndexBackdropLayer veil={veil} />
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}
