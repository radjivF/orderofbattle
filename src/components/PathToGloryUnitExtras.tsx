"use client";

import type { PathToGlorySelectionState, Selection } from "@/engine/types";
import {
  PATH_TO_GLORY_SCARS,
  PATH_TO_GLORY_WOUNDS,
  clampRenown,
  mergePathToGlory,
  pathsForPreset,
  rankForRenown,
  rankLabel,
  scarSeverityLabel,
} from "@/engine/pathToGlory";
import type { PathToGloryBattlepackPreset } from "@/engine/pathToGlory";

const fieldClass =
  "min-h-10 w-full rounded-lg bg-parchment-ink/5 px-2.5 text-sm text-parchment-ink";

type Props = {
  selection: Selection;
  warscrollName: string;
  preset: PathToGloryBattlepackPreset;
  showBattleWounds: boolean;
  onChange: (next: Selection) => void;
};

export function PathToGloryUnitExtras({
  selection,
  warscrollName,
  preset,
  showBattleWounds,
  onChange,
}: Props) {
  const state = selection.pathToGlory;
  const paths = pathsForPreset(preset);
  const rank = rankLabel(rankForRenown(state?.renown ?? 0));

  function patchPath(patch: Partial<PathToGlorySelectionState>) {
    onChange(mergePathToGlory(selection, patch));
  }

  return (
    <div
      className="mt-2 flex flex-col gap-2 rounded-xl bg-parchment-ink/5 px-3 py-2.5"
      onClick={(event) => event.stopPropagation()}
    >
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Name
        <input
          value={selection.nickname ?? ""}
          placeholder={warscrollName}
          onChange={(event) =>
            onChange({
              ...selection,
              nickname: event.target.value,
            })
          }
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
        Path
        <select
          value={state?.pathId ?? ""}
          onChange={(event) =>
            patchPath({ pathId: event.target.value || null })
          }
          className={fieldClass}
        >
          <option value="">None</option>
          {paths.map((path) => (
            <option key={path.id} value={path.id}>
              {path.name}
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
            onChange={(event) =>
              patchPath({
                renown: clampRenown(Number(event.target.value)),
              })
            }
            className={`${fieldClass} max-w-24`}
          />
          <span className="text-sm text-sheet-muted">{rank}</span>
        </span>
      </label>
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
