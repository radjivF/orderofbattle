"use client";

import { useEffect } from "react";

const AHREFS_KEY = "lAHSqQ1oPzAYiQnF/4yUWQ";
const CLARITY_ID = "y8rbeg2r71";

function isLocalHost() {
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".local")
  );
}

/**
 * Inject third-party analytics via DOM (not React <script> / next/script).
 * React 19 warns and skips execution for script tags rendered by components.
 * Skipped on localhost — Ahrefs logs "Ignoring Event: localhost" otherwise.
 */
export function AnalyticsScripts() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || isLocalHost()) {
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
  }, []);

  return null;
}
