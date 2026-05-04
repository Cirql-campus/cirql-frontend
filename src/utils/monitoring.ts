let monitoringEnabled = false;

export const initMonitoring = () => {
  // Monitoring removed
};

export const captureFrontendException = (error: unknown, context?: Record<string, unknown>) => {
  console.error('[Frontend Error]', error, context);
};
