import { describe, expect, it } from "vitest";
import {
  isAnalyticsLocalHost,
  shouldLoadAnalytics,
  shouldLoadClarity,
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

  describe("shouldLoadClarity", () => {
    it("allows production domains only", () => {
      expect(shouldLoadClarity("orderofbattle.app")).toBe(true);
      expect(shouldLoadClarity("www.orderofbattle.app")).toBe(true);
    });

    it("blocks staging domain", () => {
      expect(shouldLoadClarity("staging.orderofbattle.app")).toBe(false);
    });

    it("blocks Vercel preview URLs", () => {
      expect(shouldLoadClarity("zheat-git-pr-123-yohan.vercel.app")).toBe(
        false,
      );
      expect(shouldLoadClarity("zheat-preview.vercel.app")).toBe(false);
    });

    it("blocks localhost", () => {
      expect(shouldLoadClarity("localhost")).toBe(false);
      expect(shouldLoadClarity("127.0.0.1")).toBe(false);
    });

    it("blocks unknown domains", () => {
      expect(shouldLoadClarity("example.com")).toBe(false);
      expect(shouldLoadClarity("orderofbattle.dev")).toBe(false);
    });
  });
});
