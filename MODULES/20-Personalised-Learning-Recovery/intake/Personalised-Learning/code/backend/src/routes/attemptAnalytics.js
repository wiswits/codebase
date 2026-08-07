'use strict';

/**
 * /api/pl/analytics/attempt/:id/* — per-attempt breakdown (spec: the "why did
 * I get this score" screen). Every route resolves the attempt first (404 if it
 * doesn't belong to this org), then reads client_pl_response joined to
 * client_pl_test_question for that one attempt_id.
 *
 * Visibility: the student who owns the attempt, plus teacher/parent/principal.
 * (Comparison never returns rank/leaderboard/topper-name — score only.)
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { pct, topKey, mean, percentileOf } = require('../algorithms/util');
const { classifyResponse } = require('../algorithms/behaviour');
const { buildComparison } = require('../algorithms/benchmark');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;

const COACHING_HINTS = {
  rushed: 'Jaldi mein answer diya — thoda ruk ke socho, accuracy improve hogi.',
  silly_mistake: 'Concept clear hai, bas dhyan nahi diya. Slow down aur double-check karo.',
  concept_gap: 'Yahan concept hi clear nahi hai — isse pehle revise karo.',
  confused: 'Mehnat ki lekin bharam hai — concept dobara samjho.',
  guess: 'Bina try kiye guess kar diya — easy questions se confidence build karo.',
  overthinking: 'Pehla jawab aksar sahi hota hai — apne instinct pe bharosa karo.',
  mastered: 'Bahut badhiya — ye topic pakka hai!',
  solid: 'Achha kaam — steady aur sahi raha.',
  laboured: 'Sahi kiya, par time zyada laga — practice se speed badhao.',
  lucky_guess: 'Sahi to hua par jaldi mein — pakka concept check karo taaki fluke na ho.',
};

// ─── Resolve attempt (org-scoped, 404 if missing) ────────────────
async function resolveAttempt(org_id, id) {
  const [attempt] = await db.query(
    `SELECT * FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`,
    { id, org_id }
  );
  return attempt || null;
}

// ─── Responses for this attempt, joined to their frozen test_question ──
async function responsesWithMeta(org_id, attempt_id) {
  const rows = await db.query(
    `SELECT r.*, tq.seq, tq.marks AS q_marks, tq.est_time_sec, tq.question_snapshot_json
     FROM client_pl_response r
     JOIN client_pl_test_question tq ON tq.id = r.test_question_id
     WHERE r.org_id=:org_id AND r.attempt_id=:attempt_id
     ORDER BY tq.seq ASC`,
    { org_id, attempt_id }
  );
  return rows.map((r) => {
    let snap = null;
    try {
      snap = typeof r.question_snapshot_json === 'string' ? JSON.parse(r.question_snapshot_json) : r.question_snapshot_json;
    } catch { /* ignore malformed snapshot */ }
    return { ...r, _correct_option: snap ? snap.correct : null };
  });
}

async function attemptGate(req, res, next) {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const attempt = await resolveAttempt(org_id, id);
  if (!attempt) return res.status(404).json({ error: 'not_found' });
  // student may only view their own attempt
  if (req.ctx.role === 'student' && Number(req.ctx.user_id) !== Number(attempt.student_id)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  req.attempt = attempt;
  next();
}

const VISIBLE = requirePermission('student', 'teacher', 'parent', 'principal');

// ─── Overview ─────────────────────────────────────────────────────
router.get('/analytics/attempt/:id', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const attempt = req.attempt;

  const topicRows = await db.query(
    `SELECT wiswits_id, COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM client_pl_response WHERE org_id=:org_id AND attempt_id=:id GROUP BY wiswits_id`,
    { org_id, id: attempt.id }
  );
  const bloomRows = await db.query(
    `SELECT bloom, COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM client_pl_response WHERE org_id=:org_id AND attempt_id=:id AND bloom IS NOT NULL GROUP BY bloom`,
    { org_id, id: attempt.id }
  );

  res.json({
    attempt_id: attempt.id,
    test_id: attempt.test_id,
    student_id: attempt.student_id,
    score: Number(attempt.score),
    max_score: Number(attempt.max_score),
    percentage: Number(attempt.percentage),
    correct_count: attempt.correct_count,
    wrong_count: attempt.wrong_count,
    skipped_count: attempt.skipped_count,
    time_taken_sec: attempt.time_taken_sec,
    topics: topicRows.map((r) => ({
      wiswits_id: r.wiswits_id, label: topicLabel(r.wiswits_id),
      attempted: r.attempted, accuracy: pct(r.correct, r.attempted),
    })),
    bloom: bloomRows.map((r) => ({ bloom: r.bloom, attempted: r.attempted, accuracy: pct(r.correct, r.attempted) })),
  });
});

