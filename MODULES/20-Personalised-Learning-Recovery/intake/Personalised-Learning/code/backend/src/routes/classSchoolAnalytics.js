'use strict';

/**
 * /api/pl/analytics/class/:id/* and /api/pl/analytics/school/* — class- and
 * school-level rollups.
 *
 * ⚠️ LIMITATION: the seed does not model a real class/section roster table —
 * every seeded student (900001-900500) sits in the same demo org (9001)
 * under a single conceptual "Class 10". So `:id` (class_no) is accepted for
 * spec-shape compatibility but currently NOT used to filter — every route
 * below aggregates across the whole org. Once a roster table exists, add a
 * `JOIN client_pl_class_roster ... WHERE class_no = :id` here.
 *
 * Query patterns are copied from studentReport.js / testAnalytics.js /
 * widgets.js / cycles.js — see those files for the originals.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { median } = require('../algorithms/util');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));

// ─── GET /analytics/class/:id — class health ────────────────────────
router.get('/analytics/class/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  // class_no accepted, not yet used to filter — see file header.
  const class_no = req.params.id;

  try {
    const [studentCount] = await db.query(
      `SELECT COUNT(DISTINCT student_id) AS n FROM client_pl_topic_score WHERE org_id=:org_id`,
      { org_id }
    );

    const accRows = await db.query(
      `SELECT accuracy FROM client_pl_topic_score WHERE org_id=:org_id`,
      { org_id }
    );
    const accs = accRows.map((r) => Number(r.accuracy));
    const avg_accuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
    const median_accuracy = accs.length ? Math.round(median(accs)) : null;

    const severityRows = await db.query(
      `SELECT severity, COUNT(*) AS n FROM client_pl_weak_area
       WHERE org_id=:org_id AND status NOT IN ('closed','dismissed')
       GROUP BY severity`,
      { org_id }
    );
    const open_weak_areas_by_severity = Object.fromEntries(severityRows.map((r) => [r.severity, Number(r.n)]));

    const [recovery] = await db.query(
      `SELECT ROUND(SUM(outcome='closed')/NULLIF(COUNT(*),0)*100) AS close_rate, COUNT(*) AS total
       FROM client_pl_recovery_cycle WHERE org_id=:org_id`,
      { org_id }
    );

    res.json({
      class_no,
      note: 'no roster table in this seed — aggregated org-wide (see file header)',
      student_count: Number(studentCount.n || 0),
      avg_accuracy,
      median_accuracy,
      open_weak_areas_by_severity,
      recovery: {
        total_cycles: Number(recovery.total || 0),
        avg_close_rate: recovery.close_rate != null ? Number(recovery.close_rate) : null,
      },
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/class/:id/heatmap — students × topics grid ─────
// Thin :id-scoped wrapper for the spec-correct path. The org-wide grid
// logic itself is identical to the existing GET /analytics/class/heatmap
// in testAnalytics.js (kept there, not duplicated/imported — see file
// header for the roster limitation).
router.get('/analytics/class/:id/heatmap', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const class_no = req.params.id;
  const limit = Number(req.query.limit || 32);
  const t0 = Date.now();

  try {
    const students = await db.query(
      `SELECT DISTINCT student_id FROM client_pl_topic_score WHERE org_id=:org_id ORDER BY student_id LIMIT :limit`,
      { org_id, limit }
    );
    const ids = students.map((s) => s.student_id);
    if (!ids.length) return res.json({ class_no, students: [], topics: [], cells: [] });

    const rows = await db.query(
      `SELECT student_id, wiswits_id, accuracy FROM client_pl_topic_score
       WHERE org_id = ? AND student_id IN (${ids.map(() => '?').join(',')})`,
      [org_id, ...ids]
    );

    res.json({
      class_no,
      note: 'no roster table in this seed — same org-wide grid as GET /analytics/class/heatmap',
      took_ms: Date.now() - t0,
      students: ids.map((id) => ({ id, name: nameFor(id) })),
      topics: TOPICS.map((t) => ({ id: t.id, label: NAME_BY_ID[t.id] })),
      cells: rows.map((r) => ({ student_id: r.student_id, wiswits_id: r.wiswits_id, accuracy: Number(r.accuracy) })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/class/:id/trend — class avg accuracy over time ─
// Same query pattern as widgets.js's /widgets/recovery-stats class_improvement curve.
router.get('/analytics/class/:id/trend', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const class_no = req.params.id;

  try {
    const curve = await db.query(
      `SELECT t.id AS test_id, t.title, b.avg_accuracy
       FROM client_pl_benchmark b
       JOIN client_pl_test t ON t.id = b.test_id
       WHERE b.org_id = :org_id AND b.scope = 'class'
       ORDER BY b.test_id ASC`,
      { org_id }
    );

    res.json({
      class_no,
      note: 'no roster table in this seed — aggregated org-wide (see file header)',
      tests: curve.map((c) => c.title),
      points: curve.map((c) => Number(c.avg_accuracy)),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/school — school-wide summary ────────────────────
router.get('/analytics/school', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;

  try {
    const [studentCount] = await db.query(
      `SELECT COUNT(DISTINCT student_id) AS n FROM client_pl_topic_score WHERE org_id=:org_id`,
      { org_id }
    );

    // Same shape as cycles.js's /cycles/stats, own SELECT (not imported).
    const [cycleStats] = await db.query(
      `SELECT
         COUNT(*)                                                  AS gaps_detected,
         SUM(outcome = 'closed')                                   AS gaps_closed,
         ROUND(SUM(outcome = 'closed') / NULLIF(COUNT(*),0) * 100) AS close_rate
       FROM client_pl_recovery_cycle WHERE org_id = :org_id`,
      { org_id }
    );

    const accRows = await db.query(
      `SELECT accuracy FROM client_pl_topic_score WHERE org_id=:org_id`,
      { org_id }
    );
    const accs = accRows.map((r) => Number(r.accuracy));
    const avg_accuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;

    res.json({
      total_students: Number(studentCount.n || 0),
      gaps_detected: Number(cycleStats.gaps_detected || 0),
      gaps_closed: Number(cycleStats.gaps_closed || 0),
      close_rate: cycleStats.close_rate != null ? Number(cycleStats.close_rate) : 0,
      avg_accuracy,
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/school/subjects — subject health breakdown ─────
router.get('/analytics/school/subjects', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;

  try {
    // Seed has exactly one subject (9001) — return an array anyway so a UI
    // built for multiple subjects still renders correctly.
    const rows = await db.query(
      `SELECT subject_id, ROUND(AVG(accuracy)) AS avg_accuracy
       FROM client_pl_topic_score WHERE org_id=:org_id GROUP BY subject_id`,
      { org_id }
    );

    const subjects = await Promise.all(rows.map(async (r) => {
      const [cyc] = await db.query(
        `SELECT COUNT(*) AS gaps, SUM(outcome='closed') AS closed
         FROM client_pl_recovery_cycle rc
         JOIN client_pl_weak_area wa ON wa.id = rc.weak_area_id
         WHERE rc.org_id=:org_id AND wa.subject_id=:subject_id`,
        { org_id, subject_id: r.subject_id }
      );
      const gaps = Number(cyc.gaps || 0);
      const closed = Number(cyc.closed || 0);
      return {
        subject_id: r.subject_id,
        avg_accuracy: Number(r.avg_accuracy),
        gaps,
        closed,
        close_rate: gaps ? Math.round((closed / gaps) * 100) : 0,
      };
    }));

    res.json({ subjects });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

module.exports = router;
