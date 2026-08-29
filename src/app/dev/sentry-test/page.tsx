import { notFound } from "next/navigation";
import { SentryTestClient } from "./SentryTestClient";

export default function SentryTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-parchment">
      <h1 className="font-serif text-3xl">Sentry test</h1>
      <p className="mt-3 text-sm text-parchment/75">
        Dev only. Click the button, then check Sentry → Issues for a test error.
      </p>
      <SentryTestClient />
    </main>
  );
}
