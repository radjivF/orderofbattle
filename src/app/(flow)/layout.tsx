import { ListFlowShell } from "@/components/ListFlowShell";

export default function FlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ListFlowShell>{children}</ListFlowShell>;
}
