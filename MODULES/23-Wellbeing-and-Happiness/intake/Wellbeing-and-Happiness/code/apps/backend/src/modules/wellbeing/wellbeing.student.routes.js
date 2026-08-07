// wellbeing.student.routes.js
// Student-facing endpoints (PRD Part 9 — "STUDENT (self only)").
// The actor IS the subject: student_id always comes from req.wb.actor_id,
// never from the URL — a student can only ever act on their own data.

const express = require('express');
const { requireRole } = require('../../middleware/auth');
const pulse = require('./wellbeing.pulse');
const journal = require('./wellbeing.journal');
const activities = require('./wellbeing.activities');
const consent = require('./wellbeing.consent');
const repo = require('./wellbeing.repo');
const flags = require('./wellbeing.flags');
const { scanForCrisis } = require('./wellbeing.crisis');
const { crisisDeps, emit } = require('./wellbeing.crisis.responder');

const router = express.Router();
// Per-route guard (not router.use) so unmatched paths fall through to other
// role routers instead of being 403'd by this one.
const only = requireRole('student');

const me = (req) => ({ org_id: req.wb.org_id, student_id: req.wb.actor_id });
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Crisis scan bound to real DB writers + alerting (see responder).
const scan = (args) => scanForCrisis(args, crisisDeps);

// ─── PULSE ──────────────────────────────────────────────────────
router.post('/pulse', only, wrap(async (req, res) => {
  const { mood, energy_1_5, note, context_tags, source } = req.body || {};
  const out = await pulse.submitPulse(
    { ...me(req), mood, energy_1_5, note, context_tags, source },
    { getConsent: repo.getConsent, scanForCrisis: scan }
  );
  // If a crisis was detected in the note, surface the support screen payload.
  res.json({ data: { submitted: !out.skipped, crisis: out.crisis || null } });
}));

router.get('/pulse/my', only, wrap(async (req, res) => {
  const days = Number(req.query.days) || 30;
  res.json({ data: await pulse.getMyTrend({ ...me(req), days }) });
}));

// ─── JOURNAL ────────────────────────────────────────────────────
router.get('/journal', only, wrap(async (req, res) => {
  res.json({ data: await journal.listMine(me(req)) });
}));

router.post('/journal', only, wrap(async (req, res) => {
  const { body, mood_tag } = req.body || {};
  const consentRow = await repo.getConsent(me(req));
  const out = await journal.createEntry(
    { ...me(req), body, mood_tag, age_band: consentRow?.age_band },
    { getConsent: repo.getConsent }
  );
  res.status(out.skipped ? 200 : 201).json({ data: out });
}));

router.get('/journal/:id', only, wrap(async (req, res) => {
  // Owner read — reason/audit not required for the student's own entry.
  const out = await journal.readEntry({
    id: Number(req.params.id), org_id: req.wb.org_id, actor_id: req.wb.actor_id, actor_role: 'student',
  });
  res.json({ data: out });
}));

router.post('/journal/:id/share', only, wrap(async (req, res) => {
  res.json({ data: await journal.shareEntry({ id: Number(req.params.id), ...me(req),
                                              case_id: req.body?.case_id ?? null }) });
}));

router.delete('/journal/:id/share', only, wrap(async (req, res) => {
  res.json({ data: await journal.unshareEntry({ id: Number(req.params.id), ...me(req) }) });
}));

// ⚠️ Hard delete — allowed here, on purpose.
router.delete('/journal/:id', only, wrap(async (req, res) => {
  res.json({ data: await journal.deleteEntry({ id: Number(req.params.id), ...me(req) }) });
}));

// ─── SELF-RAISE — "baat karni hai" (⭐ the bravest button) ───────
router.post('/flag/self-raise', only, wrap(async (req, res) => {
  const { message, urgency } = req.body || {};
  const out = await flags.raiseSelf({ ...me(req), message, urgency }, { emit });
  res.status(201).json({ data: out });
}));

router.delete('/flag/self-raise/:id', only, wrap(async (req, res) => {
  // A student can always cancel their own request (flag → resolved).
  const { wbDb } = require('../../config/db');
  await wbDb.query(
    `UPDATE wb_flag SET status = 'resolved', closed_at = NOW(), close_reason = 'cancelled_by_student'
      WHERE id = ? AND org_id = ? AND student_id = ? AND primary_driver = 'self_raise'`,
    [Number(req.params.id), req.wb.org_id, req.wb.actor_id]
  );
  res.json({ data: { cancelled: true } });
}));

// ─── ACTIVITIES ─────────────────────────────────────────────────
router.get('/activities', only, wrap(async (req, res) => {
  res.json({ data: await activities.listActivities({
    org_id: req.wb.org_id, mood: req.query.mood,
    maxDuration: req.query.duration ? Number(req.query.duration) : undefined,
  }) });
}));

router.post('/activities/:id/complete', only, wrap(async (req, res) => {
  res.json({ data: await activities.logCompletion({
    ...me(req), activity_id: Number(req.params.id), helpful_rating: req.body?.helpful_rating,
  }) });
}));

// ─── MY CASE — a student can see their own open case status ─────
router.get('/my/case', only, wrap(async (req, res) => {
  const { wbDb } = require('../../config/db');
  const row = await wbDb.queryOne(
    `SELECT status, priority, opened_at, first_contact_at, followup_at
       FROM wb_case WHERE org_id = ? AND student_id = ? AND status NOT IN ('closed','resolved')
      ORDER BY opened_at DESC LIMIT 1`, [req.wb.org_id, req.wb.actor_id]);
  res.json({ data: row });
}));

// ─── CONSENT ────────────────────────────────────────────────────
router.get('/consent', only, wrap(async (req, res) => {
  const row = await repo.getConsent(me(req));
  res.json({ data: row, policy: row ? consent.consentPolicy(row.age_band) : null });
}));

router.put('/consent', only, wrap(async (req, res) => {
  const { age_band, participates, parent_consent_at, student_assent_at } = req.body || {};
  const policy = consent.consentPolicy(age_band);
  const row = await repo.upsertConsent({
    ...me(req), age_band, participates,
    journal_enabled: policy.journal_enabled,
    parent_consent_at, student_assent_at,
  });
  res.json({ data: row });
}));

// ⚠️ Opt-out — one tap, zero friction, reason optional, invisible to staff.
router.post('/consent/opt-out', only, wrap(async (req, res) => {
  res.json({ data: await repo.optOut({ ...me(req), reason: req.body?.reason }) });
}));

module.exports = { router, STUDENT_ROUTE_PATHS: [
  '/api/wb/pulse', '/api/wb/pulse/my', '/api/wb/journal', '/api/wb/journal/:id',
  '/api/wb/journal/:id/share', '/api/wb/flag/self-raise', '/api/wb/activities',
  '/api/wb/activities/:id/complete', '/api/wb/consent', '/api/wb/consent/opt-out',
] };
