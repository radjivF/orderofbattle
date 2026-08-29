import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getReplaySessionSampleRate,
  getSentryDsn,
  getSentryEnvironment,
  isSentryEnabled,
  sentryConfig,
} from "./sentryConfig";

describe("sentryConfig", () => {
  afterEach(() => {
    delete process.env.SENTRY_DSN;
    delete process.env.VERCEL_ENV;
    vi.unstubAllEnvs();
  });

  it("is disabled without a DSN", () => {
    expect(isSentryEnabled()).toBe(false);
    expect(getSentryDsn()).toBeUndefined();
    expect(sentryConfig.enabled).toBe(false);
  });

  it("reads SENTRY_DSN", () => {
    process.env.SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    expect(getSentryDsn()).toBe("https://example@o1.ingest.sentry.io/1");
    expect(isSentryEnabled()).toBe(true);
    expect(sentryConfig.dsn).toBe("https://example@o1.ingest.sentry.io/1");
  });

  it("prefers VERCEL_ENV for environment label", () => {
    process.env.VERCEL_ENV = "preview";
    expect(getSentryEnvironment()).toBe("preview");
    expect(sentryConfig.environment).toBe("preview");
  });

  it("records all sessions in development replay sampling", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getReplaySessionSampleRate()).toBe(1);
  });
});
