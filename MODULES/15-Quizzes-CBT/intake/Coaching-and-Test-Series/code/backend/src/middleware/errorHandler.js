// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

const logger = require('../utils/logger');

// ============================================
// CUSTOM ERROR CLASS
// ============================================
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ============================================
// ERROR HANDLER
// ============================================
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.userId
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_ERROR';
    let message = err.message || 'Something went wrong';

    // Handle specific errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.message;
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expired';
    }

    if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Duplicate entry found';
    }

    if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record not found';
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        error: {
            code: code,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

// ============================================
// 404 HANDLER
// ============================================
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
};

module.exports = {
    AppError,
    errorHandler,
    notFound
};