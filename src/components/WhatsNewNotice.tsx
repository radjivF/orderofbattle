"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WHATS_NEW_BANNER_CLASS } from "@/lib/builderUi";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import {
  WHATS_NEW_AUTO_DISMISS_MS,
  WHATS_NEW_EXPANDED_DISMISS_MS,
  WHATS_NEW_ITEMS,
  getSeenWhatsNewVersion,
  markWhatsNewSeen,
  shouldShowWhatsNew,
} from "@/lib/whatsNew";

export function WhatsNewNotice() {
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const [seenVersion, setSeenVersion] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setSeenVersion(getSeenWhatsNewVersion());
    setReady(true);
  }, []);

  const visible =
    ready && shouldShowWhatsNew({ lists, seenVersion });

  useEffect(() => {
    if (!visible) {
      return;
    }
    const ms = expanded
      ? WHATS_NEW_EXPANDED_DISMISS_MS
      : WHATS_NEW_AUTO_DISMISS_MS;
    const timer = window.setTimeout(() => {
      markWhatsNewSeen();
      setSeenVersion(getSeenWhatsNewVersion());
    }, ms);
    return () => window.clearTimeout(timer);
  }, [visible, expanded]);

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
          We fixed a few bugs. Want to see?
        </p>
        {expanded ? (
          <ul className="list-disc space-y-1 pl-4 text-left text-xs leading-snug text-parchment/80">
            {WHATS_NEW_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={dismiss}
            className="pressable rounded-md px-2.5 py-1 text-xs text-parchment/60 transition-colors hover:text-parchment"
          >
            Dismiss
          </button>
          {expanded ? null : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="pressable rounded-md bg-parchment px-3 py-1 text-xs font-medium text-parchment-ink"
            >
              See
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
