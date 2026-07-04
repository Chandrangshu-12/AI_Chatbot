// Lightweight client-side error reporting hook. By default this just logs to
// the console. If you wire up an error-tracking service (Sentry, etc.), call
// its capture function here instead.
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[error-boundary]", error, {
    route: window.location.pathname,
    ...context,
  });
}
