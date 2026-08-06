// wellbeing.boot.js
//
// Boot-time self-check. The server will NOT start if a guardrail is broken.
// A running server with a broken promise is worse than a server that won't run.

const { WB_GUARDRAILS } = require('./wellbeing.guardrails');
const { adminPool } = require('../../config/db');

const DB_NAME = process.env.DB_NAME || 'wiswits';
const WB_USER = process.env.WB_DB_USER || 'wiswits_wb';

// The set of routes we ship. Used to prove no ranking endpoint slipped in.
const FORBIDDEN_ROUTE_FRAGMENTS = ['/rank', '/leaderboard', '/sorted', '/most-stressed',
                                   '/mood-vs-marks', '/export/all-moods', '/predict'];

async function verifyNoRankingEndpoints(routePaths = []) {
  const bad = routePaths.filter(p =>
    FORBIDDEN_ROUTE_FRAGMENTS.some(f => p.toLowerCase().includes(f)));
  return bad.length
    ? { ok: false, name: 'no-ranking-endpoints', reason: `forbidden routes present: ${bad.join(', ')}` }
    : { ok: true, name: 'no-ranking-endpoints' };
}

async function verifyDbGrantsExcludeAcademicTables() {
  // The wb user must NOT hold any privilege on the banned tables.
  try {
    const [grants] = await adminPool().query('SHOW GRANTS FOR ?@?', [WB_USER, '%']);
    const lines = grants.map(r => Object.values(r)[0]);
    const flat = lines.join('\n').toLowerCase();

    // No grant may name a banned academic/financial/discipline table.
    const leaked = WB_GUARDRAILS.NEVER_JOIN_TABLES.filter(t => flat.includes(t.toLowerCase()));

    // A blanket grant fails: the wb user must be scoped to wb_ only. But ignore
    // the benign, automatic `GRANT USAGE ON *.*` (USAGE = no privileges) that
    // every account carries — only a REAL privilege on *.* or schema-wide counts.
    const blanketLine = lines.find(l => {
      const low = l.toLowerCase();
      if (!/on \*\.\*|on `?wiswits`?\.\*/.test(low)) return false;
      return !/grant\s+usage\s+on/.test(low); // USAGE-only is fine
    });

    if (leaked.length || blanketLine) {
      return { ok: false, name: 'db-grants-scoped',
               reason: blanketLine ? 'wb user has a real blanket grant; must be wb_ scoped'
                                   : `wb user can reach banned tables: ${leaked.join(', ')}` };
    }
    return { ok: true, name: 'db-grants-scoped' };
  } catch (e) {
    // If the user doesn't exist yet (pre-migration), report clearly rather than crash.
    return { ok: false, name: 'db-grants-scoped',
             reason: `could not read grants for ${WB_USER} (run migrations?): ${e.message}` };
  }
}

async function verifyAuditTableAppendOnly() {
  try {
    const [rows] = await adminPool().query(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION
         FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = 'wb_access_audit'`,
      [DB_NAME]
    );
    const events = new Set(rows.map(r => r.EVENT_MANIPULATION));
    if (events.has('UPDATE') && events.has('DELETE')) {
      return { ok: true, name: 'audit-append-only' };
    }
    return { ok: false, name: 'audit-append-only',
             reason: 'wb_access_audit is missing UPDATE/DELETE-blocking triggers' };
  } catch (e) {
    return { ok: false, name: 'audit-append-only', reason: e.message };
  }
}

async function verifyJournalEncryptionKeyPresent() {
  const k = process.env.WB_MASTER_KEY;
  const ok = !!k && k !== 'change-me-32-byte-base64-master-key' && k.length >= 16;
  return ok
    ? { ok: true, name: 'journal-master-key' }
    : { ok: false, name: 'journal-master-key', reason: 'WB_MASTER_KEY is missing or default' };
}

async function verifyCrisisConfigLoaded() {
  const ok = WB_GUARDRAILS.CRISIS_KEYWORDS_TRIGGER_IMMEDIATE === true &&
             WB_GUARDRAILS.CRISIS_ALWAYS_SHOWS_HELPLINE === true;
  return ok
    ? { ok: true, name: 'crisis-config' }
    : { ok: false, name: 'crisis-config', reason: 'crisis guardrails not enabled' };
}

// Options let tests / partial environments skip the DB checks while still
// exercising the pure guardrail checks.
async function verifyGuardrailsAtBoot({ routePaths = [], skipDb = false } = {}) {
  const checks = [
    await verifyNoRankingEndpoints(routePaths),
    await verifyJournalEncryptionKeyPresent(),
    await verifyCrisisConfigLoaded(),
    ...(skipDb ? [] : [
      await verifyDbGrantsExcludeAcademicTables(),
      await verifyAuditTableAppendOnly(),
    ]),
  ];

  const failed = checks.filter(c => !c.ok);
  if (failed.length) {
    console.error('╔══════════════════════════════════════════════════╗');
    console.error('║  WELL-BEING GUARDRAIL VIOLATION — REFUSING BOOT  ║');
    console.error('╚══════════════════════════════════════════════════╝');
    failed.forEach(f => console.error(`  ❌ ${f.name}: ${f.reason}`));
  }
  return { ok: failed.length === 0, checks, failed };
}

module.exports = { verifyGuardrailsAtBoot, FORBIDDEN_ROUTE_FRAGMENTS };
