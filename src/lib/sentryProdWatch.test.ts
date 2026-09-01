import { describe, expect, it } from "vitest";
import {
  SENTRY_PROD_WATCH_MARKER,
  SENTRY_PROD_WATCH_QUERY,
  SENTRY_WATCH,
  buildSentryWatchReport,
  formatSentryWatchMarkdown,
  parseSentryWatchEnvironment,
  parseSentryWatchIssues,
  sentryIssuesApiUrl,
  sentryWatchShouldFail,
  sentryWatchSkippedReport,
} from "./sentryProdWatch";

const sample = {
  shortId: "ORDEROFBATTLE-12",
  title: "TypeError: boom",
  permalink: "https://zheat.sentry.io/issues/ORDEROFBATTLE-12",
  count: "4",
  userCount: 2,
  lastSeen: "2026-08-31T03:00:00Z",
};

describe("sentryProdWatch", () => {
  it("parses a Sentry issue list", () => {
    const issues = parseSentryWatchIssues([sample]);
    expect(issues).toEqual([sample]);
  });

  it("rejects a non-list payload", () => {
    expect(() => parseSentryWatchIssues({ detail: "nope" })).toThrow(
      /not a list/,
    );
  });

  it("formats an all-clear production report", () => {
    const report = buildSentryWatchReport([]);
    expect(report.count).toBe(0);
    expect(sentryWatchShouldFail(report)).toBe(false);
    const markdown = formatSentryWatchMarkdown(report);
    expect(markdown).toContain(SENTRY_PROD_WATCH_MARKER);
    expect(markdown).toContain("Production is clear");
  });

  it("formats production issues and fails the watch", () => {
    const report = buildSentryWatchReport(parseSentryWatchIssues([sample]));
    expect(sentryWatchShouldFail(report)).toBe(true);
    const markdown = formatSentryWatchMarkdown(report);
    expect(markdown).toContain("ORDEROFBATTLE-12");
    expect(markdown).toContain(sample.permalink);
    expect(markdown).toContain("production only");
  });

  it("formats preview issues as a pre-merge blocker", () => {
    const report = buildSentryWatchReport(
      parseSentryWatchIssues([sample]),
      "preview",
    );
    expect(report.query).toBe(SENTRY_WATCH.preview.query);
    const markdown = formatSentryWatchMarkdown(report);
    expect(markdown).toContain("Preview (dev)");
    expect(markdown).toContain("before merging `dev` into `main`");
    expect(markdown).toContain(SENTRY_WATCH.preview.marker);
  });

  it("accepts production or preview env flags", () => {
    expect(parseSentryWatchEnvironment("preview")).toBe("preview");
    expect(parseSentryWatchEnvironment("production")).toBe("production");
    expect(() => parseSentryWatchEnvironment("development")).toThrow(/preview/);
  });

  it("builds the production issues URL", () => {
    const url = sentryIssuesApiUrl({
      region: "us",
      org: "zheat",
      project: "orderofbattle",
    });
    expect(url).toContain("zheat/orderofbattle/issues/");
    expect(url).toContain(encodeURIComponent(SENTRY_PROD_WATCH_QUERY));
  });

  it("skips the watch when the GitHub token is missing", () => {
    const report = sentryWatchSkippedReport("preview");
    expect(report.count).toBe(0);
    expect(report.skipped).toBe(true);
    expect(sentryWatchShouldFail(report)).toBe(false);
    const markdown = formatSentryWatchMarkdown(report);
    expect(markdown).toContain(SENTRY_WATCH.preview.marker);
    expect(markdown).toContain("SENTRY_AUTH_TOKEN");
    expect(markdown).not.toContain("Preview/dev is clear");
  });

  it("builds the preview issues URL", () => {
    const url = sentryIssuesApiUrl({
      region: "us",
      org: "zheat",
      project: "orderofbattle",
      environment: "preview",
    });
    expect(url).toContain(encodeURIComponent(SENTRY_WATCH.preview.query));
  });
});
