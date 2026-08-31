import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battle record",
  robots: { index: false, follow: true },
  alternates: { canonical: "/battle-record" },
};

/** UI lives in LibraryScreen inside ListFlowShell (same shell as My lists). */
export default function BattleRecordPage() {
  return null;
}
