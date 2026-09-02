import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Clarity load-balances across https://[a-z].clarity.ms (e.g. h.clarity.ms/collect).
  // vercel.live: Vercel Toolbar / preview comments (feedback.js).
  // appzi.io: feedback widget — strict.js keeps it inside this policy.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clarity.ms https://scripts.clarity.ms https://analytics.ahrefs.com https://vercel.live https://w.appzi.io",
  "style-src 'self' 'unsafe-inline' https://vercel.live https://survey-assets.appzi.io",
  "img-src 'self' data: blob: https://*.clarity.ms https://c.bing.com https://vercel.live https://vercel.com https://survey-assets.appzi.io",
  "font-src 'self' data: https://vercel.live https://assets.vercel.com https://survey-assets.appzi.io",
  "connect-src 'self' https://*.clarity.ms https://scripts.clarity.ms https://c.bing.com https://analytics.ahrefs.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vercel.live wss://ws-us3.pusher.com https://api.appzi.io https://w.appzi.io",
  "frame-src 'self' https://vercel.live https://w.appzi.io",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const sentryDsn = process.env.SENTRY_DSN?.trim();

const nextConfig: NextConfig = {
  ...(sentryDsn ? { env: { SENTRY_DSN: sentryDsn } } : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [65, 68, 70, 72, 75, 78, 80, 82],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

const sentryEnabled = Boolean(sentryDsn);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      tunnelRoute: "/monitoring",
      widenClientFileUpload: true,
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : nextConfig;
