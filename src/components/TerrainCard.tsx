"use client";

import type { FactionTerrain, UnitAbility } from "@/engine/types";

type Props = {
  terrain: FactionTerrain[];
  playMode: boolean;
  onOpenSheet: (sheet: FactionTerrain) => void;
};

export function TerrainCard({ terrain, playMode, onOpenSheet }: Props) {
  if (terrain.length === 0) {
    return null;
  }

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Faction terrain
        </p>
        <h2 className="font-serif text-2xl leading-tight">
          {terrain.length === 1 ? terrain[0].name : "Terrain features"}
        </h2>
      </header>

      <ul className="flex flex-col gap-4">
        {terrain.map((feature) => (
          <li key={feature.id}>
            {terrain.length > 1 ? (
              <button
                type="button"
                onClick={() => onOpenSheet(feature)}
                className="mb-2 font-serif text-xl leading-tight text-left"
              >
                {feature.name}
              </button>
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
            {!playMode ? (
              <button
                type="button"
                className="mt-1 text-sm text-aether min-h-11"
                onClick={() => onOpenSheet(feature)}
              >
                Sheet
              </button>
            ) : (
              <button
                type="button"
                className="mt-1 text-sm text-aether min-h-11"
                onClick={() => onOpenSheet(feature)}
              >
                Open datasheet
              </button>
            )}
            {feature.abilities.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-3">
                {feature.abilities.map((ability) => (
                  <li
                    key={ability.name}
                    className="rounded-xl bg-parchment-ink/5 px-3 py-3"
                  >
                    <AbilityPreview ability={ability} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

function AbilityPreview({ ability }: { ability: UnitAbility }) {
  return (
    <>
      <p className="font-serif text-lg leading-tight">{ability.name}</p>
      <p className="mt-1 text-sm font-semibold tracking-wide uppercase text-sheet-muted">
        {ability.kind}
      </p>
      {ability.timing ? (
        <p className="mt-2 font-serif text-base leading-snug">
          {ability.timing}
        </p>
      ) : null}
      {ability.declare ? (
        <p className="mt-2 text-sm leading-relaxed text-parchment-ink/75">
          <span className="text-sheet-muted">Declare · </span>
          {ability.declare}
        </p>
      ) : null}
      {ability.effect ? (
        <p className="mt-1 text-sm leading-relaxed text-parchment-ink/75">
          <span className="text-sheet-muted">Effect · </span>
          {ability.effect}
        </p>
      ) : null}
    </>
  );
}
