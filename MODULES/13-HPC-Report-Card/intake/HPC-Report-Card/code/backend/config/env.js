/**
 * ============================================================
 * WisWits SaaS Platform
 * HPC Report Card Module
 * Environment Configuration
 * ------------------------------------------------------------
 * Responsibility:
 * - Load environment variables
 * - Validate required configuration
 * - Export immutable configuration object
 * ============================================================
 */

import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "NODE_ENV"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
    }
}

const env = Object.freeze({

    app: {
        name: process.env.APP_NAME || "WisWits HPC Report Card",
        version: process.env.APP_VERSION || "1.0.0",
        environment: process.env.NODE_ENV,
        port: Number(process.env.PORT)
    },

    database: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,

        connectionLimit: 10,
        acquireTimeout: 30000,
        idleTimeout: 60000,

        multipleStatements: false,
        bigIntAsNumber: true,
        insertIdAsNumber: true
    }

});

export default env;