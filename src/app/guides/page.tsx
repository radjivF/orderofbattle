import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { sitePath } from "@/lib/site";

const title = "Age of Sigmar army builder guides";
const description =
  "Guides for Order of Battle: how to build a free Age of Sigmar 4th edition army list, and what this unofficial builder actually does.";

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
    body: "Faction, points, formation, regiments, then Play during the game.",
  },
  {
    href: "/guides/free-age-of-sigmar-army-builder",
    title: "Free Age of Sigmar army builder",
    body: "Free local builder plus Play during the game, and how that differs from other AoS tools.",
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
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/guides", label: "Guides" },
        ]}
      >
        <p>
          Two pages: how to build a 4th edition list, and what this free
          builder actually does. No account. Lists stay on your device.
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
