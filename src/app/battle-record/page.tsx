import type { Metadata } from "next";
import { BattleRecordScreen } from "@/components/BattleRecordScreen";

export const metadata: Metadata = {
  title: "Battle record",
  robots: { index: false, follow: true },
  alternates: { canonical: "/battle-record" },
};

export default function BattleRecordPage() {
  return <BattleRecordScreen />;
}
