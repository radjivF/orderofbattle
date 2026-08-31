import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar army builder guides";
const description =
  "Guides for Order of Battle: how to build a free Age of Sigmar 4th edition army list, Path to Glory campaign lists, and what the unofficial builder and Play companion actually do.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guides" },
  openGraph: { title, description, type: "website" },
};

const guides = [
  {
    href: "/guides/how-to-build-an-age-of-sigmar-army-list",
    title: "How to build an Age of Sigmar army list",
    body: "Faction, points, formation, regiments, then Play on your phone.",
  },
  {
    href: "/guides/free-age-of-sigmar-army-builder",
    title: "Free Age of Sigmar army builder",
    body: "Free local builder plus table companion, and how that differs from other AoS tools.",
  },
  {
    href: "/guides/path-to-glory-age-of-sigmar",
    title: "Path to Glory army lists",
    body: "Campaign lists: battlepacks, Anvil of Apotheosis, paths, learned spells, Play on your phone.",
  },
] as const;

export default function GuidesPage() {
  const url = sitePath("/guides");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({ url, headline: title, description }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Guides"
        title="Age of Sigmar army builder guides"
        updated="31 August 2026"
        updatedDateTime="2026-08-31"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
        ]}
      >
        <p>
          How to build a 4th edition list, Path to Glory campaign lists, and
          what this free builder actually does. No account. Lists stay on your
          device.
        </p>
        <ul className="list-none pl-0">
          {guides.map((guide) => (
            <li key={guide.href} className="mt-6 list-none">
              <h2>
                <Link href={guide.href}>{guide.title}</Link>
              </h2>
              <p className="mt-2">{guide.body}</p>
            </li>
          ))}
        </ul>
      </ContentDoc>
    </>
  );
}
