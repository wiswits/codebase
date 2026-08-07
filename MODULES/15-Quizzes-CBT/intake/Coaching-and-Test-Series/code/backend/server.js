// ============================================
// EDUTECH BACKEND - SERVER
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

// ============================================
// DATABASE CONNECTION
// ============================================
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edutech',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
});

pool.connect((err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to PostgreSQL database');
});

// ============================================
// EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// REQUEST LOGGING
// ============================================
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: pool ? 'connected' : 'disconnected'
    });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', require('./src/routes/authRoutes')(pool));
app.use('/api/students', require('./src/routes/studentRoutes')(pool));
app.use('/api/faculty', require('./src/routes/facultyRoutes')(pool));
app.use('/api/tests', require('./src/routes/testRoutes')(pool));
app.use('/api/attempts', require('./src/routes/attemptRoutes')(pool));
app.use('/api/analytics', require('./src/routes/analyticsRoutes')(pool));
app.use('/api/errorbook', require('./src/routes/errorBookRoutes')(pool));
app.use('/api/dpps', require('./src/routes/dppRoutes')(pool));
app.use('/api/doubts', require('./src/routes/doubtRoutes')(pool));
app.use('/api/omr', require('./src/routes/omrRoutes')(pool));
// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, pool };