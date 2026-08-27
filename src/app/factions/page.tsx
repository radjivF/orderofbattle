import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { listFactions } from "@/engine/queries";
import { factionArtSrc } from "@/lib/factionArt";
import { factionSeoStats } from "@/lib/factionSeo";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar factions";
const description =
  "Build free Age of Sigmar 4th edition army lists for Stormcast Eternals, Skaven, Cities of Sigmar, and the other factions in Order of Battle. No account; lists stay on your device.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar factions",
    "AoS army builder factions",
    "Stormcast Eternals list builder",
  ],
  alternates: { canonical: "/factions" },
  openGraph: { title, description, type: "website" },
};

export default function FactionsPage() {
  const factions = listFactions();
  const url = sitePath("/factions");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Factions", path: "/factions" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Factions"
        title="Age of Sigmar 4th edition factions"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/factions", label: "Factions" },
        ]}
      >
        <p>
          Pick a faction, build the list in the browser, then use Play at the
          table. Catalogues come from community BSData, not Games Workshop.
        </p>
        <ul className="grid list-none grid-cols-1 gap-3 pl-0 sm:grid-cols-2">
          {factions.map((faction) => {
            const stats = factionSeoStats(faction);
            const art = factionArtSrc(faction.id);
            return (
              <li key={faction.id} className="list-none">
                <Link
                  href={`/factions/${faction.id}`}
                  className="gilded-card flex items-center gap-3 rounded-xl p-3 no-underline"
                >
                  {art ? (
                    <Image
                      src={art}
                      alt={`${faction.name} army`}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink-raised font-serif text-lg text-sigmarite">
                      {faction.name.slice(0, 1)}
                    </span>
                  )}
                  <span>
                    <span className="block font-serif text-lg text-parchment">
                      {faction.name}
                    </span>
                    <span className="mt-0.5 block text-sm font-normal text-parchment/70 no-underline">
                      {stats.unitCount} warscrolls · {stats.heroCount} heroes
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p>
          <Link href="/dashboard">Open the builder</Link>
          {" · "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            How to build a list
          </Link>
        </p>
      </ContentDoc>
    </>
  );
}
