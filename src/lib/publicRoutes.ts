import { listFactions } from "@/engine/queries";
import type { MetadataRoute } from "next";

export type PublicRoute = {
  path: string;
  title: string;
};

export const STATIC_PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/", title: "Home" },
  { path: "/about", title: "About" },
  { path: "/updates", title: "What's new" },
  { path: "/faq", title: "FAQ" },
  { path: "/guides", title: "Guides" },
  {
    path: "/guides/how-to-build-an-age-of-sigmar-army-list",
    title: "How to build an Age of Sigmar army list",
  },
  {
    path: "/guides/free-age-of-sigmar-army-builder",
    title: "Free Age of Sigmar army builder",
  },
  { path: "/factions", title: "Factions" },
  { path: "/compare", title: "Age of Sigmar army builder comparison" },
  {
    path: "/play",
    title: "Play: wounds, spells, and phases",
  },
  { path: "/privacy", title: "Privacy policy" },
  { path: "/terms", title: "Terms of use" },
];

const FALLBACK_BASE_URL = "https://www.orderofbattle.app";

export const STATIC_SITEMAP: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map(
  ({ path }) => ({
    url: `${FALLBACK_BASE_URL}${path}`,
    lastModified: new Date("2026-08-27"),
    changeFrequency:
      path === "/"
        ? ("weekly" as const)
        : path.startsWith("/guides") || path === "/faq"
          ? ("monthly" as const)
          : path.startsWith("/factions/") ||
              path === "/compare" ||
              path === "/play"
            ? ("monthly" as const)
            : ("monthly" as const),
    priority:
      path === "/"
        ? 1
        : path.startsWith("/guides") || path === "/faq"
          ? 0.9
          : path.startsWith("/factions/") ||
              path === "/compare" ||
              path === "/play"
            ? 0.8
            : 0.7,
  }),
);

export function listPublicRoutes(): PublicRoute[] {
  return [
    ...STATIC_PUBLIC_ROUTES,
    ...listFactions().map((faction) => ({
      path: `/factions/${faction.id}`,
      title: faction.name,
    })),
  ];
}
