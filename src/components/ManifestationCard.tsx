"use client";

import { useRef } from "react";
import { manifestationStatLine } from "@/engine/queries";
import { openNativeSelect } from "@/lib/nativeSelect";
import type { ManifestationLore, ManifestationModel } from "@/engine/types";
import { BuildSlotRow, PlaySlotRow } from "./ios/SheetIconButton";

function loreLabel(lore: ManifestationLore): string {
  return lore.points ? `${lore.name} · ${lore.points} pts` : lore.name;
}

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
  const selectRef = useRef<HTMLSelectElement>(null);

  if (playMode && !lore) {
    return null;
  }

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4">
        <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
          Manifestation
        </p>
        {!playMode ? (
          <button
            type="button"
            onClick={() => openNativeSelect(selectRef.current)}
            aria-label={`Choose ${lore?.name ?? "manifestation lore"}`}
            className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-left active:opacity-60"
          >
            <h2 className="font-serif text-2xl leading-tight">
              {lore?.name ?? "No lore chosen"}
            </h2>
            {lore?.points ? (
              <p className="text-sm font-medium text-sigmarite">
                {lore.points} pts
              </p>
            ) : null}
          </button>
        ) : lore && lore.manifestations.length > 0 ? (
          <button
            type="button"
            onClick={() => onOpenSheet(lore.manifestations[0])}
            aria-label={`${lore.manifestations[0].name} datasheet`}
            className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-left active:opacity-60"
          >
            <h2 className="font-serif text-2xl leading-tight">
              {lore.name}
            </h2>
            {lore.points ? (
              <p className="text-sm font-medium text-sigmarite">
                {lore.points} pts
              </p>
            ) : null}
          </button>
        ) : (
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="font-serif text-2xl leading-tight">
              {lore?.name ?? "No lore chosen"}
            </h2>
            {lore?.points ? (
              <p className="text-sm font-medium text-sigmarite">
                {lore.points} pts
              </p>
            ) : null}
          </div>
        )}
      </header>

      {!playMode ? (
        <label className="mb-3 flex flex-col gap-2 text-sm text-sheet-muted">
          Lore
          <select
            ref={selectRef}
            value={lore?.id ?? ""}
            onChange={(event) =>
              onChangeLore(event.target.value || null)
            }
            className="min-h-11 rounded-xl bg-parchment-ink/5 px-3 text-parchment-ink"
          >
            <option value="">Choose…</option>
            {lores.map((option) => (
              <option key={option.id} value={option.id}>
                {loreLabel(option)}
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
    const subtitle = [stats, cast].filter(Boolean).join(" · ");
    return (
      <PlaySlotRow
        name={model.name}
        subtitle={subtitle || undefined}
        sheetLabel={`${model.name} datasheet`}
        onOpenSheet={onOpenSheet}
      />
    );
  }

  return (
    <BuildSlotRow
      name={model.name}
      subtitle={[stats, cast].filter(Boolean).join(" · ") || undefined}
      sheetLabel={`${model.name} datasheet`}
      onOpenSheet={onOpenSheet}
    />
  );
}
