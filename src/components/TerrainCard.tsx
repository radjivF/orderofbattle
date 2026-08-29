"use client";

import type { FactionTerrain } from "@/engine/types";
import { SheetLinkButton } from "./ios/SheetIconButton";

type Props = {
  terrain: FactionTerrain[];
  onOpenSheet: (sheet: FactionTerrain) => void;
};

function terrainStats(feature: FactionTerrain): string {
  return [
    feature.stats.health ? `Health ${feature.stats.health}` : "",
    feature.stats.save ? `Save ${feature.stats.save}` : "",
    feature.stats.move && feature.stats.move !== "-"
      ? `Move ${feature.stats.move}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function TerrainCard({ terrain, onOpenSheet }: Props) {
  if (terrain.length === 0) {
    return null;
  }

  const single = terrain.length === 1 ? terrain[0] : null;

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Faction terrain
        </p>
        {single ? (
          <div className="flex w-full items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenSheet(single)}
              className="min-w-0 flex-1 text-left active:opacity-60"
            >
              <h2 className="font-serif text-2xl leading-tight">{single.name}</h2>
              {terrainStats(single) ? (
                <p className="mt-1 text-sm text-sheet-muted">
                  {terrainStats(single)}
                </p>
              ) : null}
            </button>
            <SheetLinkButton
              label={`${single.name} datasheet`}
              onClick={() => onOpenSheet(single)}
            />
          </div>
        ) : (
          <h2 className="font-serif text-2xl leading-tight">Terrain features</h2>
        )}
      </header>

      {single ? null : (
        <ul className="flex flex-col gap-4">
          {terrain.map((feature) => (
            <li key={feature.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenSheet(feature)}
                  className="min-w-0 w-fit max-w-full font-serif text-xl leading-tight text-left active:opacity-60"
                >
                  {feature.name}
                </button>
                <SheetLinkButton
                  label={`${feature.name} datasheet`}
                  onClick={() => onOpenSheet(feature)}
                />
              </div>
              <p className="text-sm text-sheet-muted">{terrainStats(feature)}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
