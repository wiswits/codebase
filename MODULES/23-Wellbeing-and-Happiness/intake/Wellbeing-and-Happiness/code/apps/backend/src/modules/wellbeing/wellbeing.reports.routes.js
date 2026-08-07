// wellbeing.reports.routes.js
// Three concerns: the PUBLIC anonymous report (no auth), the counsellor review
// queue, and the principal wellness board + stats.

const express = require('express');
const { requireRole } = require('../../middleware/auth');
const reports = require('./wellbeing.reports');
const board = require('./wellbeing.board');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── PUBLIC — anonymous, no auth, NO ip/device/session stored ────
const publicRouter = express.Router();

publicRouter.post('/report/bullying', wrap(async (req, res) => {
  // ⚠️ We deliberately read NOTHING identifying from the request — not req.ip,
  //    not headers, not a session. Only the fields the reporter chose to send.
  const { org_id, student_id, incident_type, description,
          reporter_class_hint, target_hint, location_hint, frequency } = req.body || {};
  const out = await reports.fileReport({
    org_id: Number(org_id) || (req.wb?.org_id ?? null),
    student_id: student_id ? Number(student_id) : null, // optional; hashed, never stored raw
    incident_type, description, reporter_class_hint, target_hint, location_hint, frequency,
  });
  res.status(201).json({ data: out });
}));

publicRouter.get('/report/status/:token', wrap(async (req, res) => {
  res.json({ data: await reports.reportStatus({ token: req.params.token }) });
}));

// ─── COUNSELLOR — review queue ──────────────────────────────────
const counsellorReports = express.Router();
const onlyC = requireRole('counsellor');

counsellorReports.get('/reports', onlyC, wrap(async (req, res) => {
  res.json({ data: await reports.reviewQueue({ org_id: req.wb.org_id, status: req.query.status }) });
}));

counsellorReports.patch('/reports/:id', onlyC, wrap(async (req, res) => {
  res.json({ data: await reports.updateReport({ org_id: req.wb.org_id, id: Number(req.params.id), ...req.body }) });
}));

// ─── PRINCIPAL — wellness board + stats (counts only) ───────────
const principalBoard = express.Router();
const onlyP = requireRole('principal');

principalBoard.get('/wellness-board', onlyP, wrap(async (req, res) => {
  res.json({ data: await board.wellnessBoard({ org_id: req.wb.org_id }) });
}));

principalBoard.get('/wellness-board/classes', onlyP, wrap(async (req, res) => {
  res.json({ data: await board.boardByClass({ org_id: req.wb.org_id }) });
}));

principalBoard.get('/reports/stats', onlyP, wrap(async (req, res) => {
  res.json({ data: await reports.reportStats({ org_id: req.wb.org_id }) });
}));

module.exports = {
  publicRouter, counsellorReports, principalBoard,
  REPORT_ROUTE_PATHS: [
    '/api/wb/report/bullying', '/api/wb/report/status/:token',
    '/api/wb/reports', '/api/wb/reports/:id',
    '/api/wb/wellness-board', '/api/wb/wellness-board/classes', '/api/wb/reports/stats',
  ],
};
