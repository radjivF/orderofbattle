import type { MetadataRoute } from "next";
import { listPublicRoutes, STATIC_SITEMAP } from "@/lib/publicRoutes";
import { sitePath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  try {
    const now = new Date("2026-08-27");
    const routes = listPublicRoutes();

    return routes.map(({ path }) => ({
      url: sitePath(path),
      lastModified: now,
      changeFrequency: path === "/" ? "weekly" : "monthly",
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
    }));
  } catch (error) {
    console.error("Sitemap generation failed, using static fallback:", error);
    return STATIC_SITEMAP;
  }
}
