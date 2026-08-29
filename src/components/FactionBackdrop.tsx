"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Pass-through shell — art is rendered once on BuilderScreen. */
export function FactionBackdrop({ children }: Props) {
  return (
    <div className="relative min-h-full w-full max-w-[100vw] overflow-x-hidden text-parchment">
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}
