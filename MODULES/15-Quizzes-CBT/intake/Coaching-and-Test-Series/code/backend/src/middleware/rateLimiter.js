// ============================================
// RATE LIMITER MIDDLEWARE
// ============================================

const rateLimit = require('express-rate-limit');

// ============================================
// GENERAL RATE LIMIT
// ============================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// AUTH RATE LIMIT (Stricter)
// ============================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts, please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// TEST ATTEMPT RATE LIMIT
// ============================================
const testAttemptLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many test attempts, please wait before trying again.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// DOUBT RATE LIMIT
// ============================================
const doubtLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 doubts per hour
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many doubts raised, please wait before raising more.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    testAttemptLimiter,
    doubtLimiter
};