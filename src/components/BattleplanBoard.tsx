"use client";

import Image from "next/image";
import type { BattleplanLayout } from "@/engine/battleplanLayout";
import { battleplanArtSrc } from "@/lib/battleplanArt";

type Props = {
  layout: BattleplanLayout;
  className?: string;
};

/** Temporary reference map art — replace with generated maps later. */
export function BattleplanBoard({ layout, className }: Props) {
  const src = battleplanArtSrc(layout.id);
  return (
    <div className={className ?? "relative w-full overflow-hidden rounded-lg"}>
      <Image
        src={src}
        alt={`${layout.name} battleplan map`}
        width={1200}
        height={1600}
        className="h-auto w-full"
        sizes="(max-width: 768px) 100vw, 720px"
        priority={false}
      />
    </div>
  );
}
