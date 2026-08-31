"use client";

import type { CombatModifierNote } from "@/engine/magic";
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
  DatasheetSubject,
  Selection,
  SpecialEnhancementPick,
  SpecialEnhancementTable,
  UnitAbility,
} from "@/engine/types";
import { PlayBindNotes, PlayHealthTrack, SlotEnhancements, SlotMoreMenu } from "./RegimentCard";
import { PathToGloryUnitExtras } from "./PathToGloryUnitExtras";
import {
  selectionDisplayName,
  type PathToGloryPackId,
} from "@/engine/pathToGlory";
import { BuildSlotRow, PlaySlotRow, SheetLinkButton } from "./ios/SheetIconButton";

type Props = {
  list: ArmyList;
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
  onPickSpecial?: (tableId: string, selectionId: string) => void;
  onOpenDatasheet: (sheet: DatasheetSubject) => void;
  onRemove: () => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
  bindNotes?: CombatModifierNote[];
  pathToGloryPackIds?: PathToGloryPackId[] | null;
  showBattleWounds?: boolean;
  onPatchSelection?: (selectionId: string, next: Selection) => void;
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
  onOpenDatasheet,
  onRemove,
  onPlayHealth,
  bindNotes,
  pathToGloryPackIds = null,
  showBattleWounds = false,
  onPatchSelection,
}: Props) {
  const pick = list.regimentOfRenown;
  const ror = pick ? getRegimentOfRenown(pick.renownId) : undefined;
  if (!pick || !ror) {
    return null;
  }

  return (
    <article className="rounded-2xl bg-parchment p-5 text-parchment-ink shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
            Regiment of Renown
          </p>
          <h2 className="font-serif text-2xl leading-tight">{ror.name}</h2>
          <p className="mt-0.5 text-sm text-sigmarite">{ror.points} pts</p>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <SheetLinkButton
            label={`${ror.name} datasheet`}
            onClick={() => onOpenDatasheet(ror)}
          />
          {!playMode ? <SlotMoreMenu onRemove={onRemove} /> : null}
        </div>
      </header>

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
              pathToGloryPackIds={pathToGloryPackIds}
              showBattleWounds={showBattleWounds}
              onPatchSelection={onPatchSelection}
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
                  ? (tableId) => onPickSpecial(tableId, slot.id)
                  : undefined
              }
              onOpenDatasheet={(unit) => onOpenDatasheet(unit)}
              onPlayHealth={onPlayHealth}
              bindNotes={bindNotes}
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
  pathToGloryPackIds,
  showBattleWounds,
  onPatchSelection,
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
  onOpenDatasheet,
  onPlayHealth,
  bindNotes,
}: {
  selection: Selection;
  unit: CatalogueUnit;
  canEnhance: boolean;
  playMode: boolean;
  pathToGloryPackIds?: PathToGloryPackId[] | null;
  showBattleWounds?: boolean;
  onPatchSelection?: (selectionId: string, next: Selection) => void;
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
  onPickSpecial?: (tableId: string, selectionId: string) => void;
  onOpenDatasheet: (unit: CatalogueUnit) => void;
  onPlayHealth?: (selectionId: string, damage: number) => void;
  bindNotes?: CombatModifierNote[];
}) {
  const play = selectionPlayState(selection, unit);
  const warning = battleDamagedWarning(unit, play.damage);
  const displayName = selectionDisplayName(selection, unit);
  const extras =
    pathToGloryPackIds &&
    pathToGloryPackIds.length > 0 &&
    !playMode &&
    onPatchSelection ? (
      <PathToGloryUnitExtras
        selection={selection}
        unit={unit}
        packIds={pathToGloryPackIds}
        showBattleWounds={Boolean(showBattleWounds)}
        onChange={(next) => onPatchSelection(next.id, next)}
        onOpenDatasheet={onOpenDatasheet}
      />
    ) : null;
  const enhancements = (
    <SlotEnhancements
      selectionId={selection.id}
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
      onPickArtefact={canEnhance ? onPickArtefact : undefined}
      onPickTrait={canEnhance ? onPickTrait : undefined}
      onPickMonstrousTrait={onPickMonstrousTrait}
      onPickVision={onPickVision}
      specialTables={specialTables}
      specialEnhancementPicks={specialEnhancementPicks}
      onPickSpecial={
        onPickSpecial
          ? (tableId) => onPickSpecial(tableId, selection.id)
          : undefined
      }
    />
  );

  return (
    <li className="rounded-xl bg-parchment-ink/5 px-3 py-2.5">
      {playMode ? (
        <>
          <PlaySlotRow
            name={displayName}
            subtitle={battleStatLine(unit)}
            sheetLabel={`${unit.name} datasheet`}
            onOpenSheet={() => onOpenDatasheet(unit)}
            trailing={
              onPlayHealth ? (
                <PlayHealthTrack
                  aside
                  track={play}
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
          <PlayBindNotes selectionId={selection.id} notes={bindNotes} />
          {enhancements}
        </>
      ) : (
        <>
          <BuildSlotRow
            name={displayName}
            subtitle={battleStatLine(unit)}
            sheetLabel={`${unit.name} datasheet`}
            onOpenSheet={() => onOpenDatasheet(unit)}
          />
          {extras}
          {enhancements}
        </>
      )}
    </li>
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
    monstrousTrait:
      list.monstrousTrait && ids.has(list.monstrousTrait.heroSelectionId)
        ? null
        : list.monstrousTrait,
    visionOfFate:
      list.visionOfFate && ids.has(list.visionOfFate.heroSelectionId)
        ? null
        : list.visionOfFate,
    specialEnhancements: (list.specialEnhancements ?? []).filter(
      (pick) => !ids.has(pick.heroSelectionId),
    ),
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
