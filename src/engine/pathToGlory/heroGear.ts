import type { ArmyList, Selection } from "../types";
import { isPathToGloryList } from "./packs";

function listLevelOptionId(
  list: ArmyList,
  selectionId: string,
  field: "artefact" | "heroicTrait",
): string | null {
  const pick = list[field];
  if (pick?.heroSelectionId !== selectionId) {
    return null;
  }
  return pick.optionId;
}

export function selectionArtefactOptionId(
  list: ArmyList,
  selection: Selection,
): string | null {
  if (isPathToGloryList(list)) {
    return (
      selection.pathToGlory?.artefactId ??
      listLevelOptionId(list, selection.id, "artefact")
    );
  }
  return listLevelOptionId(list, selection.id, "artefact");
}

export function selectionHeroicTraitOptionId(
  list: ArmyList,
  selection: Selection,
): string | null {
  if (isPathToGloryList(list)) {
    return (
      selection.pathToGlory?.heroicTraitId ??
      listLevelOptionId(list, selection.id, "heroicTrait")
    );
  }
  return listLevelOptionId(list, selection.id, "heroicTrait");
}
