import * as Sentry from "@sentry/nextjs";
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getSentryTracesSampleRate,
  isSentryEnabled,
} from "@/lib/sentryConfig";

if (isSentryEnabled()) {
  Sentry.init({
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: getSentryTracesSampleRate(),
    enableLogs: true,
    sendDefaultPii: false,
  });
}
