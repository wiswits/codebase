'use strict';

/**
 * Simple forward-only migration runner.
 * Executes every .sql file in ./migrations in lexical order.
 *
 *   node src/db/migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'wiswits_pl';
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();
  return dbName;
}

async function run() {
  const dbName = await ensureDatabase();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  });

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write(`→ applying ${file} ... `);
    await conn.query(sql);
    console.log('ok');
  }

  await conn.end();
  console.log(`✓ ${files.length} migration(s) applied to ${dbName}`);
}

run().catch((err) => {
  console.error('✗ migration failed:', err.message);
  process.exit(1);
});
