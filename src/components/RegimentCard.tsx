"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  battleDamagedWarning,
  battleStatLine,
  canTakeMonstrousTrait,
  canTakeVisionOfFate,
  getUnit,
  selectionPlayState,
  selectionPoints,
} from "@/engine/queries";
import type { CombatModifierNote } from "@/engine/magic";
import type {
  CatalogueUnit,
  FactionCatalogue,
  Regiment,
  Selection,
  UnitAbility,
} from "@/engine/types";

type Props = {
  regiment: Regiment;
  faction: FactionCatalogue;
  isGeneral: boolean;
  canBeGeneral: boolean;
  slotCap: number;
  selected: boolean;
  playMode: boolean;
  artefactBearerId?: string | null;
  artefactLabel?: string;
  artefactAbilities?: UnitAbility[];
  heroicTraitBearerId?: string | null;
  heroicTraitLabel?: string;
  heroicTraitAbilities?: UnitAbility[];
  monstrousTraitBearerId?: string | null;
  monstrousTraitLabel?: string;
  monstrousTraitAbilities?: UnitAbility[];
  visionBearerId?: string | null;
  visionLabel?: string;
  visionAbilities?: UnitAbility[];
  onSelect: () => void;
  onMakeGeneral: () => void;
  onPickHero: () => void;
  onPickUnit: () => void;
  onPickArtefact?: (heroSelectionId: string) => void;
  onPickTrait?: (heroSelectionId: string) => void;
  onPickMonstrousTrait?: (selectionId: string) => void;
  onPickVision?: (selectionId: string) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onToggleReinforce: (selectionId: string) => void;
  onRemoveUnit: (selectionId: string) => void;
  onRemoveRegiment: () => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
  bindNotes?: CombatModifierNote[];
};

