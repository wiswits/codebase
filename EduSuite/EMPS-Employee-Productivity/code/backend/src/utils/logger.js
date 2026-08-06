const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

exports.logger = logger;

exports.logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id || 'unauthenticated',
      role: req.user?.role || 'unauthenticated'
    };

    if (res.statusCode >= 400) {
      logger.error(log);
    } else {
      logger.info(log);
    }
  });

  next();
};

exports.logError = (error, context = '') => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

exports.logInfo = (message, data = {}) => {
  logger.info({
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
};

exports.logWarning = (message, data = {}) => {
  logger.warn({
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
};

exports.logDebug = (message, data = {}) => {
  logger.debug({
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
};