'use strict';

/**
 * /api/pl/tests/* — Offline paper tests (spec Part 8.1 — THE hero).
 *
 *   POST /tests/offline               create a paper test
 *   POST /tests/:id/question-map      Q1→wiswits_id (reusable), builds snapshots
 *   GET  /tests/:id/question-map
 *   GET  /tests/:id/marks-template    CSV template
 *   POST /tests/:id/marks-entry       ⭐⭐ question-wise bulk → attempts+responses+analysis
 *
 * India me 80% test paper pe hote hain. Submit → analysis < 3s.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { median, stdDev, pct } = require('../algorithms/util');

// ─── Create offline test ──────────────────────────────────────
router.post('/tests/offline', requirePermission('teacher'), async (req, res) => {
  const { title, subject_id, class_no = 10, total_questions = 20, marks_per_q = 2, duration_min = 60 } = req.body;
  const org_id = req.ctx.org_id;
  const r = await db.query(
    `INSERT INTO client_pl_test (org_id, title, subject_id, class_no, type, source, mode,
       total_marks, total_questions, duration_min, status, created_by)
     VALUES (:org_id, :title, :subject_id, :class_no, 'unit', 'offline', 'offline',
       :total_marks, :total_questions, :duration_min, 'ready', :uid)`,
    { org_id, title, subject_id, class_no, total_marks: total_questions * marks_per_q,
      total_questions, duration_min, uid: req.ctx.user_id || 1 }
  );
  const test_id = r.insertId;
  emit('pl.test_created', { org_id, test_id, source: 'offline', mode: 'offline', class_no, subject_id });
  res.status(201).json({ id: test_id, title, total_questions, marks_per_q });
});

// ─── Set question map (reusable) + freeze snapshots ───────────
router.post('/tests/:id/question-map', requirePermission('teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const map = req.body.map || []; // [{paper_q_no, wiswits_id, bloom, difficulty, marks}]

  // reset existing map + snapshots for this test (idempotent)
  await db.query(`DELETE FROM client_pl_question_map WHERE org_id = :org_id AND test_id = :test_id`, { org_id, test_id });
  await db.query(`DELETE FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id`, { org_id, test_id });

  for (const m of map) {
    const est = { easy: 60, medium: 90, hard: 150 }[m.difficulty] || 90;
    await db.query(
      `INSERT INTO client_pl_question_map (org_id, test_id, paper_q_no, wiswits_id, bloom, difficulty, marks)
       VALUES (:org_id, :test_id, :q, :w, :b, :d, :marks)`,
      { org_id, test_id, q: m.paper_q_no, w: m.wiswits_id, b: m.bloom || null, d: m.difficulty || null, marks: m.marks || 2 }
    );
    await db.query(
      `INSERT INTO client_pl_test_question (org_id, test_id, seq, wiswits_id, bloom, difficulty, est_time_sec, marks, question_snapshot_json)
       VALUES (:org_id, :test_id, :seq, :w, :b, :d, :est, :marks, :snap)`,
      { org_id, test_id, seq: m.paper_q_no, w: m.wiswits_id, b: m.bloom || null, d: m.difficulty || null,
        est, marks: m.marks || 2, snap: JSON.stringify({ paper_q_no: m.paper_q_no, wiswits_id: m.wiswits_id }) }
    );
  }
  res.json({ ok: true, mapped: map.length });
});

router.get('/tests/:id/question-map', requirePermission('teacher'), async (req, res) => {
  const rows = await db.query(
    `SELECT paper_q_no, wiswits_id, bloom, difficulty, marks FROM client_pl_question_map
     WHERE org_id = :org_id AND test_id = :test_id ORDER BY paper_q_no`,
    { org_id: req.ctx.org_id, test_id: Number(req.params.id) }
  );
  res.json({ map: rows });
});

// ─── CSV template ─────────────────────────────────────────────
router.get('/tests/:id/marks-template', requirePermission('teacher'), async (req, res) => {
  const tqs = await db.query(
    `SELECT seq FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id ORDER BY seq`,
    { org_id: req.ctx.org_id, test_id: Number(req.params.id) }
  );
  const header = ['roll', 'name', ...tqs.map((t) => `Q${t.seq}`)].join(',');
  res.type('text/csv').send(`${header}\n`);
});

// ─── ⭐⭐ Marks entry (bulk, question-wise) → analysis ─────────
router.post('/tests/:id/marks-entry', requirePermission('teacher'), async (req, res) => {
  const t0 = Date.now();
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const students = req.body.students || []; // [{student_id, roll, name, marks:[..], absent}]

  const tqs = await db.query(
    `SELECT id, seq, wiswits_id, bloom, difficulty, marks, est_time_sec
     FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id ORDER BY seq`,
    { org_id, test_id }
  );
  if (!tqs.length) return res.status(400).json({ error: 'no_question_map', hint: 'POST /question-map first' });

  const maxScore = tqs.reduce((a, q) => a + Number(q.marks), 0);
  const perQ = tqs.map((q) => ({ ...q, correct: 0, attempted: 0 }));
  const topicAgg = {}; // wiswits_id → {correct, attempted}
  const scores = [];

  // clear prior offline attempts for idempotency
  const prior = await db.query(
    `SELECT id FROM client_pl_attempt WHERE org_id = :org_id AND test_id = :test_id AND is_offline_entry = 1`, { org_id, test_id });
  if (prior.length) {
    const ids = prior.map((p) => p.id);
    await db.query(`DELETE FROM client_pl_response WHERE attempt_id IN (${ids.map(() => '?').join(',')})`, ids);
    await db.query(`DELETE FROM client_pl_attempt WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  }

  for (const stu of students) {
    if (stu.absent) {
      await db.query(
        `INSERT INTO client_pl_attempt (org_id, test_id, student_id, status, max_score, is_offline_entry, entered_by)
         VALUES (:org_id, :test_id, :sid, 'absent', :max, 1, :uid)`,
        { org_id, test_id, sid: stu.student_id, max: maxScore, uid: req.ctx.user_id || 1 });
      continue;
    }
    let score = 0, correct = 0, wrong = 0;
    for (let i = 0; i < tqs.length; i++) {
      const q = tqs[i];
      const m = Number(stu.marks?.[i] ?? 0);
      const isCorrect = m >= Number(q.marks) ? 1 : 0;
      score += m;
      if (isCorrect) correct++; else wrong++;
      perQ[i].attempted++;
      if (isCorrect) perQ[i].correct++;
      const agg = (topicAgg[q.wiswits_id] ||= { correct: 0, attempted: 0 });
      agg.attempted++;
      if (isCorrect) agg.correct++;
    }
    const percentage = Math.round((score / maxScore) * 100);
    scores.push(percentage);
    const ares = await db.query(
      `INSERT INTO client_pl_attempt (org_id, test_id, student_id, status, score, max_score, percentage,
         correct_count, wrong_count, is_offline_entry, entered_by, submitted_at, evaluated_at)
       VALUES (:org_id, :test_id, :sid, 'evaluated', :score, :max, :pct, :correct, :wrong, 1, :uid, NOW(), NOW())`,
      { org_id, test_id, sid: stu.student_id, score, max: maxScore, pct: percentage, correct, wrong, uid: req.ctx.user_id || 1 });
    const attemptId = ares.insertId;

    const rows = tqs.map((q, i) => {
      const m = Number(stu.marks?.[i] ?? 0);
      const isCorrect = m >= Number(q.marks) ? 1 : 0;
      return [org_id, attemptId, q.id, q.wiswits_id, q.bloom, q.difficulty,
        isCorrect, m, isCorrect];
    });
    await db.query(
      `INSERT INTO client_pl_response (org_id, attempt_id, test_question_id, wiswits_id, bloom, difficulty, is_correct, marks_awarded, final_answer)
       VALUES ${rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')}`,
      rows.flat()
    );
  }

  // ─── instant class analysis ───────────────────────────────
  const present = scores.length;
  const avg = present ? Math.round(scores.reduce((a, b) => a + b, 0) / present) : 0;
  const topicHealth = Object.entries(topicAgg).map(([wiswits_id, a]) => ({
    wiswits_id, accuracy: pct(a.correct, a.attempted),
  })).sort((a, b) => a.accuracy - b.accuracy);
  const weakQuestions = perQ
    .map((q) => ({ seq: q.seq, wiswits_id: q.wiswits_id, accuracy: pct(q.correct, q.attempted) }))
    .filter((q) => q.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy);

  emit('pl.attempted', { org_id, test_id, attempted: present, avg });

  res.json({
    ok: true,
    took_ms: Date.now() - t0,
    summary: {
      attempted: present,
      absent: students.filter((s) => s.absent).length,
      avg,
      median: Math.round(median(scores)),
      std_dev: Math.round(stdDev(scores)),
      topper: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
      max_score: maxScore,
    },
    topic_health: topicHealth,
    weak_questions: weakQuestions,
  });
});

module.exports = router;