export function RegimentCard({
  regiment,
  faction,
  isGeneral,
  canBeGeneral,
  slotCap,
  selected,
  playMode,
  artefactBearerId,
  artefactLabel,
  artefactAbilities,
  heroicTraitBearerId,
  heroicTraitLabel,
  heroicTraitAbilities,
  monstrousTraitBearerId,
  monstrousTraitLabel,
  monstrousTraitAbilities,
  visionBearerId,
  visionLabel,
  visionAbilities,
  onSelect,
  onMakeGeneral,
  onPickHero,
  onPickUnit,
  onPickArtefact,
  onPickTrait,
  onPickMonstrousTrait,
  onPickVision,
  onOpenDatasheet,
  onToggleReinforce,
  onRemoveUnit,
  onRemoveRegiment,
  onPlayHealth,
  bindNotes,
}: Props) {
  const hero = regiment.hero
    ? getUnit(faction, regiment.hero.unitId)
    : undefined;
  const openSlots = slotCap - regiment.units.length;

  return (
    <article
      className={`rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm ${
        selected && !playMode ? "ring-2 ring-aether" : ""
      }`}
      onClick={playMode ? undefined : onSelect}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          {isGeneral ? (
            <p className="text-sm font-semibold tracking-wide uppercase text-aether">
              General&apos;s regiment
            </p>
          ) : playMode ? (
            <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
              Regiment
            </p>
          ) : canBeGeneral ? (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold tracking-wide uppercase text-sheet-muted"
              onClick={(event) => {
                event.stopPropagation();
                onMakeGeneral();
              }}
            >
              Make general
            </button>
          ) : (
            <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
              Regiment
            </p>
          )}
          <h2 className="font-serif text-2xl leading-tight">
            {hero?.name ?? "Empty regiment"}
          </h2>
        </div>
        {!playMode ? (
          <button
            type="button"
            className="min-h-11 text-sm text-sheet-muted"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveRegiment();
            }}
          >
            Remove
          </button>
        ) : null}
      </header>

      {hero && regiment.hero ? (
        <>
          <SlotLine
            unit={hero}
            selection={regiment.hero}
            points={selectionPoints(hero, false)}
            playMode={playMode}
            bindNotes={bindNotes}
            onReplace={onPickHero}
            onOpenDatasheet={() => onOpenDatasheet(hero)}
            onPlayHealth={onPlayHealth}
          />
          <SlotEnhancements
            selectionId={regiment.hero.id}
            unit={hero}
            playMode={playMode}
            artefactBearerId={artefactBearerId}
            artefactLabel={artefactLabel}
            artefactAbilities={artefactAbilities}
            heroicTraitBearerId={heroicTraitBearerId}
            heroicTraitLabel={heroicTraitLabel}
            heroicTraitAbilities={heroicTraitAbilities}
            monstrousTraitBearerId={monstrousTraitBearerId}
            monstrousTraitLabel={monstrousTraitLabel}
            monstrousTraitAbilities={monstrousTraitAbilities}
            visionBearerId={visionBearerId}
            visionLabel={visionLabel}
            visionAbilities={visionAbilities}
            onPickArtefact={onPickArtefact}
            onPickTrait={onPickTrait}
            onPickMonstrousTrait={onPickMonstrousTrait}
            onPickVision={onPickVision}
          />
        </>
      ) : playMode ? (
        <p className="text-sm text-sheet-muted">No hero</p>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPickHero();
          }}
          className="mb-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-parchment-ink/20 text-sm"
        >
          Choose a hero
        </button>
      )}

      <ul className="mt-2 flex flex-col gap-2">
        {regiment.units.map((slot) => {
          const unit = getUnit(faction, slot.unitId);
          if (!unit) {
            return null;
          }
          return (
            <li key={slot.id}>
              <SlotLine
                unit={unit}
                selection={slot}
                points={selectionPoints(unit, slot.reinforced)}
                reinforced={slot.reinforced}
                canReinforce={unit.reinforce}
                playMode={playMode}
                bindNotes={bindNotes}
                onToggleReinforce={() => onToggleReinforce(slot.id)}
                onRemove={() => onRemoveUnit(slot.id)}
                onOpenDatasheet={() => onOpenDatasheet(unit)}
                onPlayHealth={onPlayHealth}
              />
              <SlotEnhancements
                selectionId={slot.id}
                unit={unit}
                playMode={playMode}
                artefactBearerId={artefactBearerId}
                artefactLabel={artefactLabel}
                artefactAbilities={artefactAbilities}
                heroicTraitBearerId={heroicTraitBearerId}
                heroicTraitLabel={heroicTraitLabel}
                heroicTraitAbilities={heroicTraitAbilities}
                monstrousTraitBearerId={monstrousTraitBearerId}
                monstrousTraitLabel={monstrousTraitLabel}
                monstrousTraitAbilities={monstrousTraitAbilities}
                visionBearerId={visionBearerId}
                visionLabel={visionLabel}
                visionAbilities={visionAbilities}
                onPickArtefact={onPickArtefact}
                onPickTrait={onPickTrait}
                onPickMonstrousTrait={onPickMonstrousTrait}
                onPickVision={onPickVision}
              />
            </li>
          );
        })}
      </ul>

      {!playMode && hero && openSlots > 0 ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPickUnit();
          }}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-parchment-ink/20 text-sm"
        >
          Add unit · {openSlots} open
        </button>
      ) : null}
    </article>
  );
}

