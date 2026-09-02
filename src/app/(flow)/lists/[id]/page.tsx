import type { Metadata } from "next";
import { ListScreen } from "@/components/ListScreen";

export async function generateMetadata({
  params,
}: PageProps<"/lists/[id]">): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Army list",
    robots: { index: false, follow: false },
    alternates: { canonical: `/lists/${id}` },
  };
}

export default async function ListPage({
  params,
  searchParams,
}: PageProps<"/lists/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const play = query.play;
  const openPlay =
    play === "1" || (Array.isArray(play) && play.includes("1"));
  return <ListScreen listId={id} openPlay={openPlay} />;
}
