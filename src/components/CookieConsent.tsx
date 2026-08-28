"use client";

import { useEffect, useState } from "react";
import { setConsentStatus, hasUserResponded } from "@/lib/cookieConsent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasUserResponded()) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    setConsentStatus("accepted");
    setShow(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-accepted"));
  };

  const handleReject = () => {
    setConsentStatus("rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-parchment/20 bg-obsidian/95 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-parchment/90">
          Analytics and session replay (Microsoft Clarity) only run if you
          accept.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="rounded border border-parchment/20 px-4 py-2 text-sm text-parchment/70 transition-colors hover:border-parchment/40 hover:text-parchment"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-sigmarite px-4 py-2 text-sm font-medium text-obsidian transition-colors hover:bg-sigmarite/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
