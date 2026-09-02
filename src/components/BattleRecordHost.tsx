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

export function isCoreRulesPath(pathname: string | null | undefined): boolean {
  return pathname === "/core-rules";
}

export function isScourgeRulesPath(pathname: string | null | undefined): boolean {
  return pathname === "/scourge-rules";
}
