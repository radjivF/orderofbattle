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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-parchment/20 bg-obsidian/95 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
        <p className="text-sm text-parchment/80">We use cookies.</p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="px-3 py-1.5 text-sm text-parchment/60 transition-colors hover:text-parchment"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-parchment/90 px-4 py-1.5 text-sm font-medium text-obsidian transition-colors hover:bg-parchment"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
