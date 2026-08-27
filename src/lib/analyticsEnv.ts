/** Hostnames where third-party analytics must not load. */
export function isAnalyticsLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  );
}

/** Production + non-local only — avoids Ahrefs "Ignoring Event: localhost". */
export function shouldLoadAnalytics(
  hostname: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === "production" && !isAnalyticsLocalHost(hostname);
}
