"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  battleDamagedWarning,
  battleStatLine,
  canTakeMonstrousTrait,
  canTakeVisionOfFate,
  enhancementLabel,
  selectionPlayState,
  unitSizeLabel,
} from "@/engine/queries";
import type { CombatModifierNote } from "@/engine/magic";
import type {
  CatalogueUnit,
  Selection,
  SpecialEnhancementPick,
  SpecialEnhancementTable,
  UnitAbility,
} from "@/engine/types";
import {
  BuildSlotRow,
  EDIT_LINK_BUTTON_COMPACT_CLASS,
  EditLinkButton,
  IosPlusIcon,
  PlaySlotRow,
} from "./ios/SheetIconButton";
import { ExpandableRuleCard } from "./ExpandableRuleCard";
import { CodedKeywordChips } from "./KeywordChip";
import { PlayHealthTrack } from "./PlayHealthTrack";

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
            onPick={onPick}
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
  onPick,
}: {
  kind: string;
  label: string;
  abilities?: UnitAbility[];
  onPick?: () => void;
}) {
  const rules = abilities ?? [];
  const title = `${kind} · ${label}`;
  if (rules.length === 0) {
    if (onPick) {
      return (
        <button
          type="button"
          className="text-left text-sm text-sheet-muted active:opacity-60"
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
        >
          {title}
        </button>
      );
    }
    return <p className="text-sm text-sheet-muted">{title}</p>;
  }

  const primary = rules[0];
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <ExpandableRuleCard
        nested
        title={title}
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

export function SlotLine({
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
  const tags = <CodedKeywordChips categories={unit.categories} />;
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
          tags={tags}
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
      tags={tags}
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
