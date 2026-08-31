import { GEO_FAQS, HOW_TO_STEPS, type GeoFaq } from "@/lib/geoContent";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_PUBLISHED,
  sitePath,
} from "@/lib/site";

type HowToStep = { name: string; text: string };

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${sitePath("/")}/#organization`,
    name: SITE_NAME,
    url: sitePath("/"),
    logo: sitePath("/brand/icon-512.png"),
    description: SITE_DESCRIPTION,
    email: "contact@zheat.xyz",
    sameAs: [
      "https://github.com/radjivF/orderofbattle",
      "https://zheat.xyz",
    ],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${sitePath("/")}/#website`,
    name: SITE_NAME,
    url: sitePath("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${sitePath("/")}/#organization` },
  };
}

export function softwareApplicationNode() {
  return {
    "@type": "WebApplication",
    "@id": `${sitePath("/")}/#app`,
    name: SITE_NAME,
    url: sitePath("/"),
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript for building and playing lists",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    description: SITE_DESCRIPTION,
    featureList: [
      "Age of Sigmar 4th edition army lists",
      "Regiments and Regiments of Renown",
      "Play mode: wounds, spells, phase abilities",
      "Path to Glory campaign lists",
      "No account; lists stored on device",
    ],
    publisher: { "@id": `${sitePath("/")}/#organization` },
  };
}

export function faqPageNode(url: string, faqs: GeoFaq[] = GEO_FAQS) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function howToNode(
  url: string,
  opts?: {
    name?: string;
    description?: string;
    steps?: readonly HowToStep[];
  },
) {
  const steps = opts?.steps ?? HOW_TO_STEPS;
  return {
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: opts?.name ?? "How to build an Age of Sigmar 4th edition army list",
    description:
      opts?.description ??
      "Build a Warhammer Age of Sigmar 4th edition army list in Order of Battle, a free unofficial browser builder.",
    url,
    totalTime: "PT20M",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function articleNode(opts: {
  url: string;
  headline: string;
  description: string;
  dateModified?: string;
}) {
  return {
    "@type": "Article",
    "@id": `${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    datePublished: SITE_PUBLISHED,
    dateModified: opts.dateModified ?? SITE_PUBLISHED,
    inLanguage: "en",
    author: { "@id": `${sitePath("/")}/#organization` },
    publisher: { "@id": `${sitePath("/")}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

export function breadcrumbNode(
  items: { name: string; path: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: sitePath(item.path),
    })),
  };
}

export function graph(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode(), ...nodes],
  };
}

/** Page-level nodes only. Organization and WebSite already live in the root layout. */
export function pageGraph(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function homeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    ...faqPageNode(sitePath("/")),
  };
}
