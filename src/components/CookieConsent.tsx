"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setConsentStatus, hasUserResponded } from "@/lib/cookieConsent";

const acceptClass =
  "ios-liquid-glass pressable inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-xl px-6 text-[15px] font-semibold text-black";

const rejectClass =
  "pressable inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-xl px-5 text-sm font-medium text-parchment/75 ring-1 ring-parchment/20 transition-colors hover:bg-parchment/5 hover:text-parchment";

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
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-parchment/15 bg-ink/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 py-5 text-center sm:px-6">
        <div className="space-y-2">
          <p className="font-serif text-lg leading-snug text-parchment sm:text-xl">
            Cookies for analytics
          </p>
          <p className="text-sm leading-relaxed text-parchment/80">
            We use cookies so Microsoft Clarity can measure usage and session
            replay to improve the app. Ahrefs analytics runs without cookies.
            {" "}
            <Link
              href="/privacy"
              className="text-sigmarite underline decoration-sigmarite/40 underline-offset-2 transition-colors hover:text-sigmarite-hover"
            >
              Privacy policy
            </Link>
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button type="button" onClick={handleReject} className={rejectClass}>
            Reject
          </button>
          <button type="button" onClick={handleAccept} className={acceptClass}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
