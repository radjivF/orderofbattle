import type { Metadata } from "next";

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

/** UI lives in LibraryScreen inside ListFlowShell (same shell as My lists). */
export default async function BattleRecordGamePage({
  params,
}: PageProps<"/battle-record/[id]">) {
  await params;
  return null;
}
