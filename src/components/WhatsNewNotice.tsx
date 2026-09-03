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

  useEffect(() => {
    setSeenVersion(getSeenWhatsNewVersion());
    setAllowEmptyLibrary(
      typeof window !== "undefined" &&
        !isProductionHostname(window.location.hostname),
    );
    setReady(true);
  }, []);

  const visible =
    ready && shouldShowWhatsNew({ lists, seenVersion, allowEmptyLibrary });

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(() => {
      markWhatsNewSeen();
      setSeenVersion(getSeenWhatsNewVersion());
    }, WHATS_NEW_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

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
      <div className="ios-glass pointer-events-auto flex max-w-sm flex-col gap-2 rounded-lg px-3 py-2.5 shadow-lg">
        <p className="text-center text-xs leading-snug text-parchment/80">
          Score a live game from the menu. Scourge of Aqshy has fury dice now.
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={dismiss}
            className="pressable rounded-md px-2.5 py-1 text-xs text-parchment/60 transition-colors hover:text-parchment"
          >
            Dismiss
          </button>
          <Link
            href={UPDATES_PATH}
            onClick={dismiss}
            className="pressable rounded-md bg-parchment px-3 py-1 text-xs font-medium text-parchment-ink"
          >
            See
          </Link>
        </div>
      </div>
    </div>
  );
}