// ─── Question-by-question ──────────────────────────────────────────
router.get('/analytics/attempt/:id/questions', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await responsesWithMeta(org_id, req.attempt.id);
  res.json({
    questions: rows.map((r) => ({
      seq: r.seq, wiswits_id: r.wiswits_id, difficulty: r.difficulty, bloom: r.bloom,
      your_answer: r.final_answer, is_correct: !!r.is_correct,
      time_sec: r.time_sec, marks_awarded: Number(r.marks_awarded),
    })),
  });
});

// ─── Topic accuracy, this attempt only ─────────────────────────────
router.get('/analytics/attempt/:id/topics', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await db.query(
    `SELECT wiswits_id, COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM client_pl_response WHERE org_id=:org_id AND attempt_id=:id GROUP BY wiswits_id`,
    { org_id, id: req.attempt.id }
  );
  res.json({
    topics: rows.map((r) => ({
      wiswits_id: r.wiswits_id, label: topicLabel(r.wiswits_id),
      attempted: r.attempted, correct: Number(r.correct), accuracy: pct(r.correct, r.attempted),
    })),
  });
});

// ─── Bloom accuracy, this attempt only (same pattern as studentReport) ─
router.get('/analytics/attempt/:id/bloom', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await db.query(
    `SELECT bloom, ROUND(SUM(is_correct)/COUNT(*)*100) AS accuracy, COUNT(*) AS n
     FROM client_pl_response WHERE org_id=:org_id AND attempt_id=:id AND bloom IS NOT NULL GROUP BY bloom`,
    { org_id, id: req.attempt.id }
  );
  res.json({ bloom: rows.map((r) => ({ bloom: r.bloom, n: r.n, accuracy: Number(r.accuracy) })) });
});

// ─── Difficulty accuracy, this attempt only ────────────────────────
router.get('/analytics/attempt/:id/difficulty', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await db.query(
    `SELECT difficulty, COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM client_pl_response WHERE org_id=:org_id AND attempt_id=:id AND difficulty IS NOT NULL GROUP BY difficulty`,
    { org_id, id: req.attempt.id }
  );
  res.json({
    difficulty: rows.map((r) => ({
      difficulty: r.difficulty, attempted: r.attempted, accuracy: pct(r.correct, r.attempted),
    })),
  });
});

