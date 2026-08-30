"use client";

import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "@/lib/sentryConfig";

export function SentryTestClient() {
  const enabled = sentryConfig.enabled;

  return (
    <div className="mt-8 flex flex-col gap-4">
      <p className="text-sm">
        Status:{" "}
        <strong className={enabled ? "text-green-400" : "text-illegal"}>
          {enabled ? "DSN configured" : "DSN missing — edit .env.local"}
        </strong>
      </p>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => {
          throw new Error("Order of Battle Sentry test error");
        }}
        className="min-h-11 w-fit rounded-xl bg-parchment px-4 text-sm font-medium text-parchment-ink disabled:opacity-50"
      >
        Send test error
      </button>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => {
          Sentry.captureMessage("Order of Battle Sentry test message");
          window.alert("Message sent — check Sentry Issues.");
        }}
        className="min-h-11 w-fit rounded-xl ring-1 ring-parchment/25 px-4 text-sm disabled:opacity-50"
      >
        Send test message
      </button>
    </div>
  );
}
