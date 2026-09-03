"use client";

import { useEffect } from "react";
import { shouldLoadAnalytics, shouldLoadClarity } from "@/lib/analyticsEnv";
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
  tag.src = `https://w.appzi.io/strict.js?token=${token}`;
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
 * Clarity uses explicit allowlist (production only, no staging/preview/localhost).
 * Appzi load immediately outside consent regions; elsewhere only after accept.
 */
export function AnalyticsScripts({ consentRequired }: { consentRequired: boolean }) {
  useEffect(() => {
    const hostname = window.location.hostname;

    if (shouldLoadAnalytics(hostname)) {
      if (!document.querySelector('script[data-analytics="ahrefs"]')) {
        const ahrefs = document.createElement("script");
        ahrefs.src = "https://analytics.ahrefs.com/analytics.js";
        ahrefs.async = true;
        ahrefs.dataset.key = AHREFS_KEY;
        ahrefs.dataset.analytics = "ahrefs";
        document.head.appendChild(ahrefs);
      }
    }

    const clarityHostAllowed = shouldLoadClarity(hostname);
    const clarityConsentAllowed =
      !consentRequired || getConsentStatus() === "accepted";

    if (clarityHostAllowed && clarityConsentAllowed) {
      loadClarity();
    }

    if (shouldLoadAnalytics(hostname) && clarityConsentAllowed) {
      loadAppzi();
    }

    const handleConsent = () => {
      if (clarityHostAllowed) {
        loadClarity();
      }
      if (shouldLoadAnalytics(hostname)) {
        loadAppzi();
      }
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
