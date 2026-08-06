// wellbeing.staff.routes.js
// Teacher + Principal endpoints. AGGREGATE ONLY. No individual mood, ever.

const express = require('express');
const { requireRole } = require('../../middleware/auth');
const { classMood } = require('./wellbeing.aggregate');
const { raiseConcern, myConcerns } = require('./wellbeing.concern');
const { evaluateAndFlag } = require('./wellbeing.flags');
const { getConsent } = require('./wellbeing.repo');
const { wbDb } = require('../../config/db');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Sources bundle for re-evaluating a flag after a concern (reads wb_* only).
const evalSources = {
  getConsent,
  getStoredSignals: async ({ org_id, student_id }) => wbDb.query(
    `SELECT source, weight, detail_json AS detail FROM wb_signal
      WHERE org_id = ? AND student_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
    [org_id, student_id]),
  getRecentPulses: async ({ org_id, student_id }) => wbDb.query(
    `SELECT date, mood, energy_1_5 FROM wb_pulse
      WHERE org_id = ? AND student_id = ? AND date >= (CURDATE() - INTERVAL 14 DAY)`,
    [org_id, student_id]),
};
const evaluate = ({ org_id, student_id }) =>
  evaluateAndFlag({ org_id, student_id }, evalSources, {});

// ─── TEACHER (aggregate + concern) ──────────────────────────────
const teacher = express.Router();
const onlyT = requireRole('teacher', 'principal');

teacher.get('/class/:id/mood', onlyT, wrap(async (req, res) => {
  // :id encodes class_no or class_no-section, e.g. "10-A" or "10".
  const [class_no, section] = String(req.params.id).split('-');
  res.json({ data: await classMood({ org_id: req.wb.org_id, class_no, section }) });
}));

teacher.post('/concern', onlyT, wrap(async (req, res) => {
  const { student_id, note, urgency } = req.body || {};
  const out = await raiseConcern(
    { org_id: req.wb.org_id, actor_id: req.wb.actor_id, actor_role: req.wb.role, student_id, note, urgency },
    { evaluate }
  );
  res.status(201).json({ data: out }); // ⚠️ no outcome, by design
}));

teacher.get('/my/concerns', onlyT, wrap(async (req, res) => {
  res.json({ data: await myConcerns({ org_id: req.wb.org_id, actor_id: req.wb.actor_id }) });
}));

// ─── PRINCIPAL (counts only, no names) ──────────────────────────
const principal = express.Router();
const onlyP = requireRole('principal');

principal.get('/case-stats', onlyP, wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT status, COUNT(*) AS n FROM wb_case WHERE org_id = ? GROUP BY status`,
    [req.wb.org_id]
  );
  res.json({ data: { by_status: rows } }); // ⚠️ counts only
}));

principal.get('/counsellor-health', onlyP, wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT counsellor_id, COUNT(*) AS open_cases
       FROM wb_case WHERE org_id = ? AND status NOT IN ('closed','resolved')
      GROUP BY counsellor_id`,
    [req.wb.org_id]
  );
  res.json({ data: rows.map((r) => ({ ...r, healthy: r.open_cases <= 40 })) });
}));

module.exports = {
  teacher, principal,
  STAFF_ROUTE_PATHS: [
    '/api/wb/class/:id/mood', '/api/wb/concern', '/api/wb/my/concerns',
    '/api/wb/case-stats', '/api/wb/counsellor-health',
  ],
};
