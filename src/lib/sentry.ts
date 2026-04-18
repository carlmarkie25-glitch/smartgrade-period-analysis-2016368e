import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = "https://66caa0ec6691fcb5d217b67657b55030@o4511241284157440.ingest.us.sentry.io/4511241323937793";
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  });
}

export { Sentry };
