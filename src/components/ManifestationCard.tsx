"use client";

import { manifestationStatLine } from "@/engine/queries";
import {
  PLAY_SHEET_LINK_CLASS,
  PLAY_UNIT_NAME_ROW_CLASS,
} from "@/lib/builderUi";
import type { ManifestationLore, ManifestationModel } from "@/engine/types";

type Props = {
  lore: ManifestationLore | null;
  lores: ManifestationLore[];
  playMode: boolean;
  onChangeLore: (loreId: string | null) => void;
  onOpenSheet: (model: ManifestationModel) => void;
};

export function ManifestationCard({
  lore,
  lores,
  playMode,
  onChangeLore,
  onOpenSheet,
}: Props) {
  if (playMode && !lore) {
    return null;
  }

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            Manifestation
          </p>
          <h2 className="font-serif text-2xl leading-tight">
            {lore?.name ?? "No lore chosen"}
          </h2>
        </div>
        {!playMode && lore ? (
          <button
            type="button"
            className="min-h-11 shrink-0 text-sm text-sheet-muted"
            onClick={() => onChangeLore(null)}
          >
            Remove
          </button>
        ) : null}
      </header>

      {!playMode ? (
        <label className="mb-3 flex flex-col gap-2 text-sm text-sheet-muted">
          Lore
          <select
            value={lore?.id ?? ""}
            onChange={(event) =>
              onChangeLore(event.target.value || null)
            }
            className="min-h-11 rounded-xl bg-parchment-ink/5 px-3 text-parchment-ink"
          >
            <option value="">Choose…</option>
            {lores.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {lore && lore.manifestations.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2">
          {lore.manifestations.map((model) => (
            <li key={model.id}>
              <ManifestationSlot
                model={model}
                playMode={playMode}
                onOpenSheet={() => onOpenSheet(model)}
              />
            </li>
          ))}
        </ul>
      ) : playMode ? (
        <p className="text-sm text-sheet-muted">No manifestations</p>
      ) : (
        <p className="text-sm text-sheet-muted">
          Pick a lore to see its manifestations.
        </p>
      )}
    </article>
  );
}

function ManifestationSlot({
  model,
  playMode,
  onOpenSheet,
}: {
  model: ManifestationModel;
  playMode: boolean;
  onOpenSheet: () => void;
}) {
  const stats = manifestationStatLine(model);
  const cast = model.summon?.castingValue
    ? `Cast ${model.summon.castingValue}`
    : "";

  if (playMode) {
    return (
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label={`${model.name} datasheet`}
        className="flex min-h-11 w-full flex-col items-start rounded-xl bg-parchment-ink/5 px-3 py-3 text-left active:opacity-60"
      >
        <span className={PLAY_UNIT_NAME_ROW_CLASS}>
          <span className="font-serif text-lg leading-tight">{model.name}</span>
          <span className={PLAY_SHEET_LINK_CLASS}>Sheet</span>
        </span>
        {stats || cast ? (
          <span className="mt-1 font-sans text-sm text-sheet-muted">
            {[stats, cast].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="flex min-h-11 flex-1 items-center gap-1 rounded-xl bg-parchment-ink/5 pl-3">
      <div className="flex min-h-11 flex-1 flex-col justify-center py-2 pr-2 text-left">
        <span className="font-serif text-lg leading-tight">{model.name}</span>
        {stats || cast ? (
          <span className="mt-0.5 font-sans text-sm text-sheet-muted">
            {[stats, cast].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={`${model.name} datasheet`}
        className="min-h-11 shrink-0 px-3 text-sm text-aether"
        onClick={onOpenSheet}
      >
        Sheet
      </button>
    </div>
  );
}