export function SlotEnhancements({
  selectionId,
  unit,
  playMode,
  artefactBearerId,
  artefactLabel,
  artefactAbilities,
  heroicTraitBearerId,
  heroicTraitLabel,
  heroicTraitAbilities,
  monstrousTraitBearerId,
  monstrousTraitLabel,
  monstrousTraitAbilities,
  visionBearerId,
  visionLabel,
  visionAbilities,
  onPickArtefact,
  onPickTrait,
  onPickMonstrousTrait,
  onPickVision,
}: {
  selectionId: string;
  unit: CatalogueUnit;
  playMode: boolean;
  artefactBearerId?: string | null;
  artefactLabel?: string;
  artefactAbilities?: UnitAbility[];
  heroicTraitBearerId?: string | null;
  heroicTraitLabel?: string;
  heroicTraitAbilities?: UnitAbility[];
  monstrousTraitBearerId?: string | null;
  monstrousTraitLabel?: string;
  monstrousTraitAbilities?: UnitAbility[];
  visionBearerId?: string | null;
  visionLabel?: string;
  visionAbilities?: UnitAbility[];
  onPickArtefact?: (heroSelectionId: string) => void;
  onPickTrait?: (heroSelectionId: string) => void;
  onPickMonstrousTrait?: (selectionId: string) => void;
  onPickVision?: (selectionId: string) => void;
}) {
  const showHero = Boolean(unit.hero && !unit.unique);
  const showMonstrous = canTakeMonstrousTrait(unit);
  const showVision = canTakeVisionOfFate(unit);
  const hasArtefact = artefactBearerId === selectionId;
  const hasTrait = heroicTraitBearerId === selectionId;
  const hasMonstrous = monstrousTraitBearerId === selectionId;
  const hasVision = visionBearerId === selectionId;

  if (playMode) {
    if (!hasArtefact && !hasTrait && !hasMonstrous && !hasVision) {
      return null;
    }
    return (
      <div className="mt-1.5 flex flex-col gap-1.5">
        {hasArtefact && artefactLabel ? (
          <CollapsibleEnhancement
            kind="Artefact"
            label={artefactLabel}
            abilities={artefactAbilities}
          />
        ) : null}
        {hasTrait && heroicTraitLabel ? (
          <CollapsibleEnhancement
            kind="Trait"
            label={heroicTraitLabel}
            abilities={heroicTraitAbilities}
          />
        ) : null}
        {hasMonstrous && monstrousTraitLabel ? (
          <CollapsibleEnhancement
            kind="Monstrous trait"
            label={monstrousTraitLabel}
            abilities={monstrousTraitAbilities}
          />
        ) : null}
        {hasVision && visionLabel ? (
          <CollapsibleEnhancement
            kind="Vision of Fate"
            label={visionLabel}
            abilities={visionAbilities}
          />
        ) : null}
      </div>
    );
  }

  const artefactPick = showHero ? onPickArtefact : undefined;
  const traitPick = showHero ? onPickTrait : undefined;
  const monstrousPick = showMonstrous ? onPickMonstrousTrait : undefined;
  const visionPick = showVision ? onPickVision : undefined;
  if (!artefactPick && !traitPick && !monstrousPick && !visionPick) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      <EnhancementRow
        has={hasArtefact}
        kind="Artefact"
        label={artefactLabel}
        abilities={artefactAbilities}
        emptyLabel="Artefact"
        onPick={
          artefactPick ? () => artefactPick(selectionId) : undefined
        }
      />
      <EnhancementRow
        has={hasTrait}
        kind="Heroic trait"
        label={heroicTraitLabel}
        abilities={heroicTraitAbilities}
        emptyLabel="Heroic trait"
        onPick={traitPick ? () => traitPick(selectionId) : undefined}
      />
      <EnhancementRow
        has={hasMonstrous}
        kind="Monstrous trait"
        label={monstrousTraitLabel}
        abilities={monstrousTraitAbilities}
        emptyLabel="Monstrous trait"
        onPick={
          monstrousPick ? () => monstrousPick(selectionId) : undefined
        }
      />
      <EnhancementRow
        has={hasVision}
        kind="Vision of Fate"
        label={visionLabel}
        abilities={visionAbilities}
        emptyLabel="Vision of Fate"
        onPick={visionPick ? () => visionPick(selectionId) : undefined}
      />
    </div>
  );
}

