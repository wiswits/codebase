// db/migrate.js
// Applies db/migrations/*.sql in filename order using the ADMIN connection.
// The wb user grants file has __WB_USER__ / __WB_PASSWORD__ substituted from env.
//
// Usage: npm run migrate

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function substitute(sql) {
  return sql
    .replaceAll('__WB_USER__', process.env.WB_DB_USER || 'wiswits_wb')
    .replaceAll('__WB_PASSWORD__', process.env.WB_DB_PASSWORD || 'change-me-strong-secret');
}

async function main() {
  const dbName = process.env.DB_NAME || 'wiswits';

  // Connect WITHOUT a database first so we can create it if missing.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_ADMIN_USER || 'root',
    password: process.env.DB_ADMIN_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.changeUser({ database: dbName });

  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const sql = substitute(raw);
    process.stdout.write(`→ ${file} ... `);
    try {
      await conn.query(sql);
      console.log('ok');
    } catch (e) {
      console.log('FAILED');
      console.error(`  ${e.message}`);
      await conn.end();
      process.exit(1);
    }
  }

  await conn.end();
  console.log('\n✅ Migrations complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
