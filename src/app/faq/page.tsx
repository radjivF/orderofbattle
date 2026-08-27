import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { GEO_FAQS } from "@/lib/geoContent";
import { articleNode, breadcrumbNode, faqPageNode, pageGraph } from "@/lib/jsonLd";
import { SITE_DESCRIPTION, SITE_PUBLISHED, sitePath } from "@/lib/site";

const title = "Age of Sigmar army builder FAQ";
const description =
  "Answers about Order of Battle, a free unofficial Age of Sigmar 4th edition army builder: accounts, privacy, factions, Play mode, and Games Workshop status.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Age of Sigmar army builder FAQ",
    "free AoS list builder",
    "does Order of Battle need an account",
  ],
  alternates: { canonical: "/faq" },
  openGraph: { title, description, type: "article" },
};

export default function FaqPage() {
  const url = sitePath("/faq");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          faqPageNode(url),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="FAQ"
        title="Age of Sigmar army builder questions"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/faq", label: "FAQ" },
        ]}
      >
        <p>{SITE_DESCRIPTION}</p>
        <p>
          Last reviewed <time dateTime={SITE_PUBLISHED}>27 August 2026</time>.
          Rules and points still need an official check before you play.
        </p>
        {GEO_FAQS.map((item) => (
          <section key={item.question}>
            <h2>{item.question}</h2>
            <p className="mt-3">{item.answer}</p>
          </section>
        ))}
        <p>
          Walkthrough:{" "}
          <Link href="/guides/how-to-build-an-age-of-sigmar-army-list">
            how to build a list
          </Link>
          . Overview:{" "}
          <Link href="/guides/free-age-of-sigmar-army-builder">
            free army builder
          </Link>
          . Armies: <Link href="/factions">factions</Link>.
        </p>
      </ContentDoc>
    </>
  );
}
