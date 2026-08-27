import type { MetadataRoute } from "next";
import { listFactions } from "@/engine/queries";
import { sitePath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-27");
  const staticPaths = [
    "/",
    "/about",
    "/faq",
    "/guides",
    "/guides/how-to-build-an-age-of-sigmar-army-list",
    "/guides/free-age-of-sigmar-army-builder",
    "/factions",
    "/privacy",
    "/terms",
  ];

  const pages: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: sitePath(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/guides") || path === "/faq" ? 0.9 : 0.7,
  }));

  for (const faction of listFactions()) {
    pages.push({
      url: sitePath(`/factions/${faction.id}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return pages;
}
