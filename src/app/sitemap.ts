import type { MetadataRoute } from "next";
import { listPublicRoutes } from "@/lib/publicRoutes";
import { sitePath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-27");

  return listPublicRoutes().map(({ path }) => ({
    url: sitePath(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority:
      path === "/"
        ? 1
        : path.startsWith("/guides") || path === "/faq"
          ? 0.9
          : path.startsWith("/factions/")
            ? 0.8
            : path === "/sitemap"
              ? 0.3
              : 0.7,
  }));
}
