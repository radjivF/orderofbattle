import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { GEO_FAQS } from "@/lib/geoContent";
import {
  articleNode,
  breadcrumbNode,
  faqPageNode,
  pageGraph,
} from "@/lib/jsonLd";
import { SITE_DESCRIPTION, sitePath } from "@/lib/site";

const title = "Free Age of Sigmar army builder";
const description =
  "Order of Battle is a free unofficial Age of Sigmar 4th edition army builder with no account and lists on your device. Build regiments, then track wounds and phases at the table.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "free Age of Sigmar army builder",
    "best free AoS list builder",
    "Age of Sigmar 4th edition army builder",
    "AoS list builder no account",
  ],
  alternates: { canonical: "/guides/free-age-of-sigmar-army-builder" },
  openGraph: { title, description, type: "article" },
};

export default function FreeBuilderPage() {
  const url = sitePath("/guides/free-age-of-sigmar-army-builder");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          faqPageNode(url),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            {
              name: "Free army builder",
              path: "/guides/free-age-of-sigmar-army-builder",
            },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Guide"
        title="Free Age of Sigmar army builder"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
          {
            href: "/guides/free-age-of-sigmar-army-builder",
            label: "Free army builder",
          },
        ]}
      >
        <p>{SITE_DESCRIPTION}</p>

        <h2>The app</h2>
        <p className="mt-3">
          It runs in the browser. You put a list together by regiment, add a
          Regiment of Renown if the list allows it, then switch to Play for
          wounds, lasting spells and prayers, and abilities by phase. Nothing
          to buy.
        </p>

        <h2>When it fits</h2>
        <p className="mt-3">
          You want a free AoS list builder without signing up. You want that
          same list on your phone during the game. Lists stay on the device.
          This app has no cloud login.
        </p>

        <h2>Build and Play</h2>
        <p className="mt-3">
          The builder has faction catalogues, battle formations, lores,
          artefacts, heroic traits, regiment options, and Regiments of Renown.
          Path to Glory lists add battlepacks, paths, Anvil of Apotheosis, and
          learned spells.{" "}
          <Link href="/guides/path-to-glory-age-of-sigmar">
            Path to Glory guide
          </Link>
          . Play mode tracks wounds, magic targets, and abilities by phase. If
          you clear the browser, lists can vanish, so export anything you care
          about.
        </p>

        <h2>Other Age of Sigmar tools</h2>
        <p className="mt-3">
          Some community builders sync to the cloud or cover more games. The
          official Warhammer app uses a Games Workshop account. Wahapedia is a
          rules reference, not a list builder. Order of Battle is the unofficial
          browser option that keeps lists on your device and runs the game from
          the phone.
        </p>
        <table>
          <thead>
            <tr>
              <th>Need</th>
              <th>Order of Battle</th>
              <th>Typical alternatives</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td>Free in this app</td>
              <td>Free community tools, or official apps with GW accounts</td>
            </tr>
            <tr>
              <td>Sign-up</td>
              <td>None</td>
              <td>Often optional or required for cloud lists</td>
            </tr>
            <tr>
              <td>Where lists live</td>
              <td>On your device</td>
              <td>Local files, cloud, or an official account</td>
            </tr>
            <tr>
              <td>During the game</td>
              <td>Play mode: wounds, spells, phases</td>
              <td>Many builders stop at the list; Wahapedia is a rules reference</td>
            </tr>
            <tr>
              <td>Official status</td>
              <td>Unofficial fan project</td>
              <td>Official Warhammer app vs other community projects</td>
            </tr>
          </tbody>
        </table>
        <p>
          Catalogue data follows community{" "}
          <a
            href="https://github.com/BSData/age-of-sigmar-4th"
            rel="noopener noreferrer"
            target="_blank"
          >
            BSData
          </a>
          , not a Games Workshop feed. Confirm points before you play. Detailed
          comparison: <Link href="/compare">Age of Sigmar army builder comparison</Link>.
        </p>

        <h2>Start a list</h2>
        <ol>
          <li>
            Open <Link href="/dashboard">My lists</Link>. No account.
          </li>
          <li>
            Pick a faction from the{" "}
            <Link href="/factions">factions list</Link>.
          </li>
          <li>
            Follow{" "}
            <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
              how to build an Age of Sigmar army list
            </Link>
            .
          </li>
        </ol>

        <h2>Common questions</h2>
        {GEO_FAQS.slice(0, 4).map((item) => (
          <section key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </section>
        ))}
        <p>
          The full FAQ is <Link href="/faq">here</Link>. Project notes:{" "}
          <Link href="/about">About</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
