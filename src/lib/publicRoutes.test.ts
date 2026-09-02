import { describe, expect, it } from "vitest";
import { listPublicRoutes, STATIC_PUBLIC_ROUTES } from "./publicRoutes";

describe("publicRoutes", () => {
  it("includes static marketing routes", () => {
    expect(STATIC_PUBLIC_ROUTES.some((route) => route.path === "/faq")).toBe(
      true,
    );
    expect(STATIC_PUBLIC_ROUTES.some((route) => route.path === "/factions")).toBe(
      true,
    );
    expect(
      STATIC_PUBLIC_ROUTES.some(
        (route) => route.path === "/guides/path-to-glory-age-of-sigmar",
      ),
    ).toBe(true);
  });

  it("adds faction pages to the sitemap list", () => {
    const routes = listPublicRoutes();
    expect(routes.some((route) => route.path === "/factions/stormcast-eternals")).toBe(
      true,
    );
    expect(routes.length).toBeGreaterThan(STATIC_PUBLIC_ROUTES.length);
  });
});
