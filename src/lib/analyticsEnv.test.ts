import { describe, expect, it } from "vitest";
import {
  isAnalyticsLocalHost,
  shouldLoadAnalytics,
} from "@/lib/analyticsEnv";

describe("analyticsEnv", () => {
  it("treats localhost variants as local", () => {
    expect(isAnalyticsLocalHost("localhost")).toBe(true);
    expect(isAnalyticsLocalHost("127.0.0.1")).toBe(true);
    expect(isAnalyticsLocalHost("[::1]")).toBe(true);
    expect(isAnalyticsLocalHost("app.local")).toBe(true);
    expect(isAnalyticsLocalHost("www.orderofbattle.app")).toBe(false);
  });

  it("does not load analytics on localhost even in production", () => {
    expect(shouldLoadAnalytics("localhost", "production")).toBe(false);
    expect(shouldLoadAnalytics("127.0.0.1", "production")).toBe(false);
  });

  it("does not load analytics in development", () => {
    expect(shouldLoadAnalytics("www.orderofbattle.app", "development")).toBe(
      false,
    );
  });

  it("loads analytics only for production remote hosts", () => {
    expect(shouldLoadAnalytics("www.orderofbattle.app", "production")).toBe(
      true,
    );
  });
});
