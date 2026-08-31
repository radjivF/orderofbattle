"use client";

import type { BattleplanLayout } from "@/engine/battleplanLayout";

type Props = {
  layout: BattleplanLayout;
  className?: string;
};

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((point) => `L ${point.x} ${point.y}`).join(" ") +
    " Z"
  );
}

/** Schematic only — not Games Workshop / Wahapedia map art. */
export function BattleplanBoard({ layout, className }: Props) {
  const { width, height } = layout.board;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${layout.name} battleplan schematic`}
      className={className ?? "h-auto w-full"}
    >
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        className="fill-parchment-ink/[0.04] stroke-parchment-ink/25"
        strokeWidth={0.4}
      />
      <path
        d={pointsToPath(layout.territories.attacker)}
        className="fill-aether/20 stroke-aether/50"
        strokeWidth={0.35}
      />
      <path
        d={pointsToPath(layout.territories.defender)}
        className="fill-sigmarite/20 stroke-sigmarite/50"
        strokeWidth={0.35}
      />
      {layout.terrain.map((mark) => (
        <rect
          key={mark.id}
          x={mark.x - 2}
          y={mark.y - 2}
          width={4}
          height={4}
          rx={0.6}
          className={
            mark.kind === "place-of-power"
              ? "fill-parchment-ink/35"
              : "fill-parchment-ink/20"
          }
        />
      ))}
      {layout.objectives.map((objective) => (
        <circle
          key={objective.id}
          cx={objective.x}
          cy={objective.y}
          r={1.6}
          className="fill-parchment-ink stroke-parchment"
          strokeWidth={0.35}
        />
      ))}
    </svg>
  );
}
