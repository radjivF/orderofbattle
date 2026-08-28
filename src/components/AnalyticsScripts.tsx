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

/**
 * Inject third-party analytics via DOM (not React <script> / next/script).
 * React 19 warns and skips execution for script tags rendered by components.
 * Skipped on localhost — Ahrefs logs "Ignoring Event: localhost" otherwise.
 * 
 * Ahrefs is cookie-less and always loads.
 * Clarity requires cookie consent and only loads if accepted.
 */
export function AnalyticsScripts() {
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

    if (getConsentStatus() === "accepted") {
      loadClarity();
    }

    const handleConsent = () => {
      loadClarity();
    };

    window.addEventListener("cookie-consent-accepted", handleConsent);

    return () => {
      window.removeEventListener("cookie-consent-accepted", handleConsent);
    };
  }, []);

  return null;
}
