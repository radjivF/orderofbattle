import { writeFileSync } from "node:fs";
import {
  buildSentryWatchReport,
  formatSentryWatchMarkdown,
  parseSentryWatchEnvironment,
  parseSentryWatchIssues,
  sentryIssuesApiUrl,
  sentryWatchShouldFail,
  sentryWatchSkippedReport,
  type SentryWatchReport,
} from "../src/lib/sentryProdWatch";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function writeWatchOutputs(report: SentryWatchReport) {
  const markdown = formatSentryWatchMarkdown(report);
  const jsonOut = argValue("--json");
  const mdOut = argValue("--md");

  if (jsonOut) {
    writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (mdOut) {
    writeFileSync(mdOut, markdown);
  }
  if (!jsonOut && !mdOut) {
    process.stdout.write(markdown);
  }
}

async function main() {
  const environment = parseSentryWatchEnvironment(
    argValue("--env") || process.env.SENTRY_WATCH_ENV || "production",
  );
  const token = process.env.SENTRY_AUTH_TOKEN?.trim();
  if (!token) {
    writeWatchOutputs(sentryWatchSkippedReport(environment));
    console.error(
      "SENTRY_AUTH_TOKEN is missing; skipping Sentry watch. Add a GitHub Actions secret to enable it.",
    );
    return;
  }

  const url = sentryIssuesApiUrl({
    region: process.env.SENTRY_REGION?.trim() || "us",
    org: process.env.SENTRY_ORG?.trim() || "zheat",
    project: process.env.SENTRY_PROJECT?.trim() || "orderofbattle",
    environment,
  });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 403) {
    throw new Error(
      "Sentry token cannot read issues. Create a User Auth Token with Issue & Event: Read at https://sentry.io/settings/account/api/auth-tokens/ and set GitHub secret SENTRY_AUTH_TOKEN.",
    );
  }
  if (!response.ok) {
    throw new Error(`Sentry issues API failed (${response.status})`);
  }

  const report = buildSentryWatchReport(
    parseSentryWatchIssues(payload),
    environment,
  );
  writeWatchOutputs(report);

  if (hasFlag("--fail") && sentryWatchShouldFail(report)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Sentry watch failed";
  console.error(message);
  process.exitCode = 1;
});
