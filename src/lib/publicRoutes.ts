import { listFactions } from "@/engine/queries";

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
  {
    path: "/guides/path-to-glory-age-of-sigmar",
    title: "Path to Glory Age of Sigmar army builder",
  },
  { path: "/factions", title: "Factions" },
  { path: "/compare", title: "Age of Sigmar army builder comparison" },
  {
    path: "/play",
    title: "Age of Sigmar wound tracker and table companion",
  },
  { path: "/privacy", title: "Privacy policy" },
  { path: "/terms", title: "Terms of use" },
];

export function listPublicRoutes(): PublicRoute[] {
  return [
    ...STATIC_PUBLIC_ROUTES,
    ...listFactions().map((faction) => ({
      path: `/factions/${faction.id}`,
      title: faction.name,
    })),
  ];
}
