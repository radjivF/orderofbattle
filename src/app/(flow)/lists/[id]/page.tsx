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
}: PageProps<"/lists/[id]">) {
  const { id } = await params;
  return <ListScreen listId={id} />;
}
