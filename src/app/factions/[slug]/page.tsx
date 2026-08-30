import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { StartListCta } from "@/components/StartListCta";
import { getFaction, listFactions } from "@/engine/queries";
import { factionArtSize, factionArtSrc } from "@/lib/factionArt";
import { factionSeoStats } from "@/lib/factionSeo";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listFactions().map((faction) => ({ slug: faction.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const faction = getFaction(slug);
  if (!faction) {
    return { title: "Faction not found" };
  }
  const title = `${faction.name} army builder`;
  const description = `Build a free ${faction.name} army list for Warhammer Age of Sigmar 4th edition. Unofficial browser builder with regiments, formations, and Play mode. No account; lists stay on your device.`;
  return {
    title,
    description,
    keywords: [
      `${faction.name} army builder`,
      `${faction.name} Age of Sigmar list`,
      `free ${faction.name} list builder`,
      "Age of Sigmar 4th edition",
    ],
    alternates: { canonical: `/factions/${faction.id}` },
    openGraph: {
      title: `${faction.name} | Free Age of Sigmar army builder`,
      description,
      type: "article",
    },
  };
}

function joinNames(names: string[]): string {
  if (names.length === 0) {
    return "none listed in this catalogue snapshot";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export default async function FactionPage({ params }: Props) {
  const { slug } = await params;
  const faction = getFaction(slug);
  if (!faction) {
    notFound();
  }
  const stats = factionSeoStats(faction);
  const art = factionArtSrc(faction.id);
  const url = sitePath(`/factions/${faction.id}`);
  const headline = `${faction.name} army builder`;
  const description = `Build a free ${faction.name} army list for Warhammer Age of Sigmar 4th edition in Order of Battle.`;

  const heroes = faction.units.filter((unit) => unit.hero);
  const sampleHeroNames = heroes
    .slice(0, 6)
    .map((h) => h.name)
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline, description }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Factions", path: "/factions" },
            { name: faction.name, path: `/factions/${faction.id}` },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Faction"
        title={`${faction.name} army builder`}
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/factions", label: "Factions" },
          { href: `/factions/${faction.id}`, label: faction.name },
        ]}
      >
        {art ? (
          <Image
            src={art}
            alt={`${faction.name} army art used in Order of Battle`}
            {...factionArtSize(faction.id)}
            unoptimized
            priority
            loading="eager"
            className="mb-2 h-auto w-full rounded-2xl"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : null}
        <p>
          Build a <strong>{faction.name}</strong> list in the browser, then open
          Play to track wounds, spells, and phase abilities. No account. Lists
          stay on your device.
        </p>
        <StartListCta />

        <h2>In the catalogue</h2>
        <p className="mt-3">
          The {faction.name} catalogue in the app has {stats.unitCount}{" "}
          warscrolls, including {stats.heroCount} heroes
          {stats.uniqueCount > 0 ? ` (${stats.uniqueCount} unique)` : null}.
          Default points cap is {stats.pointsCap}.
        </p>
        <ul>
          <li>
            Battle formations: {joinNames(stats.formationNames)}.
          </li>
          {stats.spellLoreNames.length > 0 ? (
            <li>Spell lores: {joinNames(stats.spellLoreNames)}.</li>
          ) : null}
          {stats.prayerLoreNames.length > 0 ? (
            <li>Prayer lores: {joinNames(stats.prayerLoreNames)}.</li>
          ) : null}
          {stats.manifestationLoreNames.length > 0 ? (
            <li>
              Manifestation lores: {joinNames(stats.manifestationLoreNames)}.
            </li>
          ) : null}
          <li>
            Compatible Regiments of Renown in this app: {stats.rorCount}
            {stats.rorCount > 0 ? ` (${joinNames(stats.rorNames)})` : null}.
          </li>
        </ul>
        <p>
          Names and counts come from the community BSData catalogue used by the
          app. They are not an official Games Workshop roster. Confirm points
          and restrictions with official publications before you play.
        </p>

        <h2>Regiments in {faction.name}</h2>
        <p className="mt-3">
          Age of Sigmar 4th edition uses regiments led by heroes. Each hero
          takes eligible units into their regiment. The {faction.name}
          catalogue has {stats.heroCount} heroes
          {sampleHeroNames.length > 0
            ? `, including ${joinNames(sampleHeroNames)}`
            : null}
          {sampleHeroNames.length < heroes.length
            ? `, and ${heroes.length - sampleHeroNames.length} more`
            : null}
          .
        </p>
        <p>
          Pick a hero. Add units that match the hero&apos;s regiment options.
          The app filters based on categories and keywords from BSData. Some
          units can reinforce (second copy for extra points). Some heroes are
          unique (once per list).
        </p>
        <p>
          Battle formations affect which regiments work. Pick the formation,
          then build regiments that fit. Formations for {faction.name}:{" "}
          {joinNames(stats.formationNames)}.
        </p>

        <h2>Start a {faction.name} list</h2>
        <ol className="mt-3">
          <li>Open New list on My lists and choose your faction.</li>
          <li>Set points, pick a battle formation, add a general.</li>
          <li>Fill regiments. Add a Regiment of Renown if the list allows it.</li>
          <li>
            Use <Link href="/play">Play mode</Link> at the table.
          </li>
        </ol>
        <p>
          Walkthrough:{" "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            how to build a list
          </Link>
          . Other armies: <Link href="/factions">all factions</Link>. Compare:{" "}
          <Link href="/compare">other builders</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
