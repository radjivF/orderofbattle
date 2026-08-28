import type { ArmyList, FactionCatalogue } from "@/engine/types";

export type BuilderChromeValue = {
  list: ArmyList;
  faction: FactionCatalogue;
  playMode: boolean;
  setPlayMode: (value: boolean) => void;
  onListNameChange: (name: string) => void;
  points: number;
  pointsCap: number;
  drops: number;
  issue: { text: string; tone: "ok" | "warn" | "bad" };
};
