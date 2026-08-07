// ============================================
// LOGGER UTILITY
// ============================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ============================================
// CREATE LOGS DIRECTORY
// ============================================
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// ============================================
// LOG FORMATS
// ============================================
const formats = {
    console: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${message}${metaStr}`;
        })
    ),
    file: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    error: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    )
};

// ============================================
// CREATE LOGGER
// ============================================
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // Console transport
        new winston.transports.Console({
            format: formats.console,
            silent: process.env.NODE_ENV === 'test'
        }),
        
        // Combined log file
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: formats.file,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Error log file
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            format: formats.error,
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ]
});

// ============================================
// STREAM FOR MORGAN
// ============================================
const stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const logRequest = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userId: req.userId
        });
    });
    next();
};

const logError = (err, req, res, next) => {
    logger.error(err.message, {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.userId
    });
    next(err);
};

module.exports = {
    logger,
    stream,
    logRequest,
    logError
};