import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scourge of Aqshy",
  robots: { index: false, follow: true },
  alternates: { canonical: "/scourge-rules" },
};

/** UI lives in LibraryScreen inside ListFlowShell (same shell as My lists). */
export default function ScourgeRulesPage() {
  return null;
}
