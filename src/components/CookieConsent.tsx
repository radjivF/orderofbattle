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
    <div className="fixed bottom-4 right-4 z-50 rounded border border-parchment/10 bg-obsidian/80 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <p className="text-xs text-parchment/60">We use cookies.</p>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="rounded border border-parchment/10 px-2 py-1 text-xs text-parchment/50 transition-colors hover:border-parchment/20 hover:text-parchment/70"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="rounded border border-parchment/20 px-2 py-1 text-xs text-parchment/70 transition-colors hover:border-parchment/30 hover:text-parchment"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
