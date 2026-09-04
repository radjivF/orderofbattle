import { describe, expect, it, beforeAll } from "vitest";
import { listPublicRoutes, STATIC_PUBLIC_ROUTES } from "./publicRoutes";
import { ensureAllFactions } from "@/engine/data/load";

describe("publicRoutes", () => {
  beforeAll(async () => {
    await ensureAllFactions();
  });
  it("includes static marketing routes", () => {
    expect(STATIC_PUBLIC_ROUTES.some((route) => route.path === "/faq")).toBe(
      true,
    );
    expect(STATIC_PUBLIC_ROUTES.some((route) => route.path === "/factions")).toBe(
      true,
    );
  });

  it("adds faction pages to the sitemap list", () => {
    const routes = listPublicRoutes();
    expect(routes.some((route) => route.path === "/factions/stormcast-eternals")).toBe(
      true,
    );
    expect(routes.length).toBeGreaterThan(STATIC_PUBLIC_ROUTES.length);
  });
});
