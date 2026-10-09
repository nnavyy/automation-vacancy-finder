// Structured Logger Utility
// Can be replaced with Pino or Winston for advanced log shipping to Datadog/Sentry

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: Record<string, any>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  switch (level) {
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.debug(JSON.stringify(logEntry));
      }
      break;
  }
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
  debug: (msg: string, meta?: any) => log('debug', msg, meta),
};
