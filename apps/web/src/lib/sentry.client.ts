'use client';

let initialized = false;

export async function initSentryClient() {
  if (initialized) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import('@sentry/browser').catch(() => null);
  if (!Sentry) return;
  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.5,
    environment: process.env.NODE_ENV,
  });
  initialized = true;
}

export async function captureException(err: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import('@sentry/browser').catch(() => null);
  if (!Sentry) return;
  Sentry.captureException(err, { extra: context });
}
