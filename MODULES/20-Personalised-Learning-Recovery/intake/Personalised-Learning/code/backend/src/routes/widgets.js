'use strict';

/**
 * /api/pl/widgets/* — precomputed dashboard payloads.
 * recovery-stats backs the ⭐⭐⭐ Principal sales screen from real DB data.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');

router.get('/widgets/recovery-stats', requirePermission('principal', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  try {
    const [headline] = await db.query(
      `SELECT
         COUNT(*)                                                          AS gaps_detected,
         SUM(outcome = 'closed')                                           AS gaps_closed,
         ROUND(SUM(outcome = 'closed') / NULLIF(COUNT(*),0) * 100)         AS close_rate,
         ROUND(AVG(CASE WHEN outcome = 'closed' THEN delta END))          AS avg_gain,
         ROUND(AVG(CASE WHEN outcome = 'closed' THEN cycle_no END), 1)    AS avg_cycles,
         ROUND(AVG(CASE WHEN outcome = 'closed' THEN days_to_close END))  AS avg_days,
         SUM(outcome = 'worsened')                                        AS needs_teacher
       FROM client_pl_recovery_cycle WHERE org_id = :org_id`,
      { org_id }
    );

    // improvement curve — class avg accuracy per test, in order
    const curve = await db.query(
      `SELECT t.title, b.avg_accuracy
       FROM client_pl_benchmark b
       JOIN client_pl_test t ON t.id = b.test_id
       WHERE b.org_id = :org_id AND b.scope = 'class'
       ORDER BY b.test_id ASC`,
      { org_id }
    );

    // subjects needing human attention (escalated / worsened)
    const [needs] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_weak_area WHERE org_id = :org_id AND status = 'escalated'`,
      { org_id }
    );

    res.json({
      headline: {
        gaps_detected: Number(headline.gaps_detected || 0),
        gaps_closed: Number(headline.gaps_closed || 0),
        close_rate: Number(headline.close_rate || 0),
        avg_gain: Number(headline.avg_gain || 0),
        avg_cycles: Number(headline.avg_cycles || 0),
        avg_days: Number(headline.avg_days || 0),
        needs_teacher: Number(needs.n || 0),
      },
      class_improvement: {
        tests: curve.map((c) => c.title.replace('Unit Test ', 'T')),
        points: curve.map((c) => Number(c.avg_accuracy)),
      },
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

module.exports = router;
