import mariadb, { Pool, PoolConnection } from "mariadb";
import { env } from "./env.js";

export const pool: Pool = mariadb.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  connectionLimit: env.database.connectionLimit,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
});

export async function testDatabaseConnection(): Promise<void> {
  let connection: PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
    await connection.query("SELECT 1 AS database_check");
    console.log("✓ MariaDB connection successful");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}