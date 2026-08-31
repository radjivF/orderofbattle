"use client";

import { useSyncExternalStore } from "react";
import { isTowList } from "@/engine/storedList";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { BuilderScreen } from "./BuilderScreen";
import { TowBuilderScreen } from "./TowBuilderScreen";

type Props = {
  listId: string;
};

export function ListScreen({ listId }: Props) {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const list = lists?.find((item) => item.id === listId);
  if (list && isTowList(list)) {
    return <TowBuilderScreen listId={listId} />;
  }
  return <BuilderScreen listId={listId} />;
}
