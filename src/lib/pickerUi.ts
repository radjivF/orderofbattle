import type { CatalogueUnit } from "@/engine/types";

/** Case-insensitive name filter for unit picker sheets. */
export function filterPickerUnits(
  units: CatalogueUnit[],
  query: string,
): CatalogueUnit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return units;
  }
  return units.filter((unit) => unit.name.toLowerCase().includes(needle));
}

/** Show the discreet search toggle from this count up (always hidden for 0–1 units). */
export const PICKER_SEARCH_MIN_UNITS = 2;

/** Picker header — matches in-app card top rhythm (p-5) below the sheet grabber. */
export const PICKER_SHEET_HEADER_CLASS =
  "flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-3 sm:pt-5";

export const PICKER_SEARCH_TOGGLE_CLASS =
  "pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-parchment-ink/55";
