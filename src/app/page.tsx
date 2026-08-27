import type { Metadata } from "next";
import { TryLanding } from "@/components/TryLanding";

export const metadata: Metadata = {
  title: "Order of Battle | Age of Sigmar Army Builder",
  description:
    "Build Age of Sigmar lists, add Regiments of Renown, then Play: track wounds, spells, and abilities by phase.",
};

export default function Home() {
  return <TryLanding />;
}
