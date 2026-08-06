// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

const logger = require('../utils/logger');

// ============================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================
const requiredEnvVars = [
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET',
];

const optionalEnvVars = [
    'DB_PORT',
    'DB_PASSWORD',
    'DB_SSL',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX',
    'NODE_ENV'
];

// ============================================
// VALIDATE ENVIRONMENT
// ============================================
const validateEnv = () => {
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        logger.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Check for empty values
    const empty = requiredEnvVars.filter(varName => process.env[varName].trim() === '');
    if (empty.length > 0) {
        logger.error(`❌ Empty required environment variables: ${empty.join(', ')}`);
        process.exit(1);
    }

    logger.info('✅ Environment variables validated successfully');
};

// ============================================
// GET CONFIG
// ============================================
const getConfig = () => {
    return {
        // Server
        port: parseInt(process.env.PORT) || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        isTest: process.env.NODE_ENV === 'test',

        // Database
        db: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            name: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_SSL === 'true'
        },

        // JWT
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },

        // CORS
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
        },

        // Rate Limiting
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100
        },

        // File Upload
        upload: {
            maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        },

        // Email
        email: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASS
        }
    };
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    validateEnv,
    getConfig,
    requiredEnvVars,
    optionalEnvVars
};