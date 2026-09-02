"use client";

import {
  PATH_TO_GLORY_PACKS,
  togglePathToGloryPack,
  type PathToGloryPackId,
} from "@/engine/pathToGlory";
import {
  SHEET_CHECKLIST_ITEM_CLASS,
  SHEET_CHECKLIST_ITEM_SELECTED_CLASS,
} from "@/lib/builderUi";

type Props = {
  packIds: PathToGloryPackId[];
  onChange: (packIds: PathToGloryPackId[]) => void;
  variant: "parchment" | "ink";
};

export function PathToGloryBattlepackPicker({
  packIds,
  onChange,
  variant,
}: Props) {
  const ink = variant === "ink";

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend
        className={
          ink
            ? "text-sm text-parchment/80"
            : "text-base text-sheet-muted"
        }
      >
        Battlepack
      </legend>
      <ul className="flex flex-col gap-2">
        {PATH_TO_GLORY_PACKS.map((pack) => {
          const checked = packIds.includes(pack.id);
          const itemClass = ink
            ? `flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 ring-1 transition ${
                checked
                  ? "bg-aether/15 ring-aether/40"
                  : "bg-parchment/5 ring-parchment/10"
              }`
            : `${SHEET_CHECKLIST_ITEM_CLASS} ${
                checked ? SHEET_CHECKLIST_ITEM_SELECTED_CLASS : ""
              }`;
          return (
            <li key={pack.id}>
              <label className={itemClass}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(togglePathToGloryPack(packIds, pack.id))
                  }
                  aria-label={pack.label}
                  className="mt-0.5 size-5 shrink-0 accent-aether"
                />
                <span
                  className={
                    ink
                      ? "font-medium text-parchment"
                      : "font-medium text-parchment-ink"
                  }
                >
                  {pack.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
