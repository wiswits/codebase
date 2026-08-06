// wellbeing.counsellor.routes.js
// The only role with individual access — and every access is reasoned + audited.

const express = require('express');
const { requireRole } = require('../../middleware/auth');
const cases = require('./wellbeing.cases');
const { getStudentContext } = require('./wellbeing.context');
const { assertCanSeeIndividual } = require('./wellbeing.guardrails');
const { auditRead } = require('./wellbeing.audit');
const { wbDb } = require('../../config/db');

const router = express.Router();
const only = requireRole('counsellor');

const ctx = (req) => ({ org_id: req.wb.org_id, counsellor_id: req.wb.actor_id, actor_id: req.wb.actor_id, actor_role: 'counsellor' });
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── flags queue ────────────────────────────────────────────────
router.get('/flags', only, wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT id, student_id, severity, score, primary_driver, status, opened_at
       FROM wb_flag WHERE org_id = ? AND status IN ('open','acknowledged')
      ORDER BY FIELD(severity,'red','amber','green'), opened_at ASC`,
    [req.wb.org_id]
  );
  res.json({ data: rows });
}));

router.get('/flags/:id', only, wrap(async (req, res) => {
  const row = await wbDb.queryOne(
    `SELECT id, student_id, severity, score, primary_driver, status, opened_at
       FROM wb_flag WHERE id = ? AND org_id = ?`, [Number(req.params.id), req.wb.org_id]);
  if (!row) return res.status(404).json({ error: 'NotFound', message: 'Flag not found.' });
  res.json({ data: row });
}));

router.post('/flags/:id/acknowledge', only, wrap(async (req, res) => {
  await wbDb.query(
    `UPDATE wb_flag SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = ?
      WHERE id = ? AND org_id = ?`, [req.wb.actor_id, Number(req.params.id), req.wb.org_id]);
  res.json({ data: { acknowledged: true } });
}));

router.get('/my/caseload', only, wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT COUNT(*) AS open FROM wb_case WHERE org_id = ? AND counsellor_id = ? AND status NOT IN ('closed','resolved')`,
    [req.wb.org_id, req.wb.actor_id]);
  const open = Number(rows[0]?.open ?? 0);
  res.json({ data: { open_cases: open, max: 40, healthy: open <= 40 } });
}));

// ─── cases ──────────────────────────────────────────────────────
router.get('/cases', only, wrap(async (req, res) => {
  res.json({ data: await cases.listQueue({ org_id: req.wb.org_id, status: req.query.status, priority: req.query.priority }) });
}));

router.post('/cases', only, wrap(async (req, res) => {
  const { student_id, flag_id, priority } = req.body || {};
  res.status(201).json({ data: await cases.createCase({ ...ctx(req), student_id, flag_id, priority }) });
}));

router.get('/cases/:id', only, wrap(async (req, res) => {
  res.json({ data: await cases.getCase({ org_id: req.wb.org_id, id: Number(req.params.id) }) });
}));

router.patch('/cases/:id', only, wrap(async (req, res) => {
  res.json({ data: await cases.patchCase({ org_id: req.wb.org_id, id: Number(req.params.id), ...req.body }) });
}));

router.post('/cases/:id/acknowledge', only, wrap(async (req, res) => {
  res.json({ data: await cases.acknowledge({ ...ctx(req), id: Number(req.params.id) }) });
}));

router.post('/cases/:id/note', only, wrap(async (req, res) => {
  const { body, session_type, duration_min } = req.body || {};
  res.status(201).json({ data: await cases.addNote({ ...ctx(req), case_id: Number(req.params.id), body, session_type, duration_min }) });
}));

router.get('/cases/:id/notes', only, wrap(async (req, res) => {
  // Reading notes is a sensitive action — audited with a reason.
  const reason = req.query.reason;
  assertCanSeeIndividual('counsellor', req.wb.actor_id, Number(req.params.id), reason);
  await auditRead({ org_id: req.wb.org_id, actor_id: req.wb.actor_id, actor_role: 'counsellor',
                    subject_type: 'case', subject_id: Number(req.params.id), action: 'note', reason });
  res.json({ data: await cases.listNotes({ org_id: req.wb.org_id, case_id: Number(req.params.id) }) });
}));

router.post('/cases/:id/refer', only, wrap(async (req, res) => {
  res.status(201).json({ data: await cases.refer({ org_id: req.wb.org_id, case_id: Number(req.params.id), ...req.body }) });
}));

router.post('/cases/:id/close', only, wrap(async (req, res) => {
  res.json({ data: await cases.closeCase({ org_id: req.wb.org_id, id: Number(req.params.id), ...req.body }) });
}));

router.post('/cases/:id/followup', only, wrap(async (req, res) => {
  await wbDb.query(`UPDATE wb_case SET followup_at = ? WHERE id = ? AND org_id = ?`,
    [req.body?.followup_at ?? null, Number(req.params.id), req.wb.org_id]);
  res.json({ data: { scheduled: true } });
}));

// ⚠️ Parent loop-in — reason mandatory, logged with the child's response.
router.post('/cases/:id/share-with-parent', only, wrap(async (req, res) => {
  res.json({ data: await cases.loopInParent({ ...ctx(req), case_id: Number(req.params.id), ...req.body }) });
}));

// ─── the reason-gated context view ──────────────────────────────
router.get('/students/:id/context', only, wrap(async (req, res) => {
  const data = await getStudentContext({
    ...ctx(req), student_id: Number(req.params.id), reason: req.query.reason, ip: req.ip,
  });
  res.json({ data });
}));

router.get('/students/:id/pulse', only, wrap(async (req, res) => {
  const student_id = Number(req.params.id);
  assertCanSeeIndividual('counsellor', req.wb.actor_id, student_id, req.query.reason);
  await auditRead({ org_id: req.wb.org_id, actor_id: req.wb.actor_id, actor_role: 'counsellor',
                    subject_type: 'student', subject_id: student_id, action: 'view',
                    table_name: 'wb_pulse', reason: req.query.reason, ip: req.ip });
  const rows = await wbDb.query(
    `SELECT date, mood, energy_1_5, note FROM wb_pulse
      WHERE org_id = ? AND student_id = ? AND date >= (CURDATE() - INTERVAL 30 DAY) ORDER BY date DESC`,
    [req.wb.org_id, student_id]
  );
  res.json({ data: rows });
}));

// ⚠️ Shared journal entries only — reason mandatory, audited by decryptJournal.
router.get('/students/:id/journal', only, wrap(async (req, res) => {
  const journal = require('./wellbeing.journal');
  const { auditRead } = require('./wellbeing.audit');
  const student_id = Number(req.params.id);
  const rows = await wbDb.query(
    `SELECT id FROM wb_journal
      WHERE org_id = ? AND student_id = ? AND shared_with_counsellor = 1 AND deleted_at IS NULL
      ORDER BY created_at DESC`, [req.wb.org_id, student_id]);
  const out = [];
  for (const r of rows) {
    out.push(await journal.readEntry({
      id: r.id, org_id: req.wb.org_id, actor_id: req.wb.actor_id, actor_role: 'counsellor',
      reason: req.query.reason, auditRead,
    }));
  }
  res.json({ data: out });
}));

module.exports = { router, COUNSELLOR_ROUTE_PATHS: [
  '/api/wb/flags/:id', '/api/wb/my/caseload', '/api/wb/students/:id/journal',
  '/api/wb/flags', '/api/wb/cases', '/api/wb/cases/:id', '/api/wb/cases/:id/note',
  '/api/wb/cases/:id/share-with-parent', '/api/wb/students/:id/context', '/api/wb/students/:id/pulse',
] };
