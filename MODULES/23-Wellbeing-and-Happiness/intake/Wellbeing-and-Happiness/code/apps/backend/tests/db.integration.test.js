// tests/db.integration.test.js
//
// These prove the DB-LEVEL guardrails that code alone cannot: the restricted
// grant (wb user cannot see academic tables) and the append-only audit triggers.
//
// They require a live MySQL with migrations applied. They are SKIPPED unless
// WB_DB_INTEGRATION=1 is set, so the default `npm test` stays hermetic.
// Run with:  WB_DB_INTEGRATION=1 npm test

const RUN = process.env.WB_DB_INTEGRATION === '1';
const d = RUN ? describe : describe.skip;

d('🗄 DB-level guardrails (live MySQL)', () => {
  const mysql = require('mysql2/promise');
  let rawWbPool, closePools, adminConn;

  beforeAll(async () => {
    ({ rawWbPool, closePools } = require('../src/config/db'));
    // A privileged connection: only the TRIGGER (not a missing grant) can stop
    // an UPDATE/DELETE here, so this proves the append-only guarantee itself.
    adminConn = await mysql.createConnection({
      host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_ADMIN_USER, password: process.env.DB_ADMIN_PASSWORD,
      database: process.env.DB_NAME,
    });
  });
  afterAll(async () => { if (adminConn) await adminConn.end(); if (closePools) await closePools(); });

  it('the wb user cannot SELECT from client_exam_result (grant denies)', async () => {
    await expect(
      rawWbPool().execute('SELECT * FROM client_exam_result LIMIT 1')
    ).rejects.toThrow(/denied|SELECT command|doesn't exist/i);
  });

  it('the wb user cannot SELECT from client_fees', async () => {
    await expect(
      rawWbPool().execute('SELECT * FROM client_fees LIMIT 1')
    ).rejects.toThrow(/denied|SELECT command|doesn't exist/i);
  });

  it('the wb user has no UPDATE/DELETE grant on the audit table (first line of defence)', async () => {
    await expect(
      rawWbPool().execute('UPDATE wb_access_audit SET reason = "x" ORDER BY id DESC LIMIT 1')
    ).rejects.toThrow(/denied/i);
  });

  it('wb_access_audit rejects UPDATE even for a privileged user (append-only trigger)', async () => {
    await adminConn.execute(
      `INSERT INTO wb_access_audit (org_id, actor_id, actor_role, subject_type, action, reason)
       VALUES (1, 1, 'counsellor', 'student', 'view', 'integration test row aaaa')`
    );
    await expect(
      adminConn.execute('UPDATE wb_access_audit SET reason = "changed" ORDER BY id DESC LIMIT 1')
    ).rejects.toThrow(/append-only/i);
  });

  it('wb_access_audit rejects DELETE even for a privileged user (append-only trigger)', async () => {
    await expect(
      adminConn.execute('DELETE FROM wb_access_audit ORDER BY id DESC LIMIT 1')
    ).rejects.toThrow(/append-only/i);
  });
});
