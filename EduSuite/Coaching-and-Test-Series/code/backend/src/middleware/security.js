// ============================================
// SECURITY MIDDLEWARE
// ============================================

const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');

// ============================================
// CORS CONFIGURATION
// ============================================
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// ============================================
// HELMET CONFIGURATION
// ============================================
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
});

// ============================================
// SECURITY MIDDLEWARE
// ============================================
const securityMiddleware = [
    helmetConfig,
    cors(corsOptions),
    xss(),
    hpp()
];

module.exports = {
    securityMiddleware,
    corsOptions,
    helmetConfig
};