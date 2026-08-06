'use strict';

/**
 * /api/pl/analytics/student/:id/* — focused SLICE endpoints (spec siblings of
 * the mega GET /analytics/student/:id/report already built in studentReport.js).
 *
 * Reuses the exact same SQL aggregation patterns as studentReport.js,
 * testAnalytics.js and weakAreas.js — nothing here reinvents those queries,
 * it just exposes narrower cuts of the same live data for teacher/parent/
 * student quick-glance UIs.
 *
 * Every route is student-scoped: a 'student' role may only read their OWN
 * id (req.ctx.user_id must match :id), everyone else needs an allowed role.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { buildComparison } = require('../algorithms/benchmark');
const { percentileOf } = require('../algorithms/util');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;

/**
 * Gate: student/teacher/parent/principal may hit these routes, but a
 * 'student' caller may only ever see their own :id.
 */
function ownDataOnly(req, res, next) {
  if (req.ctx.role === 'student' && Number(req.params.id) !== req.ctx.user_id) {
    return res.status(403).json({ error: 'forbidden', hint: 'students may only view their own analytics' });
  }
  next();
}

const guard = [requirePermission('student', 'teacher', 'parent', 'principal'), ownDataOnly];

// ─── GET /analytics/student/:id — compact teacher-facing overview ──
router.get('/analytics/student/:id', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const subject_id = Number(req.query.subject_id || 9001);

  try {
    const topicScores = await db.query(
      `SELECT wiswits_id, accuracy, sample_size, trend
       FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:student_id`,
      { org_id, student_id }
    );

    const [openGaps] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_weak_area
       WHERE org_id=:org_id AND student_id=:student_id AND status NOT IN ('closed','dismissed')`,
      { org_id, student_id }
    );

    const [latestAttempt] = await db.query(
      `SELECT a.percentage, a.submitted_at, t.title
       FROM client_pl_attempt a JOIN client_pl_test t ON t.id = a.test_id
       WHERE a.org_id=:org_id AND a.student_id=:student_id AND a.status='evaluated' AND a.is_offline_entry=1
       ORDER BY a.submitted_at DESC LIMIT 1`,
      { org_id, student_id }
    );

    const [profile] = await db.query(
      `SELECT pace, behaviour, silly_mistake_rate, concept_gap_rate, guess_rate, revision_rate, coaching_note
       FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
      { org_id, student_id, subject_id }
    );

    res.json({
      student: { id: student_id, name: nameFor(student_id) },
      topics: topicScores.map((t) => ({
        wiswits_id: t.wiswits_id, label: topicLabel(t.wiswits_id),
        accuracy: Number(t.accuracy), sample_size: t.sample_size, trend: t.trend,
      })),
      open_weak_area_count: Number(openGaps.n || 0),
      latest_attempt: latestAttempt ? {
        test: latestAttempt.title, accuracy: Number(latestAttempt.percentage), submitted_at: latestAttempt.submitted_at,
      } : null,
      profile: profile || null,
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/progress — score over time ─────────
router.get('/analytics/student/:id/progress', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);

  try {
    const rows = await db.query(
      `SELECT t.id AS test_id, t.title, a.percentage, a.submitted_at
       FROM client_pl_attempt a JOIN client_pl_test t ON t.id = a.test_id
       WHERE a.org_id=:org_id AND a.student_id=:student_id AND a.status='evaluated' AND a.is_offline_entry=1
       ORDER BY a.submitted_at ASC`,
      { org_id, student_id }
    );
    res.json({
      journey: rows.map((r) => ({ test: r.title, date: r.submitted_at, acc: Number(r.percentage) })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/topics — full topic mastery map ────
router.get('/analytics/student/:id/topics', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);

  try {
    const rows = await db.query(
      `SELECT wiswits_id, subject_id, attempted, correct, skipped, accuracy, avg_time_sec, avg_time_ratio,
              easy_acc, medium_acc, hard_acc, variance, trend, sample_size, last_attempt_at
       FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:student_id ORDER BY accuracy ASC`,
      { org_id, student_id }
    );
    res.json({
      topics: rows.map((r) => ({
        wiswits_id: r.wiswits_id, label: topicLabel(r.wiswits_id), subject_id: r.subject_id,
        accuracy: Number(r.accuracy), sample_size: r.sample_size, attempted: r.attempted, correct: r.correct,
        skipped: r.skipped, avg_time_sec: r.avg_time_sec != null ? Number(r.avg_time_sec) : null,
        avg_time_ratio: r.avg_time_ratio != null ? Number(r.avg_time_ratio) : null,
        difficulty_breakdown: {
          easy: r.easy_acc != null ? Number(r.easy_acc) : null,
          medium: r.medium_acc != null ? Number(r.medium_acc) : null,
          hard: r.hard_acc != null ? Number(r.hard_acc) : null,
        },
        variance: r.variance != null ? Number(r.variance) : null,
        trend: r.trend, last_attempt_at: r.last_attempt_at,
      })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/bloom — live Bloom radar ───────────
router.get('/analytics/student/:id/bloom', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);

  try {
    const rows = await db.query(
      `SELECT r.bloom, ROUND(SUM(r.is_correct)/COUNT(*)*100) AS accuracy, COUNT(*) AS n
       FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
       WHERE a.org_id=:org_id AND a.student_id=:student_id AND r.bloom IS NOT NULL
       GROUP BY r.bloom`,
      { org_id, student_id }
    );
    res.json({
      bloom: rows.map((r) => ({ bloom: r.bloom, accuracy: Number(r.accuracy), n: Number(r.n) })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/behaviour — profile behaviour fields ─
router.get('/analytics/student/:id/behaviour', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const subject_id = Number(req.query.subject_id || 9001);

  try {
    const [profile] = await db.query(
      `SELECT pace, behaviour, silly_mistake_rate, concept_gap_rate, guess_rate, revision_rate, coaching_note, computed_at
       FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
      { org_id, student_id, subject_id }
    );
    if (!profile) {
      return res.status(404).json({
        error: 'profile_not_found',
        hint: 'No learning profile yet for this student/subject — call POST /api/pl/profile/recompute first.',
        student_id, subject_id,
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/errors — error signature ───────────
router.get('/analytics/student/:id/errors', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);

  try {
    // Proxy via client_pl_weak_area.dominant_error_type — raw responses don't
    // store distractor_reason at the response row level, same pattern as
    // studentReport.js's error-signature block.
    const errorRows = await db.query(
      `SELECT dominant_error_type AS reason, COUNT(*) AS n FROM client_pl_weak_area
       WHERE org_id=:org_id AND student_id=:student_id AND dominant_error_type IS NOT NULL
       GROUP BY dominant_error_type ORDER BY n DESC`,
      { org_id, student_id }
    );
    const total = errorRows.reduce((a, r) => a + r.n, 0) || 1;
    res.json({
      error_signature: errorRows.map((r) => ({ reason: r.reason, n: Number(r.n), pct: Math.round((r.n / total) * 100) })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── GET /analytics/student/:id/comparison — dignity-safe vs class ─
router.get('/analytics/student/:id/comparison', ...guard, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);

  try {
    const journeyRows = await db.query(
      `SELECT t.id AS test_id, t.title, a.percentage, a.submitted_at
       FROM client_pl_attempt a JOIN client_pl_test t ON t.id = a.test_id
       WHERE a.org_id=:org_id AND a.student_id=:student_id AND a.status='evaluated' AND a.is_offline_entry=1
       ORDER BY a.submitted_at ASC`,
      { org_id, student_id }
    );
    const journey = journeyRows.map((r) => ({ test: r.title, date: r.submitted_at, acc: Number(r.percentage) }));
    const latest = journey.at(-1);

    if (!latest) {
      return res.json({ comparison: null, hint: 'no evaluated attempts yet for this student' });
    }

    const [bench] = await db.query(
      `SELECT b.avg_accuracy, b.topper_accuracy, b.p90, b.p75, b.p50, b.p25, b.median_accuracy
       FROM client_pl_benchmark b WHERE b.org_id=:org_id AND b.scope='class'
       ORDER BY b.test_id DESC LIMIT 1`,
      { org_id }
    );
    const distRows = await db.query(
      `SELECT a.percentage FROM client_pl_attempt a
       WHERE a.org_id=:org_id AND a.test_id = (SELECT test_id FROM client_pl_attempt WHERE org_id=:org_id AND student_id=:student_id AND is_offline_entry=1 ORDER BY submitted_at DESC LIMIT 1)
         AND a.status='evaluated'`,
      { org_id, student_id }
    );
    const sorted = distRows.map((d) => Number(d.percentage)).sort((a, b) => a - b);
    const percentile = percentileOf(sorted, latest.acc);

    const comparison = buildComparison({
      my: { accuracy: latest.acc, score: null, max_score: null },
      peers: bench ? {
        class_avg: Number(bench.avg_accuracy), class_median: Number(bench.median_accuracy),
        topper_accuracy: Number(bench.topper_accuracy), p90: Number(bench.p90), p75: Number(bench.p75),
        p50: Number(bench.p50), p25: Number(bench.p25),
      } : null,
      history: [...journey].reverse().map((j) => ({ accuracy: j.acc, test_title: j.test })),
      percentile,
    });

    res.json({ comparison });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

module.exports = router;
