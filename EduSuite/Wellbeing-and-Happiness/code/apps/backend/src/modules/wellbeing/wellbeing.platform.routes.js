// wellbeing.platform.routes.js
// The remaining Part-9 surface: AUDIT (platform_owner), CRISIS events
// (counsellor + platform_owner), STAFF well-being, and lightweight WIDGETS.

const express = require('express');
const { requireRole } = require('../../middleware/auth');
const auditReports = require('./wellbeing.audit.reports');
const crisisEvents = require('./wellbeing.crisis.events');
const staff = require('./wellbeing.staff');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── AUDIT — platform_owner only ────────────────────────────────
const audit = express.Router();
const onlyOwner = requireRole('platform_owner');

audit.get('/audit', onlyOwner, wrap(async (req, res) =>
  res.json({ data: await auditReports.listAudit({ org_id: req.wb.org_id, limit: req.query.limit }) })));
audit.get('/audit/student/:id', onlyOwner, wrap(async (req, res) =>
  res.json({ data: await auditReports.auditForStudent({ org_id: req.wb.org_id, student_id: Number(req.params.id) }) })));
audit.get('/audit/actor/:id', onlyOwner, wrap(async (req, res) =>
  res.json({ data: await auditReports.auditForActor({ org_id: req.wb.org_id, actor_id: Number(req.params.id) }) })));
audit.get('/guardrail-violations', onlyOwner, wrap(async (req, res) =>
  res.json({ data: await auditReports.listViolations({ org_id: req.wb.org_id }) })));

// ─── CRISIS events — counsellor + platform_owner ────────────────
const crisis = express.Router();
const onlyCrisis = requireRole('counsellor', 'platform_owner');

crisis.get('/crisis/events', onlyCrisis, wrap(async (req, res) =>
  res.json({ data: await crisisEvents.listCrisisEvents({ org_id: req.wb.org_id, resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined }) })));
crisis.post('/crisis/:id/respond', onlyCrisis, wrap(async (req, res) =>
  res.json({ data: await crisisEvents.respondToCrisis({ org_id: req.wb.org_id, id: Number(req.params.id), responded_by: req.wb.actor_id, ...req.body }) })));

// ─── STAFF well-being ───────────────────────────────────────────
const staffRouter = express.Router();
const staffSelf = (req) => ({ org_id: req.wb.org_id, staff_id: req.wb.actor_id });

staffRouter.get('/staff-check', requireRole('teacher', 'counsellor', 'principal', 'staff'), wrap(async (req, res) =>
  res.json({ data: await staff.myStaffCheck(staffSelf(req)) })));
staffRouter.post('/staff-check', requireRole('teacher', 'counsellor', 'principal', 'staff'), wrap(async (req, res) =>
  res.json({ data: await staff.submitStaffCheck({ ...staffSelf(req), ...req.body }) })));
staffRouter.get('/staff/aggregate', requireRole('principal'), wrap(async (req, res) =>
  res.json({ data: await staff.staffAggregate({ org_id: req.wb.org_id, week_start: req.query.week_start }) })));

// ─── WIDGETS — small role-scoped summaries ──────────────────────
const widgets = express.Router();
const { wbDb } = require('../../config/db');

widgets.get('/widgets/my-pulse', requireRole('student'), wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT date, mood FROM wb_pulse WHERE org_id = ? AND student_id = ? ORDER BY date DESC LIMIT 7`,
    [req.wb.org_id, req.wb.actor_id]);
  res.json({ data: rows });
}));
widgets.get('/widgets/case-queue', requireRole('counsellor'), wrap(async (req, res) => {
  const rows = await wbDb.query(
    `SELECT COUNT(*) AS open FROM wb_case WHERE org_id = ? AND status NOT IN ('closed','resolved')`,
    [req.wb.org_id]);
  res.json({ data: { open_cases: Number(rows[0]?.open ?? 0) } });
}));

module.exports = {
  audit, crisis, staffRouter, widgets,
  PLATFORM_ROUTE_PATHS: [
    '/api/wb/audit', '/api/wb/audit/student/:id', '/api/wb/audit/actor/:id', '/api/wb/guardrail-violations',
    '/api/wb/crisis/events', '/api/wb/crisis/:id/respond',
    '/api/wb/staff-check', '/api/wb/staff/aggregate',
    '/api/wb/widgets/my-pulse', '/api/wb/widgets/case-queue',
  ],
};
