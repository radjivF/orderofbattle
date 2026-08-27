import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { HOW_TO_STEPS } from "@/lib/geoContent";
import {
  articleNode,
  breadcrumbNode,
  howToNode,
  pageGraph,
} from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "How to build an Age of Sigmar army list";
const description =
  "How to build a Warhammer Age of Sigmar 4th edition army list for free: pick a faction, set points, choose a formation, add regiments, then play the list on your phone.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "how to build an Age of Sigmar army list",
    "AoS 4th edition list building",
    "Age of Sigmar regiment builder",
  ],
  alternates: {
    canonical: "/guides/how-to-build-an-age-of-sigmar-army-list",
  },
  openGraph: { title, description, type: "article" },
};

export default function HowToBuildPage() {
  const url = sitePath("/guides/how-to-build-an-age-of-sigmar-army-list");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          howToNode(url),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: "How to build a list", path: "/guides/how-to-build-an-age-of-sigmar-army-list" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Guide"
        title="How to build an Age of Sigmar army list"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          {
            href: "/guides/how-to-build-an-age-of-sigmar-army-list",
            label: "How to build a list",
          },
        ]}
      >
        <p>
          An Age of Sigmar 4th edition army list is a points-limited force from
          one faction: a battle formation, a general, and one or more regiments
          led by heroes. Order of Battle is a free unofficial builder for that
          job. Lists stay on your device.
        </p>

        <h2>Before you start</h2>
        <ul>
          <li>
            A faction you own or want to plan (see{" "}
            <Link href="/factions">supported factions</Link>).
          </li>
          <li>A points limit. 2,000 is the usual matched-play default.</li>
          <li>
            Official publications nearby. The app is a helper, not the
            rulebook.
          </li>
        </ul>

        <h2>Build the list in Order of Battle</h2>
        <ol>
          {HOW_TO_STEPS.map((step) => (
            <li key={step.name}>
              <strong>{step.name}.</strong> {step.text}
            </li>
          ))}
        </ol>

        <h2>Regiment structure in 4th edition</h2>
        <p className="mt-3">
          Each regiment is led by a hero. Eligible units join that hero. Some
          heroes can take other heroes in the same regiment. Order of Battle
          shows those regiment options from the catalogue so you do not have to
          memorize every restriction while you draft.
        </p>
        <p>
          A Regiment of Renown is a fixed package you may add when the list
          allows it. The builder totals its points with the rest of the army.
        </p>

        <h2>Then play it</h2>
        <p className="mt-3">
          Open Play mode. Track wounds on each unit, mark lasting spells and
          prayers, and read abilities for the current phase. Confirm the final
          list with official points and your opponent or TO before an event.
        </p>
        <p>
          <Link href="/dashboard">Open the builder</Link>
          {" · "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            Free army builder overview
          </Link>
          {" · "}
          <Link href="/faq">FAQ</Link>
        </p>
      </ContentDoc>
    </>
  );
}
