import type { Metadata } from "next";
import { LibraryScreen } from "@/components/LibraryScreen";

export const metadata: Metadata = {
  title: "My lists",
  robots: { index: false, follow: true },
  alternates: { canonical: "/app" },
};

export default function AppPage() {
  return <LibraryScreen />;
}
