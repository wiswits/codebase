// ============================================
// DATABASE CONFIGURATION
// ============================================

const { Pool } = require('pg');

// Simple console logger (since logger.js might not be loaded yet)
const log = {
    info: (...args) => console.log('📘', ...args),
    error: (...args) => console.error('❌', ...args),
    debug: (...args) => console.debug('🔍', ...args),
    warn: (...args) => console.warn('⚠️', ...args)
};

// ============================================
// CREATE POOL
// ============================================
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'edutech',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// ============================================
// POOL EVENTS
// ============================================
pool.on('connect', (client) => {
    log.info('✅ New database connection established');
});

pool.on('acquire', (client) => {
    log.debug('🔗 Client acquired from pool');
});

pool.on('remove', (client) => {
    log.debug('🔓 Client released from pool');
});

pool.on('error', (err) => {
    log.error('❌ Database error:', err.message);
});

// ============================================
// TEST CONNECTION
// ============================================
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as time');
        client.release();
        log.info(`✅ Database connected successfully at ${result.rows[0].time}`);
        return true;
    } catch (error) {
        log.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// ============================================
// QUERY HELPER
// ============================================
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        log.debug('📊 Query executed', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        log.error('❌ Query failed:', { text, error: error.message });
        throw error;
    }
};

// ============================================
// TRANSACTION HELPER
// ============================================
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    getPool: () => pool
};