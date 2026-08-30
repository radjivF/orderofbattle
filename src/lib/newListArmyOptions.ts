import {
  armyOfRenownName,
  getFaction,
  listArmiesOfRenown,
} from "@/engine/queries";
import { listSpearheadsForFaction } from "@/engine/spearhead";
import {
  PATH_TO_GLORY_PRESETS,
  type PathToGloryBattlepackPreset,
} from "@/engine/pathToGlory";

export const SPEARHEAD_VALUE_PREFIX = "spearhead:";
export const PATH_TO_GLORY_VALUE_PREFIX = "pathToGlory:";

export type NewListArmySelectValue =
  | { kind: "matched"; factionId: string }
  | { kind: "spearhead"; spearheadId: string }
  | {
      kind: "pathToGlory";
      factionId: string;
      battlepackPreset: PathToGloryBattlepackPreset;
    };

export type NewListArmySelectGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export function encodeNewListArmyValue(value: NewListArmySelectValue): string {
  if (value.kind === "spearhead") {
    return `${SPEARHEAD_VALUE_PREFIX}${value.spearheadId}`;
  }
  if (value.kind === "pathToGlory") {
    return `${PATH_TO_GLORY_VALUE_PREFIX}${value.battlepackPreset}:${value.factionId}`;
  }
  return value.factionId;
}

export function parseNewListArmyValue(raw: string): NewListArmySelectValue {
  if (raw.startsWith(SPEARHEAD_VALUE_PREFIX)) {
    return {
      kind: "spearhead",
      spearheadId: raw.slice(SPEARHEAD_VALUE_PREFIX.length),
    };
  }
  if (raw.startsWith(PATH_TO_GLORY_VALUE_PREFIX)) {
    const rest = raw.slice(PATH_TO_GLORY_VALUE_PREFIX.length);
    const split = rest.indexOf(":");
    const battlepackPreset = (
      split === -1 ? rest : rest.slice(0, split)
    ) as PathToGloryBattlepackPreset;
    const factionId = split === -1 ? "" : rest.slice(split + 1);
    return { kind: "pathToGlory", factionId, battlepackPreset };
  }
  return { kind: "matched", factionId: raw };
}

export function newListArmySelectGroups(
  parentFactionId: string,
  armyFactionId = parentFactionId,
): NewListArmySelectGroup[] {
  const parent = getFaction(parentFactionId);
  if (!parent) {
    return [];
  }
  const groups: NewListArmySelectGroup[] = [
    {
      label: parent.name,
      options: [{ value: parent.id, label: parent.name }],
    },
  ];
  const armiesOfRenown = listArmiesOfRenown(parentFactionId);
  if (armiesOfRenown.length > 0) {
    groups.push({
      label: "Army of Renown",
      options: armiesOfRenown.map((army) => ({
        value: army.id,
        label: armyOfRenownName(army),
      })),
    });
  }
  const spearheads = listSpearheadsForFaction(parentFactionId);
  if (spearheads.length > 0) {
    groups.push({
      label: "Spearhead",
      options: spearheads.map((box) => ({
        value: encodeNewListArmyValue({
          kind: "spearhead",
          spearheadId: box.id,
        }),
        label: box.name,
      })),
    });
  }
  groups.push({
    label: "Path to Glory",
    options: PATH_TO_GLORY_PRESETS.map((preset) => ({
      value: encodeNewListArmyValue({
        kind: "pathToGlory",
        factionId: armyFactionId,
        battlepackPreset: preset.id,
      }),
      label: preset.hint.startsWith("Includes")
        ? `${preset.label} (${preset.hint.replace(/\.$/, "")})`
        : preset.label,
    })),
  });
  return groups;
}

export function newListArmySelectHasExtras(parentFactionId: string): boolean {
  return newListArmySelectGroups(parentFactionId).length > 1;
}
