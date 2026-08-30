"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-ink px-6 py-16 font-sans text-parchment">
        <h1 className="font-serif text-3xl">Something went wrong</h1>
        <p className="mt-3 max-w-md text-sm text-parchment/75">
          The app hit an unexpected error. Try again, or return to your lists.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-11 rounded-xl bg-parchment px-4 text-sm font-medium text-parchment-ink"
          >
            Try again
          </button>
          <a href="/dashboard" className="min-h-11 leading-[2.75rem] text-sigmarite">
            Back to library
          </a>
        </div>
      </body>
    </html>
  );
}
