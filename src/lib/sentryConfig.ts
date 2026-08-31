/**
 * Sentry settings — DSN lives in private `SENTRY_DSN` only.
 * Client bundles receive it at build time via next.config `env` (not NEXT_PUBLIC_).
 * Capture only on Vercel preview (`dev`) and production (`main`), never localhost.
 */
export function getSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  if (!getSentryDsn()) {
    return false;
  }
  const vercelEnv =
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
  return vercelEnv === "preview" || vercelEnv === "production";
}

export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function getSentryRelease(): string | undefined {
  const release =
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  return release || undefined;
}

export function getSentryTracesSampleRate(): number {
  const env = getSentryEnvironment();
  if (env === "development") {
    return 1;
  }
  if (env === "preview") {
    return 0.2;
  }
  return 0.1;
}

export function getReplaySessionSampleRate(): number {
  return getSentryEnvironment() === "development" ? 1 : 0.1;
}

export const sentryConfig = {
  get dsn() {
    return getSentryDsn();
  },
  get enabled() {
    return isSentryEnabled();
  },
  get environment() {
    return getSentryEnvironment();
  },
  get release() {
    return getSentryRelease();
  },
  get tracesSampleRate() {
    return getSentryTracesSampleRate();
  },
  get replaySessionSampleRate() {
    return getReplaySessionSampleRate();
  },
};
