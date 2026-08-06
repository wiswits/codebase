// ============================================
// RATE LIMIT CONFIGURATION
// ============================================

const rateLimit = require('express-rate-limit');

// ============================================
// RATE LIMIT CONFIG
// ============================================
const rateLimitConfig = {
    // General API
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
    
    // Auth endpoints
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many login attempts, please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
    },
    
    // Test attempts
    testAttempt: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 3,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many test attempts, please wait before trying again.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
    
    // Doubt creation
    doubt: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many doubts raised, please wait before raising more.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
    
    // DPP generation
    dpp: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many DPP requests, please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
    
    // Report generation
    report: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20,
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many report requests, please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false,
    },
};

// ============================================
// CREATE RATE LIMITERS
// ============================================
const createRateLimiter = (config) => {
    return rateLimit(config);
};

// ============================================
// KEY GENERATORS
// ============================================
const keyGenerators = {
    user: (req) => {
        return req.userId || req.ip;
    },
    ip: (req) => {
        return req.ip;
    },
    userAndIp: (req) => {
        return `${req.ip}-${req.userId || 'anonymous'}`;
    }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    rateLimitConfig,
    createRateLimiter,
    keyGenerators
};