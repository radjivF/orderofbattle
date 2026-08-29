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
  unitSizeLabel,
} from "@/engine/queries";
import type { CombatModifierNote } from "@/engine/magic";
import type {
  CatalogueUnit,
  FactionCatalogue,
  Regiment,
  Selection,
  SpecialEnhancementPick,
  SpecialEnhancementTable,
  UnitAbility,
} from "@/engine/types";
import { enhancementLabel } from "@/engine/queries";
import { damageStepperActions } from "@/lib/damageStepper";
import {
  BuildSlotRow,
  EDIT_LINK_BUTTON_COMPACT_CLASS,
  EditLinkButton,
  IosPlusIcon,
  IosTrashIcon,
  PlaySlotRow,
} from "./ios/SheetIconButton";
import { ExpandableRuleCard } from "./ExpandableRuleCard";

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
  specialTables?: SpecialEnhancementTable[];
  specialEnhancementPicks?: SpecialEnhancementPick[];
  onSelect: () => void;
  onMakeGeneral: () => void;
  onPickHero: () => void;
  onPickUnit: () => void;
  onPickArtefact?: (heroSelectionId: string) => void;
  onPickTrait?: (heroSelectionId: string) => void;
  onPickMonstrousTrait?: (selectionId: string) => void;
  onPickVision?: (selectionId: string) => void;
  onPickSpecial?: (tableId: string, selectionId: string) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onToggleReinforce: (selectionId: string) => void;
  onDuplicateUnit: (selectionId: string) => void;
  onRemoveUnit: (selectionId: string) => void;
  onRemoveRegiment: () => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
  bindNotes?: CombatModifierNote[];
  locked?: boolean;
  /** Spearhead generals take an enhancement even when the warscroll is unique. */
  allowUniqueHeroTrait?: boolean;
  traitKind?: string;
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
  specialTables,
  specialEnhancementPicks,
  onSelect,
  onMakeGeneral,
  onPickHero,
  onPickUnit,
  onPickArtefact,
  onPickTrait,
  onPickMonstrousTrait,
  onPickVision,
  onPickSpecial,
  onOpenDatasheet,
  onToggleReinforce,
  onDuplicateUnit,
  onRemoveUnit,
  onRemoveRegiment,
  onPlayHealth,
  bindNotes,
  locked = false,
  allowUniqueHeroTrait = false,
  traitKind,
}: Props) {
  const hero = regiment.hero
    ? getUnit(faction, regiment.hero.unitId)
    : undefined;
  const openSlots = slotCap - regiment.units.length;

  return (
    <article
      className={`cursor-default rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm ${
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
          ) : playMode || locked ? (
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
        {!playMode && !locked ? (
          <button
            type="button"
            aria-label="Remove regiment"
            className="pressable inline-flex h-11 w-11 items-center justify-center text-illegal"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveRegiment();
            }}
          >
            <IosTrashIcon />
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
            hidePoints={locked}
            bindNotes={bindNotes}
            onReplace={locked ? undefined : onPickHero}
            onOpenDatasheet={() => onOpenDatasheet(hero)}
            onPlayHealth={onPlayHealth}
          />
          <SlotEnhancements
            selectionId={regiment.hero.id}
            unit={hero}
            playMode={playMode}
            allowUniqueHeroTrait={allowUniqueHeroTrait}
            traitKind={traitKind}
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
            specialTables={specialTables}
            specialEnhancementPicks={specialEnhancementPicks}
            onPickSpecial={
              onPickSpecial
                ? (tableId) => onPickSpecial(tableId, regiment.hero!.id)
                : undefined
            }
          />
        </>
      ) : playMode ? (
        <p className="text-sm text-sheet-muted">No hero</p>
      ) : locked ? (
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
                hidePoints={locked}
                bindNotes={bindNotes}
                onToggleReinforce={
                  locked ? undefined : () => onToggleReinforce(slot.id)
                }
                onDuplicate={
                  locked || unit.unique || openSlots <= 0
                    ? undefined
                    : () => onDuplicateUnit(slot.id)
                }
                onRemove={locked ? undefined : () => onRemoveUnit(slot.id)}
                onOpenDatasheet={() => onOpenDatasheet(unit)}
                onPlayHealth={onPlayHealth}
              />
              <SlotEnhancements
                selectionId={slot.id}
                unit={unit}
                playMode={playMode}
                traitKind={traitKind}
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
                onPickArtefact={locked ? undefined : onPickArtefact}
                onPickTrait={locked ? undefined : onPickTrait}
                onPickMonstrousTrait={onPickMonstrousTrait}
                onPickVision={onPickVision}
                specialTables={specialTables}
                specialEnhancementPicks={specialEnhancementPicks}
                onPickSpecial={
                  onPickSpecial
                    ? (tableId) => onPickSpecial(tableId, slot.id)
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {!playMode && !locked && hero && openSlots > 0 ? (
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
  specialTables,
  specialEnhancementPicks,
  onPickSpecial,
  allowUniqueHeroTrait = false,
  traitKind = "Heroic trait",
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
  specialTables?: SpecialEnhancementTable[];
  specialEnhancementPicks?: SpecialEnhancementPick[];
  onPickSpecial?: (tableId: string) => void;
  allowUniqueHeroTrait?: boolean;
  traitKind?: string;
}) {
  const showHero = Boolean(unit.hero && !unit.unique);
  const showTrait = Boolean(unit.hero && (!unit.unique || allowUniqueHeroTrait));
  const showMonstrous = canTakeMonstrousTrait(unit);
  const showVision = canTakeVisionOfFate(unit);
  const canTakeSpecial = !unit.unique;
  const hasArtefact = artefactBearerId === selectionId;
  const hasTrait = heroicTraitBearerId === selectionId;
  const hasMonstrous = monstrousTraitBearerId === selectionId;
  const hasVision = visionBearerId === selectionId;
  const playTraitKind = traitKind === "Heroic trait" ? "Trait" : traitKind;

  if (playMode) {
    const hasSpecial = (specialTables ?? []).some((table) => {
      const pick = specialEnhancementPicks?.find(
        (item) => item.tableId === table.id,
      );
      return pick?.heroSelectionId === selectionId;
    });
    if (!hasArtefact && !hasTrait && !hasMonstrous && !hasVision && !hasSpecial) {
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
            kind={playTraitKind}
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
        {(specialTables ?? []).map((table) => {
          const pick = specialEnhancementPicks?.find(
            (item) => item.tableId === table.id,
          );
          if (!pick || pick.heroSelectionId !== selectionId) {
            return null;
          }
          const label = enhancementLabel(table.options, pick.optionId);
          const abilities = table.options.find(
            (item) => item.id === pick.optionId,
          )?.abilities;
          if (!label) {
            return null;
          }
          return (
            <CollapsibleEnhancement
              key={table.id}
              kind={table.name}
              label={label}
              abilities={abilities}
            />
          );
        })}
      </div>
    );
  }

  const artefactPick = showHero ? onPickArtefact : undefined;
  const traitPick = showTrait ? onPickTrait : undefined;
  const monstrousPick = showMonstrous ? onPickMonstrousTrait : undefined;
  const visionPick = showVision ? onPickVision : undefined;
  const specialPick = canTakeSpecial ? onPickSpecial : undefined;
  const hasSpecialSlots = (specialTables?.length ?? 0) > 0 && specialPick;
  if (
    !artefactPick &&
    !traitPick &&
    !monstrousPick &&
    !visionPick &&
    !hasSpecialSlots
  ) {
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
        kind={traitKind}
        label={heroicTraitLabel}
        abilities={heroicTraitAbilities}
        emptyLabel={traitKind}
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
      {(specialTables ?? []).map((table) => {
        const pick = specialEnhancementPicks?.find(
          (item) => item.tableId === table.id,
        );
        const has = pick?.heroSelectionId === selectionId;
        const label = has
          ? enhancementLabel(table.options, pick?.optionId)
          : undefined;
        const abilities = has
          ? table.options.find((item) => item.id === pick?.optionId)?.abilities
          : undefined;
        return (
          <EnhancementRow
            key={table.id}
            has={has}
            kind={table.name}
            label={label}
            abilities={abilities}
            emptyLabel={table.name}
            onPick={
              specialPick ? () => specialPick(table.id) : undefined
            }
          />
        );
      })}
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
        <EditLinkButton
          label={`Change ${kind}`}
          className={EDIT_LINK_BUTTON_COMPACT_CLASS}
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="flex min-h-9 w-fit items-center gap-2.5 text-left text-sm text-sheet-muted"
      onClick={(event) => {
        event.stopPropagation();
        onPick();
      }}
    >
      <IosPlusIcon className="h-4 w-4 shrink-0 opacity-70" />
      <span>{emptyLabel}</span>
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
  const rules = abilities ?? [];
  if (rules.length === 0) {
    return (
      <p className="text-sm text-sheet-muted">
        {kind} · {label}
      </p>
    );
  }

  const primary = rules[0];
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <ExpandableRuleCard
        nested
        title={`${kind} · ${label}`}
        timing={primary.timing}
        declare={primary.declare}
        effect={primary.effect}
      />
      {rules.slice(1).map((ability) => (
        <ExpandableRuleCard
          key={ability.name}
          nested
          title={ability.name}
          timing={ability.timing}
          declare={ability.declare}
          effect={ability.effect}
        />
      ))}
    </div>
  );
}

function SlotLine({
  unit,
  selection,
  points,
  reinforced,
  canReinforce,
  playMode,
  hidePoints,
  bindNotes,
  onReplace,
  onToggleReinforce,
  onDuplicate,
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
  hidePoints?: boolean;
  bindNotes?: CombatModifierNote[];
  onReplace?: () => void;
  onToggleReinforce?: () => void;
  onDuplicate?: () => void;
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
        <PlaySlotRow
          name={unit.name}
          subtitle={stats || undefined}
          reinforced={reinforced}
          sheetLabel={`${unit.name} datasheet`}
          onOpenSheet={onOpenDatasheet}
          trailing={
            track && selection && onPlayHealth ? (
              <PlayHealthTrack
                aside
                track={track}
                onChange={(damage) => onPlayHealth(selection.id, damage)}
              />
            ) : null
          }
        />
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
    <BuildSlotRow
      name={unit.name}
      subtitle={
        hidePoints
          ? unitSizeLabel(unit, Boolean(reinforced))
          : `${unitSizeLabel(unit, Boolean(reinforced))} · ${points} pts`
      }
      reinforced={reinforced}
      sheetLabel={`${unit.name} datasheet`}
      onOpenSheet={onOpenDatasheet}
      trailing={
        <>
          {onReplace ? (
            <EditLinkButton
              label={`Change ${unit.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onReplace();
              }}
            />
          ) : null}
          {(canReinforce && onToggleReinforce) || onDuplicate || onRemove ? (
            <SlotMoreMenu
              reinforced={reinforced}
              canReinforce={canReinforce}
              onToggleReinforce={onToggleReinforce}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ) : null}
        </>
      }
    />
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
  onDuplicate,
  onRemove,
}: {
  reinforced?: boolean;
  canReinforce?: boolean;
  onToggleReinforce?: () => void;
  onDuplicate?: () => void;
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
          {onDuplicate ? (
            <button
              type="button"
              role="menuitem"
              className="flex min-h-11 w-full items-center px-3 text-left text-sm"
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
            >
              Duplicate
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
  const [dec, inc] = damageStepperActions(track.damage, track.healthMax);

  if (aside) {
    return (
      <div
        className="flex w-full flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-parchment-ink/10 pt-2 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3"
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
                label={dec.label}
                onClick={() => onChange(dec.nextDamage)}
                disabled={dec.disabled}
              />
              <p className="min-w-[2.75rem] text-center font-serif text-base tabular-nums leading-none">
                {track.damage}
                <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                  dmg
                </span>
              </p>
              <StepperButton
                label={inc.label}
                onClick={() => onChange(inc.nextDamage)}
                disabled={inc.disabled}
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
              label={dec.label}
              onClick={() => onChange(dec.nextDamage)}
              disabled={dec.disabled}
            />
            <p className="min-w-[3.5rem] text-center font-serif text-base tabular-nums leading-none">
              {track.damage}
              <span className="ml-0.5 text-xs tracking-wide uppercase text-sheet-muted">
                dmg
              </span>
            </p>
            <StepperButton
              label={inc.label}
              onClick={() => onChange(inc.nextDamage)}
              disabled={inc.disabled}
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
