'use strict';

/**
 * /api/pl/cycles/* — Recovery cycle read APIs.
 * cycles/stats is THE sales number (spec 3.6). DB-backed with a clear message
 * when the database isn't reachable in local dev.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');

const STATS_SQL = `
  SELECT
    COUNT(*)                                                          AS gaps_detected,
    SUM(outcome = 'closed')                                           AS gaps_closed,
    ROUND(SUM(outcome = 'closed') / NULLIF(COUNT(*),0) * 100)         AS close_rate,
    ROUND(AVG(CASE WHEN outcome = 'closed' THEN delta END))          AS avg_gain,
    ROUND(AVG(CASE WHEN outcome = 'closed' THEN cycle_no END), 1)    AS avg_cycles,
    ROUND(AVG(CASE WHEN outcome = 'closed' THEN days_to_close END))  AS avg_days,
    SUM(outcome = 'worsened')                                        AS needs_teacher
  FROM client_pl_recovery_cycle
  WHERE org_id = :org_id AND detected_at >= :since`;

router.get('/cycles/stats', requirePermission('teacher', 'principal'), async (req, res) => {
  const since = req.query.since || '2000-01-01';
  try {
    const rows = await db.query(STATS_SQL, { org_id: req.ctx.org_id, since });
    res.json(rows[0] || {});
  } catch (err) {
    res.status(503).json({
      error: 'database_unavailable',
      hint: 'Run `npm run migrate && npm run seed` with MySQL running to populate recovery cycles.',
      detail: err.message,
    });
  }
});

module.exports = router;
