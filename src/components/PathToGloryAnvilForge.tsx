"use client";

import type { CatalogueUnit, Selection } from "@/engine/types";
import {
  anvilDestinyBudget,
  anvilDestinyRemaining,
  anvilForgeGroups,
  anvilPickIds,
  isAnvilOfApotheosis,
  pickAnvilOption,
} from "@/engine/pathToGlory";

const fieldClass =
  "min-h-10 w-full rounded-lg bg-parchment-ink/5 px-2.5 text-sm text-parchment-ink";

type Props = {
  selection: Selection;
  unit: CatalogueUnit;
  onPicks: (anvilPickIds: string[]) => void;
};

function destinyLabel(optionDestiny: number): string {
  if (optionDestiny < 0) {
    return ` · ${-optionDestiny} dest`;
  }
  if (optionDestiny > 0) {
    return ` · +${optionDestiny} dest`;
  }
  return "";
}

export function PathToGloryAnvilForge({ selection, unit, onPicks }: Props) {
  const groups = anvilForgeGroups(unit);
  if (!isAnvilOfApotheosis(unit) || groups.length === 0) {
    return null;
  }
  const pickIds = anvilPickIds(selection);
  const picked = new Set(pickIds);
  const budget = anvilDestinyBudget(unit, selection);
  const remaining = anvilDestinyRemaining(unit, selection);

  return (
    <>
      <p
        className={`text-xs font-semibold tracking-wide uppercase ${
          remaining < 0 ? "text-red-800" : "text-sheet-muted"
        }`}
      >
        Destiny {remaining} / {budget}
      </p>
      {groups.map((group) => {
        const selectedId =
          group.options.find((option) => picked.has(option.id))?.id ?? "";
        if (group.max === 1) {
          return (
            <label
              key={group.id}
              className="flex flex-col gap-1 text-xs font-semibold tracking-wide uppercase text-sheet-muted"
            >
              {group.name}
              <select
                value={selectedId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (!nextId) {
                    onPicks(
                      pickIds.filter(
                        (id) =>
                          !group.options.some((option) => option.id === id),
                      ),
                    );
                    return;
                  }
                  onPicks(pickAnvilOption(unit, pickIds, group.id, nextId));
                }}
                className={fieldClass}
              >
                {group.min < 1 ? <option value="">None</option> : (
                  <option value="">Pick</option>
                )}
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {destinyLabel(option.destiny)}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <div key={group.id} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-wide uppercase text-sheet-muted">
              {group.name}
            </p>
            {group.options.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm font-sans font-normal normal-case tracking-normal"
              >
                <input
                  type="checkbox"
                  checked={picked.has(option.id)}
                  onChange={() =>
                    onPicks(pickAnvilOption(unit, pickIds, group.id, option.id))
                  }
                  aria-label={option.name}
                  className="mt-0.5 size-4 shrink-0 accent-aether"
                />
                <span className="min-w-0 text-parchment-ink">
                  {option.name}
                  {destinyLabel(option.destiny)}
                </span>
              </label>
            ))}
          </div>
        );
      })}
    </>
  );
}
