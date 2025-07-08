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
  }
};
