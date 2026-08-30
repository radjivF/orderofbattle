import type {
  ArmyList,
  PathToGloryBattlepackPreset,
  PathToGloryPackId,
} from "../types";

export const PATH_TO_GLORY_PRESETS: {
  id: PathToGloryBattlepackPreset;
  label: string;
  hint: string;
}[] = [
  { id: "ascension", label: "Ascension", hint: "Core Paths only." },
  {
    id: "ravaged-coast",
    label: "Ravaged Coast",
    hint: "Includes Ascension.",
  },
  {
    id: "blighted-wilds",
    label: "Blighted Wilds",
    hint: "Includes Ascension and Ravaged Coast.",
  },
  {
    id: "all",
    label: "All together",
    hint: "Ascension, Ravaged Coast, and Blighted Wilds.",
  },
];

export function resolveBattlepacks(
  preset: PathToGloryBattlepackPreset,
): PathToGloryPackId[] {
  if (preset === "ascension") {
    return ["ascension"];
  }
  if (preset === "ravaged-coast") {
    return ["ascension", "ravaged-coast"];
  }
  return ["ascension", "ravaged-coast", "blighted-wilds"];
}

export function isPathToGloryList(list: ArmyList): boolean {
  return list.kind === "pathToGlory";
}

export function pathToGloryPreset(
  list: ArmyList,
): PathToGloryBattlepackPreset | null {
  if (!isPathToGloryList(list)) {
    return null;
  }
  return list.pathToGlory?.battlepackPreset ?? "ascension";
}

export function showsBattleWoundsAndScars(list: ArmyList): boolean {
  const preset = pathToGloryPreset(list);
  if (!preset) {
    return false;
  }
  return resolveBattlepacks(preset).includes("ravaged-coast");
}

export function battlepackPresetLabel(
  preset: PathToGloryBattlepackPreset,
): string {
  return PATH_TO_GLORY_PRESETS.find((item) => item.id === preset)?.label ?? preset;
}
