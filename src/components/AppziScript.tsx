"use client";

import { useEffect } from "react";
import {
  appziScriptSrc,
  getAppziToken,
  isAppziConsentAllowed,
  shouldLoadAppzi,
} from "@/lib/appziConfig";
import { getConsentStatus } from "@/lib/cookieConsent";

function loadAppzi(token: string) {
  if (document.querySelector('script[data-appzi="widget"]')) return;

  const script = document.createElement("script");
  script.src = appziScriptSrc(token);
  script.async = true;
  script.dataset.appzi = "widget";
  document.head.appendChild(script);
}

/**
 * Inject Appzi via DOM (not React <script> / next/script).
 * Uses strict.js so the existing CSP can allow the widget.
 * Skipped on localhost / development — same gate as analytics.
 * Loads immediately outside consent regions; elsewhere only after accept.
 */
export function AppziScript({ consentRequired }: { consentRequired: boolean }) {
  useEffect(() => {
    const token = getAppziToken();
    if (!token || !shouldLoadAppzi(window.location.hostname, undefined, token)) {
      return;
    }

    const inject = () => {
      loadAppzi(token);
    };

    if (isAppziConsentAllowed(consentRequired, getConsentStatus())) {
      inject();
    }

    if (!consentRequired) {
      return;
    }

    window.addEventListener("cookie-consent-accepted", inject);
    return () => {
      window.removeEventListener("cookie-consent-accepted", inject);
    };
  }, [consentRequired]);

  return null;
}
