const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * ============================================================
 * Connection Pool
 * ============================================================
 */

const pool = mysql.createPool({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0,

    charset: "utf8mb4"

});

/**
 * ============================================================
 * Test Database Connection
 * ============================================================
 */

const testConnection = async () => {

    try {

        const connection = await pool.getConnection();

        console.log("==========================================");
        console.log("✅ MariaDB Connected Successfully");
        console.log(`📂 Database : ${process.env.DB_NAME}`);
        console.log("==========================================");

        connection.release();

    } catch (error) {

        console.error("==========================================");
        console.error("❌ Database Connection Failed");
        console.error(error.message);
        console.error("==========================================");

        process.exit(1);

    }

};

module.exports = {
    pool,
    testConnection
};