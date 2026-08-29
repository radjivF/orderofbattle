import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { TryLanding } from "@/components/TryLanding";
import { homeFaqJsonLd } from "@/lib/jsonLd";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} | Free Age of Sigmar Army Builder`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | Free Age of Sigmar Army Builder`,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={homeFaqJsonLd()} />
      <TryLanding />
    </>
  );
}
