import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Cinzel, Instrument_Sans } from "next/font/google";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsNewNotice } from "@/components/WhatsNewNotice";
import { JsonLd } from "@/components/JsonLd";
import { countryFromRequestHeaders, requiresCookieConsent } from "@/lib/consentRegion";
import { graph, softwareApplicationNode } from "@/lib/jsonLd";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_DESCRIPTION,
  getSiteUrl,
} from "@/lib/site";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | Free Age of Sigmar Army Builder`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  category: "games",
  alternates: {
    types: {
      "text/plain": "/llms.txt",
    },
  },
  openGraph: {
    title: `${SITE_NAME} | Free Age of Sigmar Army Builder`,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: "/brand/og.jpg",
        width: 1200,
        height: 630,
        alt: "Order of Battle, free Age of Sigmar army builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Free Age of Sigmar Army Builder`,
    description: SITE_SHORT_DESCRIPTION,
    images: ["/brand/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/icon-180.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerList = await headers();
  const consentRequired = requiresCookieConsent(
    countryFromRequestHeaders(headerList),
  );

  return (
    <html
      lang="en"
      className={`${instrument.variable} ${cinzel.variable} antialiased`}
    >
      <head>
        <link rel="llms-txt" href="/llms.txt" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="llms-full.txt" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
      </head>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <AnalyticsScripts consentRequired={consentRequired} />
        <CookieConsent consentRequired={consentRequired} />
        <WhatsNewNotice />
        <JsonLd data={graph([softwareApplicationNode()])} />
        {children}
      </body>
    </html>
  );
}
