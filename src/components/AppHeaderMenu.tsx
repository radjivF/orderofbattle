"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  getActiveMenuServerSnapshot,
  getActiveMenuSnapshot,
  menuIdForPathname,
  setActiveMenu,
  subscribeActiveMenu,
} from "@/lib/activeMenu";
import { useLeftEdgeSwipe } from "@/lib/edgeSwipe";
import { AppMenuSheet } from "./AppMenuSheet";
import { IosNavMenuButton } from "./ios/IosNavIconButton";

export function AppHeaderMenu() {
  const pathname = usePathname();
  const storedMenu = useSyncExternalStore(
    subscribeActiveMenu,
    getActiveMenuSnapshot,
    getActiveMenuServerSnapshot,
  );
  const menu = menuIdForPathname(pathname, storedMenu);
  const [open, setOpen] = useState(false);

  useLeftEdgeSwipe(() => setOpen(true));

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
