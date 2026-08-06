'use strict';

/**
 * /api/pl/attempts/* + /api/pl/tests/demo-online — the ONLINE attempt engine.
 *
 * ⚠️ BUSINESS RULE 1 — question snapshot: options/correct/solution are frozen
 *    into client_pl_test_question.question_snapshot_json at test creation.
 *    A later QBank edit never changes what a student already attempted.
 * ⚠️ BUSINESS RULE 2/3 — every response tracks time_sec, visits, changed_count,
 *    first_answer, final_answer. This is the fuel for behaviour analysis.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { ONLINE_QUESTIONS } = require('../db/fixtures');
const { classifyResponse } = require('../algorithms/behaviour');

// ─── Seed a fully-tagged online demo test (idempotent-ish helper) ─
router.post('/tests/demo-online', requirePermission('teacher', 'student'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const subject_id = req.body.subject_id || 9001;
  const durationMin = Math.ceil(ONLINE_QUESTIONS.reduce((a, q) => a + q.est_time_sec, 0) / 60) + 5;

  const t = await db.query(
    `INSERT INTO client_pl_test (org_id, title, subject_id, class_no, type, source, mode,
       total_marks, total_questions, duration_min, status, created_by)
     VALUES (:org_id, :title, :subject_id, 10, 'practice', 'manual', 'online',
       :total_marks, :total_questions, :duration_min, 'published', :uid)`,
    { org_id, title: 'Online Practice · Real Numbers to Quadratics', subject_id,
      total_marks: ONLINE_QUESTIONS.length * 2, total_questions: ONLINE_QUESTIONS.length,
      duration_min: durationMin, uid: req.ctx.user_id || 1 }
  );
  const test_id = t.insertId;

  const rows = ONLINE_QUESTIONS.map((q, i) => [
    org_id, test_id, i + 1, q.wiswits_id, q.bloom, q.difficulty, q.est_time_sec, 2,
    JSON.stringify({ stem: q.stem, options: q.options, correct: q.options.find((o) => o.is_correct).key, solution: q.solution }),
  ]);
  await db.query(
    `INSERT INTO client_pl_test_question (org_id, test_id, seq, wiswits_id, bloom, difficulty, est_time_sec, marks, question_snapshot_json)
     VALUES ${rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')}`,
    rows.flat()
  );

  emit('pl.test_created', { org_id, test_id, source: 'manual', mode: 'online', class_no: 10, subject_id });
  emit('pl.test_published', { org_id, test_id, question_count: ONLINE_QUESTIONS.length });
  res.status(201).json({ id: test_id, total_questions: ONLINE_QUESTIONS.length, duration_min: durationMin });
});

function publicQuestion(tq) {
  const snap = typeof tq.question_snapshot_json === 'string' ? JSON.parse(tq.question_snapshot_json) : tq.question_snapshot_json;
  return {
    test_question_id: tq.id,
    seq: tq.seq,
    wiswits_id: tq.wiswits_id,
    difficulty: tq.difficulty,
    bloom: tq.bloom,
    est_time_sec: tq.est_time_sec,
    marks: Number(tq.marks),
    stem: snap.stem,
    // Offline-sourced snapshots have no options[] (see buildResult's note below) —
    // this attempt engine is meant for online tests, but never crash on a mismatch.
    options: (Array.isArray(snap.options) ? snap.options : []).map((o) => ({ key: o.key, text: o.text })), // strip answer key
  };
}

async function loadQuestions(org_id, test_id) {
  return db.query(
    `SELECT id, seq, wiswits_id, difficulty, bloom, est_time_sec, marks, question_snapshot_json
     FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id ORDER BY seq`,
    { org_id, test_id }
  );
}

// ─── Start (or resume) an attempt ──────────────────────────────
router.post('/attempts/start', requirePermission('student', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { test_id, student_id } = req.body;

  const existing = await db.query(
    `SELECT id FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND student_id=:student_id AND status='in_progress' LIMIT 1`,
    { org_id, test_id, student_id }
  );

  let attemptId;
  if (existing.length) {
    attemptId = existing[0].id;
  } else {
    const [test] = await db.query(`SELECT duration_min FROM client_pl_test WHERE id=:id AND org_id=:org_id`, { id: test_id, org_id });
    const r = await db.query(
      `INSERT INTO client_pl_attempt (org_id, test_id, student_id, attempt_no, started_at, status, max_score)
       VALUES (:org_id, :test_id, :student_id, 1, NOW(), 'in_progress',
         (SELECT total_marks FROM client_pl_test WHERE id = :test_id AND org_id = :org_id))`,
      { org_id, test_id, student_id }
    );
    attemptId = r.insertId;
  }

  const [test] = await db.query(`SELECT id, title, duration_min, total_questions FROM client_pl_test WHERE id=:id AND org_id=:org_id`, { id: test_id, org_id });
  const tqs = await loadQuestions(org_id, test_id);

  res.json({
    attempt_id: attemptId,
    test: { id: test.id, title: test.title, duration_min: test.duration_min, total_questions: test.total_questions },
    questions: tqs.map(publicQuestion),
  });
});

// ─── Fetch attempt state (questions + any saved responses) ────
router.get('/attempts/:id', requirePermission('student', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const attempt_id = Number(req.params.id);
  const [attempt] = await db.query(`SELECT * FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  if (!attempt) return res.status(404).json({ error: 'not_found' });

  const tqs = await loadQuestions(org_id, attempt.test_id);
  const responses = await db.query(
    `SELECT test_question_id, final_answer, marked_review, visits, changed_count FROM client_pl_response WHERE attempt_id=:id`,
    { id: attempt_id }
  );
  const rmap = Object.fromEntries(responses.map((r) => [r.test_question_id, r]));

  res.json({
    attempt_id,
    status: attempt.status,
    questions: tqs.map(publicQuestion),
    responses: rmap,
  });
});

// ─── Save one response (auto-save, time-tracked) ───────────────
async function upsertResponse(org_id, attempt_id, tq, body) {
  const { selected, time_sec = 0, marked_review } = body;
  const existing = await db.query(
    `SELECT * FROM client_pl_response WHERE attempt_id=:attempt_id AND test_question_id=:tqid`,
    { attempt_id, tqid: tq.id }
  );

  if (!existing.length) {
    await db.query(
      `INSERT INTO client_pl_response (org_id, attempt_id, test_question_id, wiswits_id, bloom, difficulty,
         answer_json, time_sec, time_ratio, visits, changed_count, first_answer, final_answer, marked_review, answered_at)
       VALUES (:org_id, :attempt_id, :tqid, :wiswits_id, :bloom, :difficulty,
         :answer_json, :time_sec, :time_ratio, 1, 0, :selected, :selected, :marked_review, NOW())`,
      { org_id, attempt_id, tqid: tq.id, wiswits_id: tq.wiswits_id, bloom: tq.bloom, difficulty: tq.difficulty,
        answer_json: JSON.stringify({ selected: selected || null }), time_sec, time_ratio: (time_sec / (tq.est_time_sec || 1)).toFixed(3),
        selected: selected || null, marked_review: marked_review ? 1 : 0 }
    );
    return;
  }

  const row = existing[0];
  const changed = selected != null && row.final_answer != null && selected !== row.final_answer;
  const newFinal = selected != null ? selected : row.final_answer;
  const newTime = (row.time_sec || 0) + time_sec;
  await db.query(
    `UPDATE client_pl_response SET
       answer_json = :answer_json, final_answer = :final_answer,
       visits = visits + 1, changed_count = changed_count + :inc,
       time_sec = :time_sec, time_ratio = :time_ratio,
       marked_review = :marked_review, answered_at = NOW()
     WHERE id = :id`,
    { answer_json: JSON.stringify({ selected: newFinal }), final_answer: newFinal,
      inc: changed ? 1 : 0, time_sec: newTime, time_ratio: (newTime / (tq.est_time_sec || 1)).toFixed(3),
      marked_review: marked_review != null ? (marked_review ? 1 : 0) : row.marked_review, id: row.id }
  );
}

router.post('/attempts/:id/response', requirePermission('student', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const attempt_id = Number(req.params.id);
  const [attempt] = await db.query(`SELECT test_id FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  if (!attempt) return res.status(404).json({ error: 'not_found' });

  const [tq] = await db.query(
    `SELECT id, wiswits_id, bloom, difficulty, est_time_sec FROM client_pl_test_question WHERE id=:id AND org_id=:org_id`,
    { id: req.body.test_question_id, org_id }
  );
  if (!tq) return res.status(400).json({ error: 'invalid_question' });

  await upsertResponse(org_id, attempt_id, tq, req.body);
  res.json({ ok: true });
});

// ─── Telemetry event (view/blur/focus/back/skip/review) ───────
router.post('/attempts/:id/event', requirePermission('student', 'teacher'), async (req, res) => {
  const { question_id, event, meta } = req.body;
  await db.query(
    `INSERT INTO client_pl_attempt_event (org_id, attempt_id, question_id, event, meta_json)
     VALUES (:org_id, :attempt_id, :question_id, :event, :meta)`,
    { org_id: req.ctx.org_id, attempt_id: Number(req.params.id), question_id: question_id || null, event, meta: JSON.stringify(meta || {}) }
  );
  res.json({ ok: true });
});

// ─── Offline sync — flush a queued batch (responses + events) ─
router.post('/attempts/sync', requirePermission('student', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { attempt_id, responses = [], events = [] } = req.body;
  const [attempt] = await db.query(`SELECT test_id FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  if (!attempt) return res.status(404).json({ error: 'not_found' });

  const tqs = await loadQuestions(org_id, attempt.test_id);
  const byId = Object.fromEntries(tqs.map((t) => [t.id, t]));

  let applied = 0;
  for (const r of responses) {
    const tq = byId[r.test_question_id];
    if (!tq) continue;
    await upsertResponse(org_id, attempt_id, tq, r);
    applied++;
  }
  for (const e of events) {
    await db.query(
      `INSERT INTO client_pl_attempt_event (org_id, attempt_id, question_id, event, meta_json)
       VALUES (:org_id, :attempt_id, :question_id, :event, :meta)`,
      { org_id, attempt_id, question_id: e.question_id || null, event: e.event, meta: JSON.stringify(e.meta || {}) }
    );
  }
  res.json({ ok: true, responses_applied: applied, events_applied: events.length });
});

// ─── Submit → grade → analyze (⭐⭐ < 3s target) ────────────────
router.post('/attempts/:id/submit', requirePermission('student', 'teacher'), async (req, res) => {
  const t0 = Date.now();
  const org_id = req.ctx.org_id;
  const attempt_id = Number(req.params.id);
  const [attempt] = await db.query(`SELECT * FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  if (!attempt) return res.status(404).json({ error: 'not_found' });
  if (attempt.status === 'evaluated') return res.json(await buildResult(org_id, attempt_id));

  const tqs = await loadQuestions(org_id, attempt.test_id);
  const responses = await db.query(`SELECT * FROM client_pl_response WHERE attempt_id=:id`, { id: attempt_id });
  const rmap = Object.fromEntries(responses.map((r) => [r.test_question_id, r]));

  let correct = 0, wrong = 0, skipped = 0, score = 0, timeTaken = 0;
  for (const tq of tqs) {
    const snap = typeof tq.question_snapshot_json === 'string' ? JSON.parse(tq.question_snapshot_json) : tq.question_snapshot_json;
    const r = rmap[tq.id];
    if (!r || !r.final_answer) { skipped++; continue; }
    const isCorrect = r.final_answer === snap.correct ? 1 : 0;
    const marks = isCorrect ? Number(tq.marks) : 0;
    if (isCorrect) correct++; else wrong++;
    score += marks;
    timeTaken += r.time_sec || 0;
    const firstCorrect = r.first_answer === snap.correct;
    await db.query(
      `UPDATE client_pl_response SET is_correct=:c, marks_awarded=:m WHERE id=:id`,
      { c: isCorrect, m: marks, id: r.id }
    );
    void firstCorrect; // used by /result for behaviour classification
  }

  const maxScore = Number(attempt.max_score) || tqs.reduce((a, q) => a + Number(q.marks), 0);
  const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
  await db.query(
    `UPDATE client_pl_attempt SET status='evaluated', submitted_at=NOW(), evaluated_at=NOW(),
       score=:score, max_score=:max, percentage=:pct, correct_count=:c, wrong_count=:w, skipped_count=:s,
       time_taken_sec=:t, time_efficiency=:eff
     WHERE id=:id`,
    { score, max: maxScore, pct, c: correct, w: wrong, s: skipped, t: timeTaken,
      eff: (timeTaken / (tqs.reduce((a, q) => a + q.est_time_sec, 0) || 1)).toFixed(2), id: attempt_id }
  );

  emit('pl.attempted', {
    org_id, student_id: attempt.student_id, attempt_id, test_id: attempt.test_id,
    score, percentage: pct, correct_count: correct, wrong_count: wrong,
  });

  const result = await buildResult(org_id, attempt_id);
  result.took_ms = Date.now() - t0;
  res.json(result);
});

async function buildResult(org_id, attempt_id) {
  const [attempt] = await db.query(`SELECT * FROM client_pl_attempt WHERE id=:id AND org_id=:org_id`, { id: attempt_id, org_id });
  const tqs = await loadQuestions(org_id, attempt.test_id);
  const responses = await db.query(`SELECT * FROM client_pl_response WHERE attempt_id=:id`, { id: attempt_id });
  const rmap = Object.fromEntries(responses.map((r) => [r.test_question_id, r]));

  const review = tqs.map((tq) => {
    const snap = typeof tq.question_snapshot_json === 'string' ? JSON.parse(tq.question_snapshot_json) : tq.question_snapshot_json;
    // ⚠️ Offline-sourced snapshots (created via /tests/offline + /question-map,
    // or the seed's T1-T6 fixtures) only ever store {stem, correct} — no
    // `options` array, since offline marks-entry doesn't need one. Only
    // online/demo-online tests freeze a full options[] with distractor
    // metadata. Never assume options exists.
    const options = Array.isArray(snap.options) ? snap.options : [];
    const r = rmap[tq.id];
    const chosenOpt = r ? options.find((o) => o.key === r.final_answer) : null;
    const behaviourClass = r
      ? classifyResponse({
          time_sec: r.time_sec, est_time_sec: tq.est_time_sec, difficulty: tq.difficulty,
          is_correct: !!r.is_correct, changed_count: r.changed_count, visits: r.visits,
          first_answer: r.first_answer, final_answer: r.final_answer, first_correct: r.first_answer === snap.correct,
        })
      : 'skipped';
    return {
      seq: tq.seq, wiswits_id: tq.wiswits_id, stem: snap.stem, options,
      correct_option: snap.correct ?? null, solution: snap.solution ?? null,
      your_answer: r ? r.final_answer : null,
      is_correct: r ? !!r.is_correct : false,
      time_sec: r ? r.time_sec : null, visits: r ? r.visits : 0, changed_count: r ? r.changed_count : 0,
      distractor_reason: chosenOpt && !chosenOpt.is_correct ? chosenOpt.distractor_reason : null,
      misconception: chosenOpt && !chosenOpt.is_correct ? chosenOpt.misconception : null,
      behaviour: behaviourClass,
    };
  });

  return {
    attempt_id, status: attempt.status,
    score: Number(attempt.score), max_score: Number(attempt.max_score), percentage: Number(attempt.percentage),
    correct_count: attempt.correct_count, wrong_count: attempt.wrong_count, skipped_count: attempt.skipped_count,
    time_taken_sec: attempt.time_taken_sec,
    review,
  };
}

router.get('/attempts/:id/result', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const out = await buildResult(req.ctx.org_id, Number(req.params.id));
  res.json(out);
});

module.exports = router;
