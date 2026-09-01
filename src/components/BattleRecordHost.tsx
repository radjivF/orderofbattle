"use client";

import { BattleRecordScreen } from "./BattleRecordScreen";

/** Battle record list stays in the library pane while a game slides in the detail pane. */
export function BattleRecordHost() {
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
