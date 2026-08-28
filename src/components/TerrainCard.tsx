"use client";

import type { FactionTerrain } from "@/engine/types";
import { SheetLinkButton } from "./ios/SheetIconButton";

type Props = {
  terrain: FactionTerrain[];
  onOpenSheet: (sheet: FactionTerrain) => void;
};

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
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 font-serif text-2xl leading-tight">
            {single ? single.name : "Terrain features"}
          </h2>
          {single ? (
            <SheetLinkButton
              label={`${single.name} datasheet`}
              onClick={() => onOpenSheet(single)}
            />
          ) : null}
        </div>
      </header>

      <ul className="flex flex-col gap-4">
        {terrain.map((feature) => (
          <li key={feature.id}>
            {terrain.length > 1 ? (
              <div className="mb-2 flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenSheet(feature)}
                  className="min-w-0 flex-1 font-serif text-xl leading-tight text-left"
                >
                  {feature.name}
                </button>
                <SheetLinkButton
                  label={`${feature.name} datasheet`}
                  onClick={() => onOpenSheet(feature)}
                />
              </div>
            ) : null}
            <p className="text-sm text-sheet-muted">
              {[
                feature.stats.health ? `Health ${feature.stats.health}` : "",
                feature.stats.save ? `Save ${feature.stats.save}` : "",
                feature.stats.move && feature.stats.move !== "-"
                  ? `Move ${feature.stats.move}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
