import type { Metadata } from "next";
import { BuilderScreen } from "@/components/BuilderScreen";

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
  return <BuilderScreen listId={id} />;
}
