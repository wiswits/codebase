'use strict';

/**
 * /api/pl/analytics/test/* and /api/pl/analytics/class/* — class-level reads.
 * Precomputed-friendly queries (spec Part 15: analytics < 2s, heatmap < 1s).
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { median, stdDev, pct } = require('../algorithms/util');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));

// ─── Class summary for one test ────────────────────────────────
router.get('/analytics/test/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const rows = await db.query(
    `SELECT percentage FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated'`,
    { org_id, test_id }
  );
  const scores = rows.map((r) => Number(r.percentage));
  if (!scores.length) return res.json({ attempted_count: 0 });
  res.json({
    attempted_count: scores.length,
    avg_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    median_score: Math.round(median(scores)),
    std_dev: Math.round(stdDev(scores)),
    topper_score: Math.max(...scores),
    lowest_score: Math.min(...scores),
  });
});

// ─── Question-wise accuracy for one test ───────────────────────
router.get('/analytics/test/:id/questions', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const rows = await db.query(
    `SELECT tq.seq, tq.wiswits_id, tq.difficulty,
            COUNT(r.id) AS attempted, SUM(r.is_correct) AS correct
     FROM client_pl_test_question tq
     LEFT JOIN client_pl_response r ON r.test_question_id = tq.id
     WHERE tq.org_id=:org_id AND tq.test_id=:test_id
     GROUP BY tq.id ORDER BY tq.seq`,
    { org_id, test_id }
  );
  res.json({
    questions: rows.map((r) => ({
      seq: r.seq, wiswits_id: r.wiswits_id, difficulty: r.difficulty,
      attempted: r.attempted, accuracy: pct(r.correct, r.attempted),
    })),
  });
});

// ─── Needs attention (bottom performers, private) ──────────────
router.get('/analytics/test/:id/needs-attention', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const limit = Number(req.query.limit || 10);
  const rows = await db.query(
    `SELECT student_id, percentage, score, max_score FROM client_pl_attempt
     WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated'
     ORDER BY percentage ASC LIMIT :limit`,
    { org_id, test_id, limit }
  );
  res.json({ students: rows.map((r) => ({ ...r, name: nameFor(r.student_id) })) });
});

// ─── Class heatmap: students × topics, accuracy-coloured ───────
router.get('/analytics/class/heatmap', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const limit = Number(req.query.limit || 32);
  const t0 = Date.now();

  const students = await db.query(
    `SELECT DISTINCT student_id FROM client_pl_topic_score WHERE org_id=:org_id ORDER BY student_id LIMIT :limit`,
    { org_id, limit }
  );
  const ids = students.map((s) => s.student_id);
  if (!ids.length) return res.json({ students: [], topics: [], cells: [] });

  const rows = await db.query(
    `SELECT student_id, wiswits_id, accuracy FROM client_pl_topic_score
     WHERE org_id = ? AND student_id IN (${ids.map(() => '?').join(',')})`,
    [org_id, ...ids] // all-positional — named (:x) and positional (?) can't mix in one query
  );

  res.json({
    took_ms: Date.now() - t0,
    students: ids.map((id) => ({ id, name: nameFor(id) })),
    topics: TOPICS.map((t) => ({ id: t.id, label: NAME_BY_ID[t.id] })),
    cells: rows.map((r) => ({ student_id: r.student_id, wiswits_id: r.wiswits_id, accuracy: Number(r.accuracy) })),
  });
});

module.exports = router;
