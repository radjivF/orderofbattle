"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { WHATS_NEW_BANNER_CLASS } from "@/lib/builderUi";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { UPDATES_PATH } from "@/lib/updatesPage";
import {
  WHATS_NEW_AUTO_DISMISS_MS,
  WHATS_NEW_AUTO_DISMISS_MS_DESKTOP,
  getSeenWhatsNewVersion,
  markWhatsNewSeen,
  shouldShowWhatsNew,
} from "@/lib/whatsNew";

function isProductionHostname(hostname: string): boolean {
  return (
    hostname === "orderofbattle.app" || hostname === "www.orderofbattle.app"
  );
}

export function WhatsNewNotice() {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [seenVersion, setSeenVersion] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [allowEmptyLibrary, setAllowEmptyLibrary] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setSeenVersion(getSeenWhatsNewVersion());
    setAllowEmptyLibrary(
      typeof window !== "undefined" &&
        !isProductionHostname(window.location.hostname),
    );
    if (typeof window !== "undefined") {
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    }
    setReady(true);
  }, []);

  const visible =
    ready && shouldShowWhatsNew({ lists, seenVersion, allowEmptyLibrary });

  useEffect(() => {
    if (!visible) {
      return;
    }
    const dismissMs = isDesktop
      ? WHATS_NEW_AUTO_DISMISS_MS_DESKTOP
      : WHATS_NEW_AUTO_DISMISS_MS;
    const timer = window.setTimeout(() => {
      markWhatsNewSeen();
      setSeenVersion(getSeenWhatsNewVersion());
    }, dismissMs);
    return () => window.clearTimeout(timer);
  }, [visible, isDesktop]);

  function dismiss() {
    markWhatsNewSeen();
    setSeenVersion(getSeenWhatsNewVersion());
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="What's new"
      className={WHATS_NEW_BANNER_CLASS}
    >
      <div className="ios-glass pointer-events-auto flex max-w-sm flex-col gap-2 rounded-lg px-3 py-2.5 shadow-lg md:max-w-lg md:px-4 md:py-3">
        <p className="text-center text-xs leading-snug text-parchment/80 md:text-sm">
          Score a live game from the menu. Scourge of Aqshy has fury dice now.
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={dismiss}
            className="pressable rounded-md px-2.5 py-1 text-xs text-parchment/60 transition-colors hover:text-parchment md:px-3 md:py-1.5 md:text-sm"
          >
            Dismiss
          </button>
          <Link
            href={UPDATES_PATH}
            onClick={dismiss}
            className="pressable rounded-md bg-parchment px-3 py-1 text-xs font-medium text-parchment-ink md:px-4 md:py-1.5 md:text-sm"
          >
            See
          </Link>
        </div>
      </div>
    </div>
  );
}
