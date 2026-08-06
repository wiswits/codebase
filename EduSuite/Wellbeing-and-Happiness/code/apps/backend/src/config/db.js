// config/db.js
// Two pools, on purpose:
//
//   wbPool    — the restricted wellbeing runtime user. Every query it runs is
//               passed through the query linter first, so a banned JOIN throws
//               in code BEFORE it ever reaches MySQL (which would also reject it
//               at the grant level — belt and suspenders).
//
//   adminPool — only for migrations / boot self-checks that must inspect grants.
//               Never used to serve requests.

const crypto = require('crypto');
const mysql = require('mysql2/promise');
const { assertNoBannedJoin } = require('../modules/wellbeing/wellbeing.guardrails');
const { GuardrailViolation } = require('../modules/wellbeing/wellbeing.errors');

require('dotenv').config();

let _wbPool = null;
let _adminPool = null;

function adminPool() {
  if (!_adminPool) {
    _adminPool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_ADMIN_USER || 'root',
      password: process.env.DB_ADMIN_PASSWORD || '',
      database: process.env.DB_NAME || 'wiswits',
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return _adminPool;
}

function rawWbPool() {
  if (!_wbPool) {
    _wbPool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.WB_DB_USER || 'wiswits_wb',
      password: process.env.WB_DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wiswits',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return _wbPool;
}

// Record a blocked guardrail violation to its append-only-ish table and alert.
// Best-effort: a failure to log must never mask the original violation.
async function recordViolation(sql, err) {
  try {
    const queryHash = crypto.createHash('sha256').update(sql).digest('hex');
    await rawWbPool().execute(
      `INSERT INTO wb_guardrail_violation (guardrail, attempted_action, query_hash, blocked_at)
       VALUES (?,?,?,NOW())`,
      ['NEVER_JOIN_TABLES', String(err.message).slice(0, 500), queryHash]
    );
  } catch { /* swallow — never hide the real error */ }
  // ⚠️ In production this also pages the platform owner (AK Sir).
  console.error('🚨 [GUARDRAIL VIOLATION]', err.message);
}

// The wb-facing db handle. All wellbeing code uses THIS, never a raw pool.
// Guarantee: no query with a banned academic/financial/discipline join runs —
// and any attempt is recorded + alerted before the error propagates.
const wbDb = {
  async query(sql, params) {
    try {
      assertNoBannedJoin(sql);
    } catch (err) {
      if (err instanceof GuardrailViolation) await recordViolation(sql, err);
      throw err;
    }
    const [rows] = await rawWbPool().execute(sql, params ?? []);
    return rows;
  },
  async queryOne(sql, params) {
    const rows = await wbDb.query(sql, params);
    return rows[0] ?? null;
  },
};

async function closePools() {
  if (_wbPool) { await _wbPool.end(); _wbPool = null; }
  if (_adminPool) { await _adminPool.end(); _adminPool = null; }
}

module.exports = { wbDb, adminPool, rawWbPool, closePools };
