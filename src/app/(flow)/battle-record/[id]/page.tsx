import type { Metadata } from "next";
import { BattleRecordGameScreen } from "@/components/BattleRecordGameScreen";

export async function generateMetadata({
  params,
}: PageProps<"/battle-record/[id]">): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Battle",
    robots: { index: false, follow: false },
    alternates: { canonical: `/battle-record/${id}` },
  };
}

export default async function BattleRecordGamePage({
  params,
}: PageProps<"/battle-record/[id]">) {
  const { id } = await params;
  return <BattleRecordGameScreen gameId={id} />;
}
