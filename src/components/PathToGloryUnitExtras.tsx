"use client";

import { useState, type ReactNode } from "react";
import type {
  CatalogueUnit,
  PathToGlorySelectionState,
  Selection,
} from "@/engine/types";
import {
  PATH_ABILITY_RANKS,
  PATH_TO_GLORY_SCARS,
  PATH_TO_GLORY_WOUNDS,
  clampRenown,
  findPath,
  isAnvilOfApotheosis,
  mergePathToGlory,
  pathOptionsForRank,
  pathsForPacks,
  pickPathOption,
  prunePathOptionIds,
  rankAbilityUnlocked,
  rankForRenown,
  rankLabel,
  renownToUnlockRank,
  scarSeverityLabel,
} from "@/engine/pathToGlory";
import type { PathToGloryPackId } from "@/engine/pathToGlory";
import { PathToGloryAnvilForge } from "./PathToGloryAnvilForge";
import { CollapseChevron } from "./ExpandableRuleCard";

const fieldClass =
  "min-h-10 w-full rounded-lg bg-parchment-ink/5 px-2.5 text-sm text-parchment-ink";

type Props = {
  selection: Selection;
  unit?: CatalogueUnit;
  packIds: PathToGloryPackId[];
  showBattleWounds: boolean;
  isWarlord?: boolean;
  canBeWarlord?: boolean;
  onChange: (next: Selection) => void;
  onToggleWarlord?: (selectionId: string) => void;
  onOpenDatasheet?: (unit: CatalogueUnit) => void;
};

