import type { MetadataRoute } from "next";
import { listPublicRoutes } from "@/lib/publicRoutes";
import { getSiteUrl, sitePath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  try {
    const now = new Date("2026-08-31");
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
    console.error("Error generating sitemap:", error);
    const baseUrl = getSiteUrl();
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
    ];
  }
}
