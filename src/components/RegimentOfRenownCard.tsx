"use client";

import {
  battleDamagedWarning,
  battleStatLine,
  getRegimentOfRenown,
  rorUnitAsCatalogue,
  selectionPlayState,
} from "@/engine/queries";
import type {
  ArmyList,
  CatalogueUnit,
  Selection,
  UnitAbility,
} from "@/engine/types";
import { PlayHealthTrack, SlotMoreMenu } from "./RegimentCard";

type Props = {
  list: ArmyList;
  playMode: boolean;
  artefactBearerId?: string | null;
  artefactLabel?: string;
  artefactAbilities?: UnitAbility[];
  heroicTraitBearerId?: string | null;
  heroicTraitLabel?: string;
  heroicTraitAbilities?: UnitAbility[];
  onPickArtefact?: (heroSelectionId: string) => void;
  onPickTrait?: (heroSelectionId: string) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onRemove: () => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
};

export function RegimentOfRenownCard({
  list,
  playMode,
  artefactBearerId,
  artefactLabel,
  artefactAbilities,
  heroicTraitBearerId,
  heroicTraitLabel,
  heroicTraitAbilities,
  onPickArtefact,
  onPickTrait,
  onOpenDatasheet,
  onRemove,
  onPlayHealth,
}: Props) {
  const pick = list.regimentOfRenown;
  const ror = pick ? getRegimentOfRenown(pick.renownId) : undefined;
  if (!pick || !ror) {
    return null;
  }

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            Regiment of Renown
          </p>
          <h2 className="font-serif text-2xl leading-tight">{ror.name}</h2>
          <p className="mt-0.5 text-sm text-sigmarite">{ror.points} pts</p>
        </div>
        {!playMode ? <SlotMoreMenu onRemove={onRemove} /> : null}
      </header>

      {ror.abilities.length > 0 ? (
        <ul className="mb-4 space-y-2 border-b border-parchment-ink/10 pb-4">
          {ror.abilities.map((ability) => (
            <li key={ability.name} className="text-sm text-parchment-ink/75">
              <p className="font-serif text-base text-parchment-ink">
                {ability.name}
              </p>
              {ability.timing ? (
                <p className="text-xs text-sheet-muted">{ability.timing}</p>
              ) : null}
              {ability.effect ? (
                <p className="mt-1 leading-relaxed">{ability.effect}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-col gap-3">
        {pick.units.map((slot) => {
          const template = ror.units.find((unit) => unit.id === slot.unitId);
          if (!template) {
            return null;
          }
          const unit = rorUnitAsCatalogue(template);
          return (
            <RoRSlotRow
              key={slot.id}
              selection={slot}
              unit={unit}
              canEnhance={template.canTakeEnhancements}
              playMode={playMode}
              artefactBearerId={artefactBearerId}
              artefactLabel={artefactLabel}
              artefactAbilities={artefactAbilities}
              heroicTraitBearerId={heroicTraitBearerId}
              heroicTraitLabel={heroicTraitLabel}
              heroicTraitAbilities={heroicTraitAbilities}
              onPickArtefact={onPickArtefact}
              onPickTrait={onPickTrait}
              onOpenDatasheet={onOpenDatasheet}
              onPlayHealth={onPlayHealth}
            />
          );
        })}
      </ul>
    </article>
  );
}

function RoRSlotRow({
  selection,
  unit,
  canEnhance,
  playMode,
  artefactBearerId,
  artefactLabel,
  artefactAbilities,
  heroicTraitBearerId,
  heroicTraitLabel,
  heroicTraitAbilities,
  onPickArtefact,
  onPickTrait,
  onOpenDatasheet,
  onPlayHealth,
}: {
  selection: Selection;
  unit: CatalogueUnit;
  canEnhance: boolean;
  playMode: boolean;
  artefactBearerId?: string | null;
  artefactLabel?: string;
  artefactAbilities?: UnitAbility[];
  heroicTraitBearerId?: string | null;
  heroicTraitLabel?: string;
  heroicTraitAbilities?: UnitAbility[];
  onPickArtefact?: (heroSelectionId: string) => void;
  onPickTrait?: (heroSelectionId: string) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
}) {
  const play = selectionPlayState(selection, unit);
  const warning = battleDamagedWarning(unit, play.damage);
  const hasArtefact = artefactBearerId === selection.id;
  const hasTrait = heroicTraitBearerId === selection.id;

  return (
    <li className="rounded-xl bg-parchment-ink/5 px-3 py-2.5">
      {playMode ? (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onOpenDatasheet(unit)}
            >
              <p className="font-serif text-lg leading-tight">{unit.name}</p>
              <p className="mt-0.5 text-sm text-sheet-muted">
                {battleStatLine(unit)}
              </p>
            </button>
            {onPlayHealth ? (
              <PlayHealthTrack
                aside
                track={play}
                onChange={(damage) => onPlayHealth(selection.id, damage)}
              />
            ) : null}
          </div>
          {warning ? (
            <p className="mt-2 rounded-lg bg-illegal/10 px-2.5 py-2 text-sm leading-snug text-illegal">
              Battle damaged ({warning.threshold}+) · {warning.summary}
            </p>
          ) : null}
          {hasArtefact || hasTrait ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {hasArtefact && artefactLabel ? (
                <RoREnhancement
                  kind="Artefact"
                  label={artefactLabel}
                  abilities={artefactAbilities}
                />
              ) : null}
              {hasTrait && heroicTraitLabel ? (
                <RoREnhancement
                  kind="Heroic trait"
                  label={heroicTraitLabel}
                  abilities={heroicTraitAbilities}
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight">{unit.name}</p>
              <p className="mt-0.5 text-xs text-sheet-muted">
                {battleStatLine(unit)}
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 shrink-0 px-2.5 text-sm text-aether"
              onClick={() => onOpenDatasheet(unit)}
            >
              Sheet
            </button>
          </div>

          {canEnhance ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {onPickArtefact ? (
                hasArtefact && artefactLabel ? (
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <RoREnhancement
                        kind="Artefact"
                        label={artefactLabel}
                        abilities={artefactAbilities}
                      />
                    </div>
                    <button
                      type="button"
                      className="min-h-9 shrink-0 px-1 text-sm text-sheet-muted"
                      onClick={() => onPickArtefact(selection.id)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="min-h-10 text-left text-sm text-parchment-ink/70"
                    onClick={() => onPickArtefact(selection.id)}
                  >
                    Add artefact
                  </button>
                )
              ) : null}
              {onPickTrait ? (
                hasTrait && heroicTraitLabel ? (
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <RoREnhancement
                        kind="Heroic trait"
                        label={heroicTraitLabel}
                        abilities={heroicTraitAbilities}
                      />
                    </div>
                    <button
                      type="button"
                      className="min-h-9 shrink-0 px-1 text-sm text-sheet-muted"
                      onClick={() => onPickTrait(selection.id)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="min-h-10 text-left text-sm text-parchment-ink/70"
                    onClick={() => onPickTrait(selection.id)}
                  >
                    Add heroic trait
                  </button>
                )
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}

function RoREnhancement({
  kind,
  label,
  abilities,
}: {
  kind: string;
  label: string;
  abilities?: UnitAbility[];
}) {
  const hasRules = (abilities?.length ?? 0) > 0;
  if (!hasRules) {
    return (
      <p className="text-sm text-sheet-muted">
        {kind} · {label}
      </p>
    );
  }
  return (
    <details className="rounded-lg bg-parchment-ink/[0.06]">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-sheet-muted [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">
          {kind} · {label}
        </span>
        <span className="shrink-0 text-xs text-parchment-ink/35" aria-hidden>
          ▾
        </span>
      </summary>
      <ul className="space-y-1 border-t border-parchment-ink/10 px-2.5 py-2 text-xs text-sheet-muted">
        {abilities?.map((ability) => (
          <li key={ability.name}>
            <span className="text-parchment-ink/80">{ability.name}</span>
            {ability.effect ? ` — ${ability.effect}` : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Clear enhancements borne by any selection in the removed RoR. */
export function clearRoREnhancements(list: ArmyList): ArmyList {
  const ids = new Set(
    (list.regimentOfRenown?.units ?? []).map((slot) => slot.id),
  );
  if (ids.size === 0) {
    return { ...list, regimentOfRenown: null };
  }
  return {
    ...list,
    regimentOfRenown: null,
    artefact:
      list.artefact && ids.has(list.artefact.heroSelectionId)
        ? null
        : list.artefact,
    heroicTrait:
      list.heroicTrait && ids.has(list.heroicTrait.heroSelectionId)
        ? null
        : list.heroicTrait,
  };
}

export function buildRoRSelections(
  renownId: string,
  createId: () => string,
): { renownId: string; units: Selection[] } | null {
  const ror = getRegimentOfRenown(renownId);
  if (!ror) {
    return null;
  }
  const units: Selection[] = [];
  for (const unit of ror.units) {
    const copies = Math.max(1, unit.count);
    for (let i = 0; i < copies; i += 1) {
      units.push({
        id: createId(),
        unitId: unit.id,
        reinforced: false,
      });
    }
  }
  return { renownId, units };
}