function EnhancementRow({
  has,
  kind,
  label,
  abilities,
  emptyLabel,
  onPick,
}: {
  has: boolean;
  kind: string;
  label?: string;
  abilities?: UnitAbility[];
  emptyLabel: string;
  onPick?: () => void;
}) {
  if (!onPick) {
    return null;
  }
  if (has && label) {
    return (
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <CollapsibleEnhancement
            kind={kind}
            label={label}
            abilities={abilities}
          />
        </div>
        <button
          type="button"
          className="min-h-9 shrink-0 px-1 text-sm text-sheet-muted"
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        >
          Change
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="min-h-9 text-left text-sm text-sheet-muted"
      onClick={(event) => {
        event.stopPropagation();
        onPick();
      }}
    >
      {emptyLabel}
    </button>
  );
}

function CollapsibleEnhancement({
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
    <details
      className="rounded-lg bg-parchment-ink/5 open:bg-parchment-ink/[0.07]"
      onClick={(event) => event.stopPropagation()}
    >
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-sheet-muted [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">
          {kind} · {label}
        </span>
        <span className="shrink-0 text-xs text-parchment-ink/35" aria-hidden>
          ▾
        </span>
      </summary>
      <EnhancementPreview abilities={abilities ?? []} />
    </details>
  );
}

function SlotLine({
  unit,
  selection,
  points,
  reinforced,
  canReinforce,
  playMode,
  bindNotes,
  onReplace,
  onToggleReinforce,
  onRemove,
  onOpenDatasheet,
  onPlayHealth,
}: {
  unit: CatalogueUnit;
  selection?: Selection;
  points: number;
  reinforced?: boolean;
  canReinforce?: boolean;
  playMode: boolean;
  bindNotes?: CombatModifierNote[];
  onReplace?: () => void;
  onToggleReinforce?: () => void;
  onRemove?: () => void;
  onOpenDatasheet: () => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
}) {
  const stats = battleStatLine(unit);
  const track =
    playMode && selection
      ? selectionPlayState(selection, unit)
      : null;

  if (playMode) {
    const warning =
      track != null ? battleDamagedWarning(unit, track.damage) : null;
    return (
      <div className="w-full rounded-xl bg-parchment-ink/5 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDatasheet();
            }}
            className="min-w-0 flex-1 text-left"
          >
            <span className="font-serif text-lg leading-tight">
              {unit.name}
              {reinforced ? (
                <span className="ml-2 font-sans text-xs text-sheet-muted">
                  reinforced
                </span>
              ) : null}
            </span>
            {stats ? (
              <span className="mt-0.5 block font-sans text-sm text-sheet-muted">
                {stats}
              </span>
            ) : null}
          </button>
          {track && selection && onPlayHealth ? (
            <PlayHealthTrack
              aside
              track={track}
              onChange={(damage) => onPlayHealth(selection.id, damage)}
            />
          ) : null}
        </div>
        {warning ? (
          <p className="mt-2 rounded-lg bg-illegal/10 px-2.5 py-2 text-sm leading-snug text-illegal">
            Battle damaged ({warning.threshold}+) · {warning.summary}
          </p>
        ) : null}
        {selection ? (
          <PlayBindNotes selectionId={selection.id} notes={bindNotes} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-11 items-center gap-1 rounded-xl bg-parchment-ink/5 pl-3">
      <div className="min-w-0 flex-1 py-2 pr-2">
        <p className="font-serif text-lg leading-tight">
          {unit.name}
          {reinforced ? (
            <span className="ml-2 font-sans text-xs text-sheet-muted">
              reinforced
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-sigmarite">{points} pts</p>
      </div>
      <div className="flex shrink-0 items-stretch">
        <button
          type="button"
          className="min-h-11 px-2.5 text-sm text-aether"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDatasheet();
          }}
        >
          Sheet
        </button>
        {onReplace ? (
          <button
            type="button"
            className="min-h-11 px-2.5 text-sm text-sheet-muted"
            onClick={(event) => {
              event.stopPropagation();
              onReplace();
            }}
          >
            Change
          </button>
        ) : null}
        {canReinforce || onRemove ? (
          <SlotMoreMenu
            reinforced={reinforced}
            canReinforce={canReinforce}
            onToggleReinforce={onToggleReinforce}
            onRemove={onRemove}
          />
        ) : null}
      </div>
    </div>
  );
}

export function PlayBindNotes({
  selectionId,
  notes,
}: {
  selectionId: string;
  notes?: CombatModifierNote[];
}) {
  const mine = (notes ?? []).filter((note) => note.selectionId === selectionId);
  if (mine.length === 0) {
    return null;
  }
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {mine.map((note) => (
        <li
          key={`${note.kind}:${note.powerName}`}
          className="rounded-md bg-aether/10 px-2 py-1 text-xs text-aether"
        >
          <span className="font-medium">{note.powerName}</span>
          <span className="text-parchment-ink/70"> · {note.summary}</span>
        </li>
      ))}
    </ul>
  );
}

export function SlotMoreMenu({
  reinforced,
  canReinforce,
  onToggleReinforce,
  onRemove,
}: {
  reinforced?: boolean;
  canReinforce?: boolean;
  onToggleReinforce?: () => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex min-h-11 items-center px-2.5 text-sheet-muted"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-4 fill-current"
        >
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-xl bg-ink-raised py-1 text-parchment shadow-lg ring-1 ring-parchment/15"
          onClick={(event) => event.stopPropagation()}
        >
          {canReinforce && onToggleReinforce ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-11 w-full items-center px-3 text-left text-sm"
              onClick={() => {
                onToggleReinforce();
                setOpen(false);
              }}
            >
              {reinforced ? "Unreinforce" : "Reinforce"}
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-11 w-full items-center px-3 text-left text-sm text-illegal"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PlayHealthTrack({
  track,
  onChange,
  aside = false,
}: {
  track: ReturnType<typeof selectionPlayState>;
  onChange: (damage: number) => void;
  /** Compact column on the right of a unit row. */
  aside?: boolean;
}) {
  const singleModel = track.modelsMax <= 1;
  const dead = track.damage >= track.healthMax;

  if (aside) {
    return (
      <div
        className="flex shrink-0 flex-col items-end justify-center gap-1 border-l border-parchment-ink/10 pl-3"
        onClick={(event) => event.stopPropagation()}
      >
        {dead && singleModel ? (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="rounded-md bg-illegal/15 px-1.5 py-1 text-center text-[10px] leading-tight tracking-wide uppercase text-illegal"
          >
            Dead · revive
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <StepperButton
                label="+"
                onClick={() => onChange(track.damage + 1)}
                disabled={track.damage >= track.healthMax}
              />
              <p className="min-w-[2.75rem] text-center font-serif text-base tabular-nums leading-none">
                {track.damage}
                <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                  dmg
                </span>
              </p>
              <StepperButton
                label="−"
                onClick={() => onChange(track.damage - 1)}
                disabled={track.damage <= 0}
              />
            </div>
            <p className="text-xs tabular-nums text-sheet-muted">
              {track.healthMax} hp
              {!singleModel
                ? ` · ${track.models}/${track.modelsMax}`
                : ""}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-parchment-ink/10 pt-2"
      onClick={(event) => event.stopPropagation()}
    >
      {dead && singleModel ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="rounded-md bg-illegal/15 px-2 py-1 text-xs tracking-wide uppercase text-illegal"
        >
          Dead · tap to revive
        </button>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <StepperButton
              label="+"
              onClick={() => onChange(track.damage + 1)}
              disabled={track.damage >= track.healthMax}
            />
            <p className="min-w-[3.5rem] text-center font-serif text-base tabular-nums leading-none">
              {track.damage}
              <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                dmg
              </span>
            </p>
            <StepperButton
              label="−"
              onClick={() => onChange(track.damage - 1)}
              disabled={track.damage <= 0}
            />
          </div>
          <p className="text-xs tabular-nums text-sheet-muted">
            {track.healthMax} hp
          </p>
          {!singleModel ? (
            <p className="text-xs tabular-nums text-sheet-muted">
              {track.models}
              <span className="text-sheet-muted">/{track.modelsMax}</span>
              {" models"}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function StepperButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment-ink/10 text-sm leading-none disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function EnhancementPreview({ abilities }: { abilities: UnitAbility[] }) {
  return (
    <ul className="flex flex-col gap-2 border-t border-parchment-ink/10 px-2.5 py-2">
      {abilities.map((ability) => (
        <li key={ability.name} className="text-sm text-parchment-ink/85">
          {ability.name ? (
            <p className="font-serif text-base leading-snug text-parchment-ink">
              {ability.name}
            </p>
          ) : null}
          {ability.timing ? (
            <p className="mt-0.5 text-xs text-sheet-muted">
              {ability.timing}
            </p>
          ) : null}
          {ability.declare ? (
            <p className="mt-1 leading-relaxed">
              <span className="text-sheet-muted">Declare · </span>
              {ability.declare}
            </p>
          ) : null}
          {ability.effect ? (
            <p className="mt-1 leading-relaxed">
              <span className="text-sheet-muted">Effect · </span>
              {ability.effect}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
