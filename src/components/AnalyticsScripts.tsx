"use client";

import { useEffect } from "react";
import { shouldLoadAnalytics } from "@/lib/analyticsEnv";
import { getConsentStatus } from "@/lib/cookieConsent";

const AHREFS_KEY = "lAHSqQ1oPzAYiQnF/4yUWQ";
const CLARITY_ID = "y8rbeg2r71";

function loadClarity() {
  if (document.querySelector('script[data-analytics="clarity"]')) return;

  const w = window as Window & {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  };
  w.clarity =
    w.clarity ||
    function (...args: unknown[]) {
      (w.clarity!.q = w.clarity!.q || []).push(args);
    };
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  tag.dataset.analytics = "clarity";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(tag, first);
}

function loadAppzi() {
  const token = process.env.NEXT_PUBLIC_APPZI_TOKEN;
  if (!token) return;

  if (document.querySelector('script[data-analytics="appzi"]')) return;

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://w.appzi.io/w.js?token=${token}`;
  tag.dataset.analytics = "appzi";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(tag, first);
}

/**
 * Inject third-party analytics via DOM (not React <script> / next/script).
 * React 19 warns and skips execution for script tags rendered by components.
 * Skipped on localhost — Ahrefs logs "Ignoring Event: localhost" otherwise.
 *
 * Ahrefs is cookie-less and always loads.
 * Clarity and Appzi load immediately outside consent regions; elsewhere only after accept.
 */
export function AnalyticsScripts({ consentRequired }: { consentRequired: boolean }) {
  useEffect(() => {
    if (!shouldLoadAnalytics(window.location.hostname)) {
      return;
    }

    if (!document.querySelector('script[data-analytics="ahrefs"]')) {
      const ahrefs = document.createElement("script");
      ahrefs.src = "https://analytics.ahrefs.com/analytics.js";
      ahrefs.async = true;
      ahrefs.dataset.key = AHREFS_KEY;
      ahrefs.dataset.analytics = "ahrefs";
      document.head.appendChild(ahrefs);
    }

    const clarityAllowed =
      !consentRequired || getConsentStatus() === "accepted";

    if (clarityAllowed) {
      loadClarity();
      loadAppzi();
    }

    const handleConsent = () => {
      loadClarity();
      loadAppzi();
    };

    if (consentRequired) {
      window.addEventListener("cookie-consent-accepted", handleConsent);

      return () => {
        window.removeEventListener("cookie-consent-accepted", handleConsent);
      };
    }
  }, [consentRequired]);

  return null;
}
