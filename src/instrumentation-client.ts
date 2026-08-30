import * as Sentry from "@sentry/nextjs";
import {
  getReplaySessionSampleRate,
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
    replaysSessionSampleRate: getReplaySessionSampleRate(),
    replaysOnErrorSampleRate: 1,
    enableLogs: true,
    sendDefaultPii: false,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
