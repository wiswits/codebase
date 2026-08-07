const winston = require('winston');
const env = require('../config/env');

/**
 * Shared application logger (Engineering Standards §23).
 * Never log passwords, tokens, secrets, or raw request bodies containing
 * sensitive data.
 */
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wiswits-backend' },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
