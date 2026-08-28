"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setConsentStatus, hasUserResponded } from "@/lib/cookieConsent";

type Props = {
  consentRequired: boolean;
};

export function CookieConsent({ consentRequired }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (consentRequired && !hasUserResponded()) {
      setShow(true);
    }
  }, [consentRequired]);

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
    <div
      role="region"
      aria-label="Cookie consent"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div className="ios-glass pointer-events-auto flex max-w-sm flex-col gap-2 rounded-lg px-3 py-2.5 shadow-lg">
        <p className="text-center text-xs leading-snug text-parchment/80">
          We use cookies.{" "}
          <Link
            href="/privacy"
            className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2"
          >
            Privacy
          </Link>
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleReject}
            className="pressable rounded-md px-2.5 py-1 text-xs text-parchment/60 transition-colors hover:text-parchment"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="pressable rounded-md bg-parchment px-3 py-1 text-xs font-medium text-parchment-ink"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