// ─── Time / behaviour classification with a plain-language insight ──
router.get('/analytics/attempt/:id/time', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await responsesWithMeta(org_id, req.attempt.id);

  const classified = rows.map((r) => {
    const est_time_sec = r.est_time_sec || 1;
    const time_ratio = Number(((r.time_sec || 0) / est_time_sec).toFixed(3));
    const first_correct = r._correct_option != null && r.first_answer === r._correct_option;
    const cls = classifyResponse({
      difficulty: r.difficulty, is_correct: !!r.is_correct,
      changed_count: r.changed_count, visits: r.visits,
      first_answer: r.first_answer, final_answer: r.final_answer, first_correct,
      time_sec: r.time_sec, est_time_sec,
    });
    return { seq: r.seq, wiswits_id: r.wiswits_id, time_sec: r.time_sec, est_time_sec, time_ratio, marks: Number(r.q_marks), class: cls };
  });

  const tally = {};
  for (const c of classified) tally[c.class] = (tally[c.class] || 0) + 1;

  const sillyCount = tally.silly_mistake || 0;
  const avgMarks = classified.length ? mean(classified.map((c) => c.marks)) : 0;
  const lostMarks = Math.round(sillyCount * avgMarks * 10) / 10;
  const insight = sillyCount > 0
    ? `${sillyCount} silly mistake${sillyCount > 1 ? 's' : ''} = ${lostMarks} marks lost`
    : 'Koi silly mistake nahi — jo galat hua, concept gap tha.';

  res.json({ per_question: classified, tally, insight });
});

// ─── Behaviour classification → tally + dominant pattern + coaching hint ─
router.get('/analytics/attempt/:id/behaviour', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await responsesWithMeta(org_id, req.attempt.id);

  const tally = {};
  for (const r of rows) {
    const est_time_sec = r.est_time_sec || 1;
    const first_correct = r._correct_option != null && r.first_answer === r._correct_option;
    const cls = classifyResponse({
      difficulty: r.difficulty, is_correct: !!r.is_correct,
      changed_count: r.changed_count, visits: r.visits,
      first_answer: r.first_answer, final_answer: r.final_answer, first_correct,
      time_sec: r.time_sec, est_time_sec,
    });
    tally[cls] = (tally[cls] || 0) + 1;
  }

  const dominant_pattern = topKey(tally);
  res.json({
    tally, dominant_pattern,
    coaching_hint: (dominant_pattern && COACHING_HINTS[dominant_pattern]) || 'Data kaafi nahi — aur attempts ke baad pattern saaf hoga.',
  });
});

// ─── Comparison vs class/topper/self — dignity-safe, no rank ever ──
router.get('/analytics/attempt/:id/comparison', VISIBLE, attemptGate, async (req, res) => {
  const org_id = req.ctx.org_id;
  const attempt = req.attempt;

  const [bench] = await db.query(
    `SELECT avg_accuracy, median_accuracy, topper_accuracy, p90, p75, p50, p25
     FROM client_pl_benchmark WHERE org_id=:org_id AND scope='class' AND test_id=:test_id
     ORDER BY id DESC LIMIT 1`,
    { org_id, test_id: attempt.test_id }
  );

  const distRows = await db.query(
    `SELECT percentage FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated'`,
    { org_id, test_id: attempt.test_id }
  );
  const sorted = distRows.map((d) => Number(d.percentage)).sort((a, b) => a - b);
  const percentile = percentileOf(sorted, Number(attempt.percentage));

  const journeyRows = await db.query(
    `SELECT t.title AS test_title, a.percentage, a.submitted_at
     FROM client_pl_attempt a JOIN client_pl_test t ON t.id = a.test_id
     WHERE a.org_id=:org_id AND a.student_id=:student_id AND a.status='evaluated'
     ORDER BY a.submitted_at ASC`,
    { org_id, student_id: attempt.student_id }
  );
  const history = journeyRows
    .map((r) => ({ accuracy: Number(r.percentage), test_title: r.test_title, date: r.submitted_at }))
    .reverse(); // newest-first, per buildComparison contract

  const comparison = buildComparison({
    my: { accuracy: Number(attempt.percentage), score: Number(attempt.score), max_score: Number(attempt.max_score) },
    peers: bench ? {
      class_avg: Number(bench.avg_accuracy), class_median: Number(bench.median_accuracy),
      topper_accuracy: Number(bench.topper_accuracy), p90: Number(bench.p90), p75: Number(bench.p75),
      p50: Number(bench.p50), p25: Number(bench.p25),
    } : null,
    history,
    percentile,
  });

  res.json(comparison);
});

module.exports = router;
