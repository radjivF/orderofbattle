import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Core Rules",
  robots: { index: false, follow: true },
  alternates: { canonical: "/core-rules" },
};

/** UI lives in LibraryScreen inside ListFlowShell (same shell as My lists). */
export default function CoreRulesPage() {
  return null;
}