export function PathToGlorySlot({
  enabled,
  selection,
  unit,
  packIds,
  showBattleWounds,
  isWarlord,
  canBeWarlord,
  onChange,
  onToggleWarlord,
  onOpenDatasheet,
  children,
}: {
  enabled: boolean;
  selection: Selection;
  unit?: CatalogueUnit;
  packIds: PathToGloryPackId[];
  showBattleWounds: boolean;
  isWarlord?: boolean;
  canBeWarlord?: boolean;
  onChange: (next: Selection) => void;
  onToggleWarlord?: (selectionId: string) => void;
  onOpenDatasheet?: (unit: CatalogueUnit) => void;
  children: (toggle: ReactNode) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = findPath(selection.pathToGlory?.pathId);
  const toggle = enabled ? (
    <button
      type="button"
      aria-expanded={open}
      aria-label="Campaign extras"
      onClick={(event) => {
        event.stopPropagation();
        setOpen((value) => !value);
      }}
      className="pressable inline-flex h-11 w-11 shrink-0 items-center justify-center text-sheet-muted"
    >
      <CollapseChevron open={open} />
    </button>
  ) : null;

  return (
    <>
      {children(toggle)}
      {enabled && !open && path ? (
        <p className="mt-1 px-1 text-sm text-sheet-muted">{path.name}</p>
      ) : null}
      {enabled && open ? (
        <PathToGloryUnitExtras
          selection={selection}
          unit={unit}
          packIds={packIds}
          showBattleWounds={showBattleWounds}
          isWarlord={isWarlord}
          canBeWarlord={canBeWarlord}
          onChange={onChange}
          onToggleWarlord={onToggleWarlord}
          onOpenDatasheet={onOpenDatasheet}
        />
      ) : null}
    </>
  );
}

export function PathToGloryUnitExtras({
  selection,
  unit,
  packIds,
  showBattleWounds,
  isWarlord,
  canBeWarlord,
  onChange,
  onToggleWarlord,
  onOpenDatasheet,
}: Props) {
  const state = selection.pathToGlory;
  const isHero = unit?.hero;
  const isWizard = unit?.categories.includes("WIZARD");
  const isPriest = unit?.categories.includes("PRIEST");
  const paths = pathsForPacks(packIds, isHero, isWizard, isPriest);
  const rank = rankLabel(rankForRenown(state?.renown ?? 0));
  const path = findPath(state?.pathId);
  const optionIds = prunePathOptionIds(
    path,
    state?.pathOptionIds,
    state?.renown ?? 0,
  );

  function patchPath(patch: Partial<PathToGlorySelectionState>) {
    onChange(mergePathToGlory(selection, patch));
  }

  return (
    <div
      className="mt-2 flex flex-col gap-2 px-1 py-1"
      onClick={(event) => event.stopPropagation()}
    >
      {canBeWarlord && onToggleWarlord ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isWarlord ?? false}
            onChange={() => onToggleWarlord(selection.id)}
            className="h-4 w-4 cursor-pointer"
          />
          <span className="font-medium text-sheet-muted">Warlord</span>
        </label>
      ) : null}
      {unit && isAnvilOfApotheosis(unit) ? (
        <PathToGloryAnvilForge
          selection={selection}
          unit={unit}
          onPatch={patchPath}
          onOpenDatasheet={onOpenDatasheet}
        />
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Path
        <select
          aria-label="Choose Path"
          value={state?.pathId ?? ""}
          onChange={(event) =>
            patchPath({
              pathId: event.target.value || null,
              pathOptionIds: [],
            })
          }
          className={fieldClass}
        >
          <option value="">None</option>
          {paths.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {path ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            Path abilities
          </p>
          {PATH_ABILITY_RANKS.map((abilityRank) => {
            const options = pathOptionsForRank(path, abilityRank);
            if (options.length === 0) {
              return null;
            }
            const unlocked = rankAbilityUnlocked(
              state?.renown ?? 0,
              abilityRank,
            );
            const heading = unlocked
              ? `${rankLabel(abilityRank)} · pick 1`
              : `${rankLabel(abilityRank)} · ${renownToUnlockRank(abilityRank)} renown`;
            return (
              <div key={abilityRank} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-sheet-muted">
                  {heading}
                </p>
                <div
                  role="group"
                  aria-label={heading}
                  className="grid grid-cols-2 gap-1.5"
                >
                  {options.map((option) => {
                    const checked = optionIds.includes(option.id);
                    const recap = [option.ability.timing, option.ability.effect]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={checked}
                        aria-label={
                          recap ? `${option.name}. ${recap}` : option.name
                        }
                        disabled={!unlocked}
                        onClick={() =>
                          patchPath({
                            pathOptionIds: pickPathOption(
                              path,
                              optionIds,
                              option.id,
                              state?.renown ?? 0,
                            ),
                          })
                        }
                        className={`rounded-lg px-2 py-2 text-left text-sm font-sans font-normal normal-case tracking-normal ${
                          unlocked
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        } ${
                          checked
                            ? "bg-aether/15 text-parchment-ink ring-1 ring-aether/40"
                            : "bg-parchment-ink/5 text-parchment-ink"
                        }`}
                      >
                        <span className="block leading-snug">{option.name}</span>
                        {option.ability.timing ? (
                          <span className="mt-0.5 block text-[11px] font-semibold tracking-wide uppercase text-sheet-muted">
                            {option.ability.timing}
                          </span>
                        ) : null}
                        {option.ability.effect ? (
                          <span className="mt-1 block text-xs leading-snug text-sheet-muted">
                            {option.ability.effect}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Renown
        <span className="flex items-center gap-2 font-sans font-normal normal-case tracking-normal">
          <input
            aria-label="Renown"
            type="number"
            min={0}
            max={99}
            value={state?.renown ?? 0}
            onChange={(event) => {
              const renown = clampRenown(Number(event.target.value));
              patchPath({
                renown,
                pathOptionIds: prunePathOptionIds(
                  path,
                  state?.pathOptionIds,
                  renown,
                ),
              });
            }}
            className={`${fieldClass} max-w-24`}
          />
          <span className="text-sm text-sheet-muted">{rank}</span>
        </span>
      </label>
      {showBattleWounds ? (
        <>
          <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            Battle Wounds
            <input
              aria-label="Battle Wounds"
              type="number"
              min={0}
              max={99}
              value={state?.battleWounds ?? 0}
              onChange={(event) =>
                patchPath({ battleWounds: Math.max(0, Number(event.target.value)) })
              }
              className={`${fieldClass} max-w-24`}
            />
          </label>
          {unit?.hero ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state?.battleWoundId === "drained"}
                onChange={(event) =>
                  patchPath({
                    battleWoundId: event.target.checked ? "drained" : null,
                  })
                }
                className="h-4 w-4 cursor-pointer"
              />
              <span className="font-medium text-sheet-muted">Drained</span>
            </label>
          ) : null}
          {packIds.some((id) => id === "ravaged-coast" || id === "blighted-wilds") ? (
            <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
              Scar
              <select
                aria-label="Scar"
                value={state?.scarId ?? ""}
                onChange={(event) =>
                  patchPath({ scarId: event.target.value || null })
                }
                className={fieldClass}
              >
                <option value="">None</option>
                {PATH_TO_GLORY_SCARS.map((scar) => (
                  <option key={scar.id} value={scar.id}>
                    {scarSeverityLabel(scar.severity)} · {scar.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
