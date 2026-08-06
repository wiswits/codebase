// wellbeing.routes.js
// The /api/wb route surface (PRD Part 9). Week 1 mounts only the always-safe,
// no-auth-needed endpoints (health, helplines placeholder) plus a machine-
// readable route manifest the boot check inspects to prove no ranking endpoint
// slipped in. Feature routes are added week by week.
//
// ⚠️ Endpoints that will NEVER exist (PRD Part 9): /rank, /leaderboard,
//    /students/sorted-by-mood, /most-stressed, /mood-vs-marks,
//    /export/all-moods, /predict/at-risk. There is no code path to add them.

const express = require('express');
const { getHelplines } = require('./wellbeing.helplines');
const { attachContext } = require('../../middleware/auth');
const { router: studentRouter, STUDENT_ROUTE_PATHS } = require('./wellbeing.student.routes');
const { router: counsellorRouter, COUNSELLOR_ROUTE_PATHS } = require('./wellbeing.counsellor.routes');
const { teacher: teacherRouter, principal: principalRouter, STAFF_ROUTE_PATHS } = require('./wellbeing.staff.routes');
const { publicRouter, counsellorReports, principalBoard, REPORT_ROUTE_PATHS } = require('./wellbeing.reports.routes');
const { audit: auditRouter, crisis: crisisRouter, staffRouter, widgets: widgetsRouter, PLATFORM_ROUTE_PATHS } = require('./wellbeing.platform.routes');

const router = express.Router();

// Attach the (stand-in) auth context to every wellbeing request.
router.use(attachContext);

// Liveness — safe for anyone, reveals nothing about any child.
router.get('/health', (_req, res) => {
  res.json({ ok: true, module: 'wellbeing', prefix: '/api/wb' });
});

// Helplines are ALWAYS available, no auth, on purpose (PRD Part 11).
// Full registry, sorted by priority. A school's local resources are appended by
// the injected loader (none in Week 3; DB-backed later).
router.get('/helplines', async (req, res, next) => {
  try {
    const orgId = Number(req.query.org_id) || null;
    res.json({ data: await getHelplines(orgId) });
  } catch (e) { next(e); }
});

// Role-scoped routers. Each enforces its own role internally; order is fine
// because their paths don't collide (student self-only vs counsellor /cases vs
// staff /class). Auth context is already attached above.
router.use('/', publicRouter);        // anonymous report — no auth
router.use('/', studentRouter);
router.use('/', counsellorRouter);
router.use('/', counsellorReports);
router.use('/', teacherRouter);
router.use('/', principalRouter);
router.use('/', principalBoard);
router.use('/', auditRouter);         // platform_owner
router.use('/', crisisRouter);        // counsellor + platform_owner
router.use('/', staffRouter);         // staff self + principal aggregate
router.use('/', widgetsRouter);

// The concrete paths mounted, for the boot self-check.
const ROUTE_PATHS = [
  '/api/wb/health', '/api/wb/helplines',
  ...STUDENT_ROUTE_PATHS, ...COUNSELLOR_ROUTE_PATHS, ...STAFF_ROUTE_PATHS,
  ...REPORT_ROUTE_PATHS, ...PLATFORM_ROUTE_PATHS,
];

module.exports = { router, ROUTE_PATHS };
