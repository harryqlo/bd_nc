export const logInfo = (...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const logError = (...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};
