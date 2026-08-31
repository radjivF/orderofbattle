"use client";

import { usePathname } from "next/navigation";
import { BattleRecordGameScreen } from "./BattleRecordGameScreen";
import { BattleRecordScreen } from "./BattleRecordScreen";

/** Renders Battle record inside the list-flow library pane. */
export function BattleRecordHost() {
  const pathname = usePathname();
  const match = pathname.match(/^\/battle-record\/([^/]+)/);
  const gameId = match?.[1];

  if (gameId) {
    return <BattleRecordGameScreen gameId={gameId} />;
  }

  return <BattleRecordScreen />;
}

export function isBattleRecordPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }
  return (
    pathname === "/battle-record" || pathname.startsWith("/battle-record/")
  );
}
