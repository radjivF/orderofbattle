"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HOME_CTA_CLASS } from "@/lib/builderUi";
import { setConsentStatus, hasUserResponded } from "@/lib/cookieConsent";

const acceptClass = `${HOME_CTA_CLASS} pressable min-h-11 w-full rounded-xl px-4 text-sm font-semibold sm:min-w-[8.5rem]`;

const rejectClass =
  "pressable min-h-10 w-full rounded-xl px-3 text-sm font-medium text-sheet-muted transition-colors hover:text-parchment-ink/80 sm:min-w-[8.5rem]";

function AnalyticsGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-parchment-ink/80"
    >
      <path
        d="M6 18V9M12 18V6M18 18v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
    >
      <div className="cookie-consent-panel pointer-events-auto mx-auto w-full max-w-lg">
        <div className="parchment-card overflow-hidden rounded-2xl text-parchment-ink shadow-2xl ring-1 ring-parchment-ink/10">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
            <div className="flex min-w-0 flex-1 gap-3 sm:gap-3.5">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-parchment-ink/8 ring-1 ring-parchment-ink/10"
              >
                <AnalyticsGlyph />
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="font-serif text-lg leading-snug text-parchment-ink">
                  Analytics cookies
                </p>
                <p className="text-sm leading-relaxed text-sheet-muted">
                  Optional Microsoft Clarity cookies for usage stats and session
                  replay. Ahrefs runs without cookies.{" "}
                  <Link
                    href="/privacy"
                    className="text-aether underline decoration-aether/35 underline-offset-2"
                  >
                    Privacy policy
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5 sm:w-[8.75rem]">
              <button type="button" onClick={handleAccept} className={acceptClass}>
                Allow
              </button>
              <button type="button" onClick={handleReject} className={rejectClass}>
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
