import type { Metadata, Viewport } from "next";
import { Cinzel, Instrument_Sans } from "next/font/google";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Order of Battle",
    template: "%s | Order of Battle",
  },
  description:
    "Free unofficial Age of Sigmar army builder and table companion. Lists stay on your device.",
  applicationName: "Order of Battle",
  authors: [{ name: "Order of Battle" }],
  openGraph: {
    title: "Order of Battle",
    description:
      "Free unofficial Age of Sigmar army builder and table companion. Lists stay on your device.",
    type: "website",
    images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: "Order of Battle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Order of Battle",
    description:
      "Free unofficial Age of Sigmar army builder and table companion.",
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
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
