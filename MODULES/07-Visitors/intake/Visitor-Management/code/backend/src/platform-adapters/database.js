import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * LOCAL INTEGRATION ADAPTER
 *
 * Used only because EduSuite's production shared DB utilities are not
 * available inside this standalone integration workspace.
 *
 * Visitor module code must use only:
 *   query(...)
 *   withTransaction(...)
 *
 * During production integration this adapter should be replaced by
 * EduSuite's shared { query, withTransaction } implementation.
 */

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: "utf8mb4",
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function withTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const transaction = {
      async query(sql, params = []) {
        const [rows] = await connection.execute(sql, params);
        return rows;
      },
    };

    const result = await callback(transaction);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function checkDatabaseConnection() {
  const rows = await query("SELECT 1 AS connected");
  return rows[0]?.connected === 1;
}

export async function closeDatabase() {
  await pool.end();
}