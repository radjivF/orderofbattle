import type { ArmyList } from "./types";
import { normalizeArmyList } from "./listFactories";
import { isTowList, normalizeTowList } from "./tow/listFactories";
import type { TowList } from "./tow/types";

export type StoredList = ArmyList | TowList;

export { isTowList };

export function listGame(list: StoredList): "aos" | "tow" {
  return isTowList(list) ? "tow" : "aos";
}

export function normalizeStoredList(list: StoredList): StoredList {
  if (list.game === "tow") {
    return normalizeTowList(list as TowList);
  }
  return normalizeArmyList(list);
}
