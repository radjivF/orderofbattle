export type SentryWatchEnvironment = "production" | "preview";

export const SENTRY_WATCH = {
  production: {
    environment: "production" as const,
    query: "is:unresolved environment:production",
    marker: "<!-- sentry-prod-watch -->",
    issueTitle: "Production Sentry errors",
    label: "sentry-watch",
    clearLine:
      "Production is clear. No unresolved Sentry issues tagged `environment:production`.",
    extra:
      "These are **production only**. Localhost and preview do not belong here.",
  },
  preview: {
    environment: "preview" as const,
    query: "is:unresolved environment:preview",
    marker: "<!-- sentry-preview-watch -->",
    issueTitle: "Preview (dev) Sentry errors",
    label: "sentry-preview-watch",
    clearLine:
      "Preview/dev is clear. No unresolved Sentry issues tagged `environment:preview`.",
    extra:
      "Fix these before merging `dev` into `main`. They are not production yet — they will be if you merge.",
  },
} as const;

export const SENTRY_PROD_WATCH_QUERY = SENTRY_WATCH.production.query;
export const SENTRY_PROD_WATCH_MARKER = SENTRY_WATCH.production.marker;
export const SENTRY_PROD_WATCH_ISSUE_TITLE = SENTRY_WATCH.production.issueTitle;
export const SENTRY_PROD_WATCH_LABEL = SENTRY_WATCH.production.label;

export type SentryWatchIssue = {
  shortId: string;
  title: string;
  permalink: string;
  count: string | number;
  userCount: number;
  lastSeen: string;
};

export type SentryWatchReport = {
  environment: SentryWatchEnvironment;
  count: number;
  issues: SentryWatchIssue[];
  query: string;
  skipped?: boolean;
};

type SentryIssuePayload = {
  shortId?: unknown;
  title?: unknown;
  permalink?: unknown;
  count?: unknown;
  userCount?: unknown;
  lastSeen?: unknown;
};

export function parseSentryWatchEnvironment(
  value: string | undefined,
): SentryWatchEnvironment {
  if (value === "preview" || value === "production") {
    return value;
  }
  throw new Error('Sentry watch env must be "production" or "preview"');
}

export function sentryWatchConfig(environment: SentryWatchEnvironment) {
  return SENTRY_WATCH[environment];
}

export function parseSentryWatchIssues(
  payload: unknown,
): SentryWatchIssue[] {
  if (!Array.isArray(payload)) {
    throw new Error("Sentry issues response was not a list");
  }
  return payload.map((raw) => {
    const issue = raw as SentryIssuePayload;
    const shortId = String(issue.shortId ?? "");
    const permalink = String(issue.permalink ?? "");
    if (!shortId || !permalink) {
      throw new Error("Sentry issue was missing shortId or permalink");
    }
    return {
      shortId,
      title: String(issue.title ?? shortId),
      permalink,
      count: (issue.count as string | number | undefined) ?? 0,
      userCount: Number(issue.userCount ?? 0),
      lastSeen: String(issue.lastSeen ?? ""),
    };
  });
}

export function buildSentryWatchReport(
  issues: SentryWatchIssue[],
  environment: SentryWatchEnvironment = "production",
): SentryWatchReport {
  const config = sentryWatchConfig(environment);
  return {
    environment,
    count: issues.length,
    issues,
    query: config.query,
  };
}

export function sentryWatchSkippedReport(
  environment: SentryWatchEnvironment,
): SentryWatchReport {
  const config = sentryWatchConfig(environment);
  return {
    environment,
    count: 0,
    issues: [],
    query: config.query,
    skipped: true,
  };
}

export function formatSentryWatchMarkdown(report: SentryWatchReport): string {
  const config = sentryWatchConfig(report.environment);
  if (report.skipped) {
    return `${config.marker}
Sentry watch skipped: GitHub secret \`SENTRY_AUTH_TOKEN\` is not set.
Add a Sentry User Auth Token with Issue & Event Read as a Preview environment secret.
`;
  }
  if (report.count === 0) {
    return `${config.marker}
${config.clearLine}
`;
  }

  const noun = report.environment === "preview" ? "Preview (dev)" : "Production";
  const lines = report.issues.map((issue) => {
    const users = issue.userCount === 1 ? "1 user" : `${issue.userCount} users`;
    const seen = issue.lastSeen ? `, last seen ${issue.lastSeen}` : "";
    return `- [${issue.shortId}](${issue.permalink}) — ${issue.title} (${issue.count} events, ${users}${seen})`;
  });

  return `${config.marker}
${noun} has **${report.count}** unresolved Sentry issue${report.count === 1 ? "" : "s"}.

${config.extra}

${lines.join("\n")}
`;
}

export function sentryWatchShouldFail(report: SentryWatchReport): boolean {
  return !report.skipped && report.count > 0;
}

export function sentryIssuesApiUrl(input: {
  region: string;
  org: string;
  project: string;
  environment?: SentryWatchEnvironment;
}): string {
  const query = encodeURIComponent(
    sentryWatchConfig(input.environment ?? "production").query,
  );
  return `https://${input.region}.sentry.io/api/0/projects/${input.org}/${input.project}/issues/?query=${query}&limit=25`;
}
