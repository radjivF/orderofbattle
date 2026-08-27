import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { SITE_DESCRIPTION, sitePath } from "@/lib/site";

const title = "About";
const description =
  "Order of Battle is a free unofficial Age of Sigmar 4th edition fan project: army builder, table companion, local lists, BSData catalogues, no Games Workshop affiliation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title, description, type: "article" },
};

export default function AboutPage() {
  const url = sitePath("/about");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="About"
        title="A free Age of Sigmar hobby helper"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/about", label: "About" },
        ]}
      >
        <p>{SITE_DESCRIPTION}</p>

        <h2>The app</h2>
        <p className="mt-3">
          You build Age of Sigmar 4th edition lists by regiment, then open Play
          to track wounds, lasting spells and prayers, and abilities by phase.
          Made for the hobby. This app does not sell subscriptions, ads, or
          your lists.
        </p>

        <h2>Not Games Workshop</h2>
        <p className="mt-3">
          Order of Battle is not affiliated with, endorsed by, or sponsored by
          Games Workshop. Warhammer, Age of Sigmar, and related marks belong to
          their owners. The app is not a substitute for official publications.
          Confirm points and rules with Games Workshop materials and your
          opponent or tournament organizer.
        </p>

        <h2>Catalogue data</h2>
        <p className="mt-3">
          Faction catalogues come from the community{" "}
          <a
            href="https://github.com/BSData/age-of-sigmar-4th"
            rel="noopener noreferrer"
            target="_blank"
          >
            BSData Age of Sigmar 4th edition
          </a>{" "}
          project. Order of Battle does not host Games Workshop data files.
          Coverage and freshness follow that project.
        </p>

        <h2>Privacy and lists</h2>
        <p className="mt-3">
          Lists stay on your device. There is no account. See the{" "}
          <Link href="/privacy">privacy policy</Link> and{" "}
          <Link href="/terms">terms of use</Link>.
        </p>

        <h2>Contact</h2>
        <p className="mt-3">
          This app is free. It stays free. I cannot make money from it. If you
          want the list builder, or you want me to make one, contact me.
          Commission the work or buy it. I would rather the community keep a
          helper than see it closed down.{" "}
          <a href="mailto:contact@zheat.xyz?subject=Commission%20list%20builder">
            contact@zheat.xyz
          </a>{" "}
          or{" "}
          <a href="https://zheat.xyz" rel="noopener noreferrer" target="_blank">
            Commission list builder
          </a>
          .
        </p>
        <p className="mt-3">
          Questions, corrections, or rights-holder requests:{" "}
          <a href="mailto:contact@zheat.xyz">contact@zheat.xyz</a>. Source:{" "}
          <a
            href="https://github.com/radjivF/orderofbattle"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p>
      </ContentDoc>
    </>
  );
}
