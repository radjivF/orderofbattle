import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My lists",
  robots: { index: false, follow: true },
  alternates: { canonical: "/dashboard" },
};

/** Library UI lives in ListFlowShell so it stays mounted during list push/pop. */
export default function DashboardPage() {
  return null;
}
