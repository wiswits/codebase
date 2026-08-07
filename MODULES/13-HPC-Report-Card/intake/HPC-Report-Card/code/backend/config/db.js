/**
 * ============================================================
 * WisWits SaaS Platform
 * HPC Report Card Module
 * Database Configuration
 * ------------------------------------------------------------
 * Responsibility:
 * - Create MariaDB connection pool
 * - Test database connection
 * - Export pool
 * ============================================================
 */

import mariadb from "mariadb";
import env from "./env.js";

const pool = mariadb.createPool({

    host: env.database.host,

    port: env.database.port,

    user: env.database.user,

    password: env.database.password,

    database: env.database.database,

    connectionLimit: env.database.connectionLimit,

    acquireTimeout: env.database.acquireTimeout,

    idleTimeout: env.database.idleTimeout,

    multipleStatements: env.database.multipleStatements,

    bigIntAsNumber: env.database.bigIntAsNumber,

    insertIdAsNumber: env.database.insertIdAsNumber

});

/**
 * ============================================================
 * Test Database Connection
 * ============================================================
 */

export const testDatabaseConnection = async () => {

    let connection;

    try {

        connection = await pool.getConnection();

        const result = await connection.query("SELECT DATABASE() AS database_name;");

        console.log("====================================================");
        console.log("Database Connection Successful");
        console.log(`Database : ${result[0].database_name}`);
        console.log("MariaDB Pool Initialized");
        console.log("====================================================");

    } catch (error) {

        console.error("====================================================");
        console.error("Database Connection Failed");
        console.error(error.message);
        console.error("====================================================");

        process.exit(1);

    } finally {

        if (connection) {
            connection.release();
        }

    }

};

/**
 * ============================================================
 * Execute Parameterized Query
 * ============================================================
 */

export const executeQuery = async (sql, params = []) => {

    let connection;

    try {

        connection = await pool.getConnection();

        const result = await connection.query(sql, params);

        return result;

    } catch (error) {

        throw error;

    } finally {

        if (connection) {
            connection.release();
        }

    }

};

/**
 * ============================================================
 * Transaction Helper
 * ============================================================
 */

export const executeTransaction = async (callback) => {

    let connection;

    try {

        connection = await pool.getConnection();

        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();

        return result;

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        throw error;

    } finally {

        if (connection) {
            connection.release();
        }

    }

};

export default pool;