"use client";

import { getUnit, selectionPoints } from "@/engine/queries";
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
import { IosTrashIcon } from "./ios/SheetIconButton";
import { SlotEnhancements, SlotLine } from "./RegimentCardSlots";
import { PathToGloryUnitExtras } from "./PathToGloryUnitExtras";
import type { PathToGloryPackId } from "@/engine/pathToGlory";
import { selectionDisplayName } from "@/engine/pathToGlory";

export { PlayHealthTrack } from "./PlayHealthTrack";
export { PlayBindNotes, SlotEnhancements, SlotMoreMenu } from "./RegimentCardSlots";

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
  pathToGloryPackIds?: PathToGloryPackId[] | null;
  showBattleWounds?: boolean;
  onPatchSelection?: (selectionId: string, next: Selection) => void;
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
  pathToGloryPackIds = null,
  showBattleWounds = false,
  onPatchSelection,
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
            {hero
              ? selectionDisplayName(regiment.hero ?? undefined, hero)
              : "Empty regiment"}
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
            points={selectionPoints(hero, false, regiment.hero)}
            playMode={playMode}
            hidePoints={locked}
            bindNotes={bindNotes}
            onReplace={locked ? undefined : onPickHero}
            onOpenDatasheet={() => onOpenDatasheet(hero)}
            onPlayHealth={onPlayHealth}
          />
          {pathToGloryPackIds &&
          pathToGloryPackIds.length > 0 &&
          selected &&
          !playMode &&
          regiment.hero &&
          onPatchSelection ? (
            <PathToGloryUnitExtras
              selection={regiment.hero}
              unit={hero}
              packIds={pathToGloryPackIds}
              showBattleWounds={showBattleWounds}
              onChange={(next) => onPatchSelection(next.id, next)}
            />
          ) : null}
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
                points={selectionPoints(unit, slot.reinforced, slot)}
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
              {pathToGloryPackIds &&
              pathToGloryPackIds.length > 0 &&
              selected &&
              !playMode &&
              onPatchSelection ? (
                <PathToGloryUnitExtras
                  selection={slot}
                  unit={unit}
                  packIds={pathToGloryPackIds}
                  showBattleWounds={showBattleWounds}
                  onChange={(next) => onPatchSelection(next.id, next)}
                />
              ) : null}
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
