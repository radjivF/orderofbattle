"use client";

import { useEffect, useRef } from "react";

/** Crest entrance + float on laptop only. Phones never load GSAP. */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const media = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );
    if (!media.matches) return;

    let revert: (() => void) | undefined;
    let cancelled = false;

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      const ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
        });
        timeline
          .from("[data-rise='crest']", {
            scale: 0.86,
            duration: 1.15,
          })
          .from(
            "[data-rise='copy']",
            { y: 28, duration: 0.8 },
            "-=0.5",
          )
          .from(
            "[data-rise='cta']",
            { y: 18, duration: 0.55 },
            "-=0.4",
          )
          .from(
            "[data-rise='card']",
            { y: 22, stagger: 0.1, duration: 0.55 },
            "-=0.25",
          );

        gsap.to("[data-rise='crest']", {
          y: -10,
          duration: 4.8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 1.3,
        });
      }, node);
      revert = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
