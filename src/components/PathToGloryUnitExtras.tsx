"use client";

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

const fieldClass =
  "min-h-10 w-full rounded-lg bg-parchment-ink/5 px-2.5 text-sm text-parchment-ink";

type Props = {
  selection: Selection;
  unit?: CatalogueUnit;
  packIds: PathToGloryPackId[];
  showBattleWounds: boolean;
  onChange: (next: Selection) => void;
};

export function PathToGloryUnitExtras({
  selection,
  unit,
  packIds,
  showBattleWounds,
  onChange,
}: Props) {
  const state = selection.pathToGlory;
  const paths = pathsForPacks(packIds);
  const rank = rankLabel(rankForRenown(state?.renown ?? 0));
  const anvilRanks = unit?.anvilRanks ?? [];
  const showAnvilRank = Boolean(
    unit && isAnvilOfApotheosis(unit) && anvilRanks.length,
  );
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
      className="mt-2 flex flex-col gap-2 rounded-xl bg-parchment-ink/5 px-3 py-2.5"
      onClick={(event) => event.stopPropagation()}
    >
      {showAnvilRank ? (
        <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
          Hero rank
          <select
            value={state?.anvilRankId ?? anvilRanks[0]?.id ?? ""}
            onChange={(event) =>
              patchPath({ anvilRankId: event.target.value || null })
            }
            className={fieldClass}
          >
            {anvilRanks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.points} pts
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {unit && isAnvilOfApotheosis(unit) ? (
        <PathToGloryAnvilForge
          selection={selection}
          unit={unit}
          onPicks={(anvilPickIds) => patchPath({ anvilPickIds })}
        />
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Path
        <select
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
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Renown
        <span className="flex items-center gap-2 font-sans font-normal normal-case tracking-normal">
          <input
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
            return (
              <div key={abilityRank} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-sheet-muted">
                  {rankLabel(abilityRank)}
                  {unlocked
                    ? " · pick 1"
                    : ` · ${renownToUnlockRank(abilityRank)} renown`}
                </p>
                {options.map((option) => {
                  const checked = optionIds.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm font-sans font-normal normal-case tracking-normal ${
                        unlocked
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!unlocked}
                        onChange={() =>
                          patchPath({
                            pathOptionIds: pickPathOption(
                              path,
                              optionIds,
                              option.id,
                              state?.renown ?? 0,
                            ),
                          })
                        }
                        aria-label={option.name}
                        className="mt-0.5 size-4 shrink-0 accent-aether"
                      />
                      <span className="min-w-0">
                        <span className="block text-parchment-ink">
                          {option.name}
                        </span>
                        {option.ability.timing ? (
                          <span className="block text-xs text-sheet-muted">
                            {option.ability.timing}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
      {showBattleWounds ? (
        <>
          <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            Battle Wound
            <select
              value={state?.battleWoundId ?? ""}
              onChange={(event) =>
                patchPath({ battleWoundId: event.target.value || null })
              }
              className={fieldClass}
            >
              <option value="">None</option>
              {PATH_TO_GLORY_WOUNDS.map((wound) => (
                <option key={wound.id} value={wound.id}>
                  {wound.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
            Scar
            <select
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
        </>
      ) : null}
    </div>
  );
}
