import type { Metadata } from "next";
import { WhatsNewArticle } from "@/components/WhatsNewArticle";
import { JsonLd } from "@/components/JsonLd";
import { articleNode, breadcrumbNode, pageGraph } from "@/lib/jsonLd";
import {
  UPDATES_DATE,
  UPDATES_DESCRIPTION,
  UPDATES_TITLE,
} from "@/lib/updatesPage";
import { sitePath } from "@/lib/site";

export const metadata: Metadata = {
  title: UPDATES_TITLE,
  description: UPDATES_DESCRIPTION,
  alternates: { canonical: "/updates" },
  openGraph: { title: UPDATES_TITLE, description: UPDATES_DESCRIPTION, type: "article" },
};

export default function UpdatesPage() {
  const url = sitePath("/updates");
  return (
    <>
      <JsonLd
        data={pageGraph([
          articleNode({
            url,
            headline: UPDATES_TITLE,
            description: UPDATES_DESCRIPTION,
            dateModified: UPDATES_DATE,
          }),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "What's new", path: "/updates" },
          ]),
        ])}
      />
      <WhatsNewArticle />
    </>
  );
}
