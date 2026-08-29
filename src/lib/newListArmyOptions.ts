import {
  armyOfRenownName,
  getFaction,
  listArmiesOfRenown,
} from "@/engine/queries";
import { listSpearheadsForFaction } from "@/engine/spearhead";

export const SPEARHEAD_VALUE_PREFIX = "spearhead:";

export type NewListArmySelectValue =
  | { kind: "matched"; factionId: string }
  | { kind: "spearhead"; spearheadId: string };

export type NewListArmySelectGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export function encodeNewListArmyValue(value: NewListArmySelectValue): string {
  if (value.kind === "spearhead") {
    return `${SPEARHEAD_VALUE_PREFIX}${value.spearheadId}`;
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
  return { kind: "matched", factionId: raw };
}

export function newListArmySelectGroups(
  parentFactionId: string,
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
  return groups;
}

export function newListArmySelectHasExtras(parentFactionId: string): boolean {
  return newListArmySelectGroups(parentFactionId).length > 1;
}
