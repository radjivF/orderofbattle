"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  getActiveMenuServerSnapshot,
  getActiveMenuSnapshot,
  setActiveMenu,
  subscribeActiveMenu,
} from "@/lib/activeMenu";
import { AppMenuSheet } from "./AppMenuSheet";
import { isBattleRecordPath } from "./BattleRecordHost";
import { IosNavMenuButton } from "./ios/IosNavIconButton";

export function AppHeaderMenu() {
  const pathname = usePathname();
  const storedMenu = useSyncExternalStore(
    subscribeActiveMenu,
    getActiveMenuSnapshot,
    getActiveMenuServerSnapshot,
  );
  const menu = isBattleRecordPath(pathname) ? "tactics" : storedMenu;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <IosNavMenuButton
        label="Open menu"
        onClick={() => setOpen(true)}
      />
      {open ? (
        <AppMenuSheet
          active={menu}
          onSelect={setActiveMenu}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
