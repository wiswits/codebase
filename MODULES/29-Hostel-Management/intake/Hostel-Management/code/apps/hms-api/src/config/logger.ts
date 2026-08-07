import pino from 'pino';
import { config } from './index';

const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  level: config.logLevel,
  redact: ['password', 'token', 'authorization'],
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.nodeEnv,
    service: 'hms-api',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export const createChildLogger = (bindings: Record<string, any>) => {
  return logger.child(bindings);
};

export const getRequestLogger = (req: any) => {
  return logger.child({
    reqId: req.id,
    reqMethod: req.method,
    reqUrl: req.url,
  });
};