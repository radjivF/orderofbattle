import type { Metadata } from "next";
import Link from "next/link";
import { ContentDoc } from "@/components/ContentDoc";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import { listPublicRoutes, STATIC_PUBLIC_ROUTES } from "@/lib/publicRoutes";
import { sitePath } from "@/lib/site";

const title = "Sitemap";
const description =
  "All public pages on Order of Battle, the free unofficial Age of Sigmar army builder. XML sitemap at /sitemap.xml.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sitemap" },
  openGraph: { title, description, type: "website" },
};

export default function SitemapPage() {
  const url = sitePath("/sitemap");
  const routes = listPublicRoutes();
  const sitePages = STATIC_PUBLIC_ROUTES.filter((route) => route.path !== "/sitemap");
  const factions = routes.filter((route) => route.path.startsWith("/factions/"));

  return (
    <>
      <JsonLd
        data={pageGraph([
          {
            "@type": "CollectionPage",
            "@id": `${url}#page`,
            url,
            name: title,
            description,
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Sitemap", path: "/sitemap" },
          ]),
        ])}
      />
      <ContentDoc
        kicker="Index"
        title="Sitemap"
        updated="27 August 2026"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/sitemap", label: "Sitemap" },
        ]}
      >
        <p>
          Public pages for crawlers and people. The XML feed is{" "}
          <a href="/sitemap.xml">/sitemap.xml</a>. Army lists and Play stay
          local, so they are not listed here.
        </p>
        <h2>Site</h2>
        <ul>
          {sitePages.map((route) => (
            <li key={route.path}>
              <Link href={route.path}>{route.title}</Link>
            </li>
          ))}
        </ul>
        <h2>Factions</h2>
        <ul>
          {factions.map((route) => (
            <li key={route.path}>
              <Link href={route.path}>{route.title}</Link>
            </li>
          ))}
        </ul>
      </ContentDoc>
    </>
  );
}
