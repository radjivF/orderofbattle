"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Pass-through shell — art is rendered once on BuilderScreen. */
export function FactionBackdrop({ children }: Props) {
  const [contentIn, setContentIn] = useState(false);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setContentIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative min-h-full w-full max-w-[100vw] overflow-x-hidden text-parchment">
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
