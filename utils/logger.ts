codex/revisar-y-reemplazar-console.log
export const logInfo = (...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const logError = (...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);

export const isLoggingEnabled = import.meta.env.VITE_ENABLE_LOGGING === 'true';

export const logger = {
  log: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.error(...args);
    }
main
  }
};
