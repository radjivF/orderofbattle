import { BuilderScreen } from "@/components/BuilderScreen";

export default async function ListPage({
  params,
}: PageProps<"/lists/[id]">) {
  const { id } = await params;
  return <BuilderScreen listId={id} />;
}
