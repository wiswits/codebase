const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Single shared MariaDB connection pool (Engineering Standards §18).
 * No module should create its own independent connection.
 */
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  waitForConnections: true,
  namedPlaceholders: false,
  dateStrings: false,
});

pool.on('connection', () => {
  logger.debug('New MariaDB connection established');
});

/**
 * Runs `callback` inside a database transaction using a single connection
 * checked out from the shared pool. Commits on success, rolls back on error,
 * and always releases the connection (Engineering Standards §19).
 *
 * @template T
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 */
async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      logger.error('Failed to roll back transaction', { error: rollbackErr.message });
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
