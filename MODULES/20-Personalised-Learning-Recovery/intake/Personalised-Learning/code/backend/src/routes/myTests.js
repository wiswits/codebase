'use strict';

/**
 * /api/pl/my/tests/* + /api/pl/attempts/:id/review/:qid — student-facing
 * "my tests" surface (pending / done) and pre-start test detail.
 *
 * ⚠️ SIMPLIFICATION: in the real platform the acting student comes from a
 * verified session/JWT. Here (matching middleware/context.js's dev-header
 * approach) we accept it as a query param `student_id`, defaulting to
 * req.ctx.user_id when present.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');

function resolveStudentId(req) {
  return Number(req.query.student_id || req.ctx.user_id || 0) || null;
}

// ─── Pending vs done ─────────────────────────────────────────────
router.get('/my/tests', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = resolveStudentId(req);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  const pending = await db.query(
    `SELECT a.id AS assignment_id, t.id AS test_id, t.title, t.type, t.mode, t.total_questions,
            t.total_marks, t.duration_min, a.opens_at, a.closes_at, a.attempts_allowed, s.status
     FROM client_pl_assignment_student s
     JOIN client_pl_assignment a ON a.id = s.assignment_id AND a.org_id = s.org_id
     JOIN client_pl_test t ON t.id = a.test_id AND t.org_id = a.org_id
     WHERE s.org_id = :org_id AND s.student_id = :student_id
       AND a.status IN ('open', 'scheduled')
       AND s.status IN ('assigned', 'started')
       AND (a.opens_at IS NULL OR a.opens_at <= NOW())
       AND (a.closes_at IS NULL OR a.closes_at >= NOW())
     ORDER BY a.closes_at IS NULL, a.closes_at ASC`,
    { org_id, student_id }
  );

  const done = await db.query(
    `SELECT at.id AS attempt_id, t.id AS test_id, t.title, t.type, t.mode,
            at.score, at.max_score, at.percentage, at.correct_count, at.wrong_count,
            at.skipped_count, at.submitted_at, at.evaluated_at, at.status
     FROM client_pl_attempt at
     JOIN client_pl_test t ON t.id = at.test_id AND t.org_id = at.org_id
     WHERE at.org_id = :org_id AND at.student_id = :student_id AND at.status = 'evaluated'
     ORDER BY at.evaluated_at DESC
     LIMIT 100`,
    { org_id, student_id }
  );

  res.json({
    student_id,
    pending: pending.map((p) => ({
      assignment_id: p.assignment_id, test_id: p.test_id, title: p.title, type: p.type, mode: p.mode,
      total_questions: p.total_questions, total_marks: Number(p.total_marks), duration_min: p.duration_min,
      opens_at: p.opens_at, closes_at: p.closes_at, attempts_allowed: p.attempts_allowed, status: p.status,
    })),
    done: done.map((d) => ({
      attempt_id: d.attempt_id, test_id: d.test_id, title: d.title, type: d.type, mode: d.mode,
      score: Number(d.score), max_score: Number(d.max_score), percentage: Number(d.percentage),
      correct_count: d.correct_count, wrong_count: d.wrong_count, skipped_count: d.skipped_count,
      submitted_at: d.submitted_at, evaluated_at: d.evaluated_at,
    })),
  });
});

// ─── Pre-start detail (no question content leaked) ───────────────
router.get('/my/tests/:id', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const student_id = resolveStudentId(req);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  const [test] = await db.query(
    `SELECT id, title, type, mode, duration_min, total_questions, total_marks, instructions_json, status
     FROM client_pl_test WHERE id = :id AND org_id = :org_id`,
    { id: test_id, org_id }
  );
  if (!test) return res.status(404).json({ error: 'not_found' });

  const [attempt] = await db.query(
    `SELECT id, status, score, max_score, percentage, submitted_at, evaluated_at
     FROM client_pl_attempt
     WHERE org_id = :org_id AND test_id = :test_id AND student_id = :student_id
       AND status IN ('in_progress', 'evaluated')
     ORDER BY id DESC LIMIT 1`,
    { org_id, test_id, student_id }
  );

  res.json({
    id: test.id, title: test.title, type: test.type, mode: test.mode,
    duration_min: test.duration_min, total_questions: test.total_questions,
    total_marks: Number(test.total_marks),
    instructions_json: test.instructions_json,
    attempt_state: attempt
      ? { attempt_id: attempt.id, status: attempt.status, score: attempt.status === 'evaluated' ? Number(attempt.score) : null }
      : null,
  });
});

// ─── Toggle "marked for review" on a question in an attempt ──────
// Minimal inline equivalent of attempts.js's upsertResponse (kept separate
// to avoid coupling the two route modules together).
router.post('/attempts/:id/review/:qid', requirePermission('student', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const attempt_id = Number(req.params.id);
  const test_question_id = Number(req.params.qid);

  const [attempt] = await db.query(`SELECT test_id FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  if (!attempt) return res.status(404).json({ error: 'not_found' });

  const [tq] = await db.query(
    `SELECT id, wiswits_id, bloom, difficulty FROM client_pl_test_question WHERE id=:id AND org_id=:org_id AND test_id=:test_id`,
    { id: test_question_id, org_id, test_id: attempt.test_id }
  );
  if (!tq) return res.status(400).json({ error: 'invalid_question' });

  const existing = await db.query(
    `SELECT id, marked_review FROM client_pl_response WHERE attempt_id=:attempt_id AND test_question_id=:tqid`,
    { attempt_id, tqid: tq.id }
  );

  let marked_review;
  if (!existing.length) {
    marked_review = 1;
    await db.query(
      `INSERT INTO client_pl_response (org_id, attempt_id, test_question_id, wiswits_id, bloom, difficulty,
         visits, changed_count, marked_review)
       VALUES (:org_id, :attempt_id, :tqid, :wiswits_id, :bloom, :difficulty, 1, 0, :marked_review)`,
      { org_id, attempt_id, tqid: tq.id, wiswits_id: tq.wiswits_id, bloom: tq.bloom, difficulty: tq.difficulty, marked_review }
    );
  } else {
    marked_review = existing[0].marked_review ? 0 : 1; // toggle
    await db.query(
      `UPDATE client_pl_response SET marked_review = :marked_review WHERE id = :id`,
      { marked_review, id: existing[0].id }
    );
  }

  res.json({ ok: true, test_question_id, marked_review: !!marked_review });
});

module.exports = router;
