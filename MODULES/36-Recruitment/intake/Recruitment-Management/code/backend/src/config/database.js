import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

/**
 * Creates and returns a MySQL connection pool
 * In production, this would use shared platform pool
 */
export const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'recruitment_db',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // mysql2 returns DECIMAL columns (salary, CTC, rating, etc.) as strings
      // by default. The frontend types declare these as `number`, so without
      // this, values render fine as text but silently fail number formatting
      // (e.g. .toLocaleString() on a string just returns the string as-is).
      decimalNumbers: true,
    });
  }
  return pool;
};

/**
 * Shared query helper - executes SQL queries
 * In production, this would be imported from shared platform
 */
export const query = async (sql, params = []) => {
  const pool = createPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Shared transaction helper - executes multiple queries in a transaction
 * In production, this would be imported from shared platform
 */
export const withTransaction = async (callback) => {
  const pool = createPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { query, withTransaction, createPool };