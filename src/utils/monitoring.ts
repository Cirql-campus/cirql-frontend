import * as Sentry from '@sentry/react';

let monitoringEnabled = false;

export const initMonitoring = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || monitoringEnabled) return;

  monitoringEnabled = true;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE_VERSION,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
  });
};

export const captureFrontendException = (error: unknown, context?: Record<string, unknown>) => {
  if (!monitoringEnabled) return;
  Sentry.captureException(error, { extra: context });
};
