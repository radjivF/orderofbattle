"use client";

import type { ReactNode } from "react";
import { INDEX_BACKDROP_SRC } from "@/lib/siteArt";

type Props = {
  children: ReactNode;
  /** Softer veil on marketing; slightly denser on list UI. */
  veil?: "hero" | "page";
};

/**
 * Full-bleed battle art (CSS background — fills every viewport, no letterbox).
 */
export function IndexBackdropLayer({
  veil = "page",
}: {
  veil?: "hero" | "page";
}) {
  const scrub =
    veil === "hero"
      ? "bg-gradient-to-b from-ink/10 via-ink/20 to-ink/65"
      : "bg-gradient-to-b from-ink/20 via-ink/28 to-ink/68";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-ink"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${INDEX_BACKDROP_SRC})`,
        backgroundSize: "cover",
        backgroundPosition: "center 58%",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
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
