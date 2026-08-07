'use strict';

/**
 * /api/pl/tests/:id/omr-* — OMR sheet handling (spec Part 8.2).
 *
 * ⚠️ SIMPLIFICATION #1 — no image-processing library is installed (and none
 * should be added per scope). Instead of accepting a scanned image, this
 * models a "scanned sheet" as structured JSON that a client-side bubble
 * detector (or a mocked scanner) would have already produced: an array of
 * `{q_no, detected_option, confidence}` marks per student sheet. Swapping in
 * real OMR image processing later only touches the client that produces
 * this JSON — the grading logic below is unchanged.
 *
 * ⚠️ SIMPLIFICATION #2 — roll→student resolution. There is no roll-number/
 * roster table in this schema slice, so each sheet is expected to carry
 * `student_id` directly in place of a roll number (a caller with real rolls
 * would resolve roll→student_id before calling this route).
 *
 * ⚠️ SIMPLIFICATION #3 — answer key. `client_pl_question_map` /
 * `client_pl_test_question` (as populated by offlineTests.js's
 * POST /tests/:id/question-map) do not carry a "correct option" column for
 * offline papers — only offline marks-entry (marks-based) grading is wired
 * there. To grade OMR bubbles we need an option-level key, so we resolve it
 * in priority order: (1) `question_snapshot_json.correct` if the test's
 * question map happens to carry one (e.g. tests built from QBank/manual
 * flows that do snapshot full options), else (2) an `answer_key` map
 * (`{q_no: option}`) supplied in the request body. If neither is available
 * for a question, that question is graded as `is_correct: null` (ungraded)
 * rather than guessed.
 *
 * Marks below confidence 0.7 are never auto-graded — they are stored as
 * ambiguous (is_correct = NULL, answer_json.ambiguous = true) and surfaced
 * for a human to resolve via POST /tests/:id/omr-verify.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { median, stdDev } = require('../algorithms/util');

const AMBIGUOUS_THRESHOLD = 0.7;

async function loadTestQuestions(org_id, test_id) {
  return db.query(
    `SELECT id, seq, wiswits_id, marks, question_snapshot_json
     FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id ORDER BY seq`,
    { org_id, test_id }
  );
}

function snapOf(tq) {
  return typeof tq.question_snapshot_json === 'string' ? JSON.parse(tq.question_snapshot_json) : tq.question_snapshot_json;
}

function resolveAnswerKey(tqs, answer_key_body) {
  const key = {};
  for (const tq of tqs) {
    const snap = snapOf(tq);
    if (snap && snap.correct) key[tq.seq] = snap.correct;
    else if (answer_key_body && answer_key_body[tq.seq] != null) key[tq.seq] = String(answer_key_body[tq.seq]);
    else key[tq.seq] = null;
  }
  return key;
}

// ─── Printable template ────────────────────────────────────────
router.get('/tests/:id/omr-template', requirePermission('teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const tqs = await loadTestQuestions(org_id, test_id);
  if (!tqs.length) return res.status(400).json({ error: 'no_question_map', hint: 'POST /question-map first' });

  const bubble_layout = tqs.map((tq) => {
    const snap = snapOf(tq);
    const options = Array.isArray(snap?.options) && snap.options.length
      ? snap.options.map((o) => o.key)
      : ['A', 'B', 'C', 'D'];
    return { q_no: tq.seq, options };
  });

  res.json({ test_id, question_count: tqs.length, bubble_layout });
});

// ─── OMR upload → auto-grade non-ambiguous marks ───────────────
router.post('/tests/:id/omr-upload', requirePermission('teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const { sheets = [], answer_key } = req.body; // sheets: [{student_id, marks:[{q_no, detected_option, confidence}]}]

  const tqs = await loadTestQuestions(org_id, test_id);
  if (!tqs.length) return res.status(400).json({ error: 'no_question_map', hint: 'POST /question-map first' });
  const tqBySeq = Object.fromEntries(tqs.map((tq) => [tq.seq, tq]));
  const key = resolveAnswerKey(tqs, answer_key);
  const maxScore = tqs.reduce((a, q) => a + Number(q.marks), 0);

  const ambiguous = [];
  let graded = 0;

  for (const sheet of sheets) {
    const student_id = Number(sheet.student_id || sheet.roll);
    if (!student_id) continue;

    // idempotency: clear any prior OMR attempt for this student+test
    const prior = await db.query(
      `SELECT id FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND student_id=:sid AND is_offline_entry=1`,
      { org_id, test_id, sid: student_id }
    );
    if (prior.length) {
      const ids = prior.map((p) => p.id);
      await db.query(`DELETE FROM client_pl_response WHERE attempt_id IN (${ids.map(() => '?').join(',')})`, ids);
      await db.query(`DELETE FROM client_pl_attempt WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
    }

    const ar = await db.query(
      `INSERT INTO client_pl_attempt (org_id, test_id, student_id, status, max_score, is_offline_entry, entered_by)
       VALUES (:org_id, :test_id, :sid, 'submitted', :max, 1, :uid)`,
      { org_id, test_id, sid: student_id, max: maxScore, uid: req.ctx.user_id || 1 }
    );
    const attempt_id = ar.insertId;

    for (const m of sheet.marks || []) {
      const tq = tqBySeq[m.q_no];
      if (!tq) continue;
      const isAmbiguous = Number(m.confidence) < AMBIGUOUS_THRESHOLD;
      const correctOpt = key[tq.seq];
      const is_correct = isAmbiguous || correctOpt == null ? null : (m.detected_option === correctOpt ? 1 : 0);
      const marks_awarded = is_correct ? Number(tq.marks) : 0;

      await db.query(
        `INSERT INTO client_pl_response (org_id, attempt_id, test_question_id, wiswits_id, answer_json,
           is_correct, marks_awarded, final_answer, answered_at)
         VALUES (:org_id, :attempt_id, :tqid, :wiswits_id, :answer_json, :is_correct, :marks_awarded, :final_answer, NOW())`,
        {
          org_id, attempt_id, tqid: tq.id, wiswits_id: tq.wiswits_id,
          answer_json: JSON.stringify({ selected: m.detected_option, confidence: m.confidence, ambiguous: isAmbiguous }),
          is_correct, marks_awarded, final_answer: m.detected_option,
        }
      );

      if (isAmbiguous) {
        ambiguous.push({ student_id, q_no: tq.seq, detected_option: m.detected_option, confidence: m.confidence });
      } else {
        graded++;
      }
    }
  }

  res.json({
    ok: true,
    sheets_received: sheets.length,
    marks_graded: graded,
    marks_ambiguous: ambiguous.length,
    ambiguous,
    next: ambiguous.length ? 'POST /tests/:id/omr-verify with corrections for the ambiguous marks above' : null,
  });
});

// ─── Verify/correct ambiguous marks, then finalize grading ─────
router.post('/tests/:id/omr-verify', requirePermission('teacher'), async (req, res) => {
  const t0 = Date.now();
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const { corrections = [], answer_key } = req.body; // [{student_id, q_no, corrected_option}]

  const tqs = await loadTestQuestions(org_id, test_id);
  if (!tqs.length) return res.status(400).json({ error: 'no_question_map' });
  const tqBySeq = Object.fromEntries(tqs.map((tq) => [tq.seq, tq]));
  const key = resolveAnswerKey(tqs, answer_key);
  const maxScore = tqs.reduce((a, q) => a + Number(q.marks), 0);

  const touchedStudents = new Set();
  for (const c of corrections) {
    const tq = tqBySeq[c.q_no];
    if (!tq) continue;
    const [attempt] = await db.query(
      `SELECT id FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND student_id=:sid AND is_offline_entry=1`,
      { org_id, test_id, sid: c.student_id }
    );
    if (!attempt) continue;
    const correctOpt = key[tq.seq];
    const is_correct = correctOpt == null ? null : (c.corrected_option === correctOpt ? 1 : 0);
    const marks_awarded = is_correct ? Number(tq.marks) : 0;
    await db.query(
      `UPDATE client_pl_response SET final_answer=:fa, is_correct=:ic, marks_awarded=:ma,
         answer_json = JSON_SET(COALESCE(answer_json, '{}'), '$.selected', :fa, '$.ambiguous', false, '$.corrected', true)
       WHERE attempt_id=:aid AND test_question_id=:tqid`,
      { fa: c.corrected_option, ic: is_correct, ma: marks_awarded, aid: attempt.id, tqid: tq.id }
    );
    touchedStudents.add(c.student_id);
  }

  // ─── finalize: grade every attempt for this test (marks-entry-style) ───
  const attempts = await db.query(
    `SELECT id, student_id FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND is_offline_entry=1`,
    { org_id, test_id }
  );

  const scores = [];
  const topicAgg = {};
  for (const att of attempts) {
    const responses = await db.query(
      `SELECT is_correct, marks_awarded, wiswits_id FROM client_pl_response WHERE attempt_id=:id`, { id: att.id });
    let score = 0, correct = 0, wrong = 0, skipped = 0;
    for (const r of responses) {
      score += Number(r.marks_awarded);
      if (r.is_correct === 1) correct++;
      else if (r.is_correct === 0) wrong++;
      else skipped++; // ungraded / still ambiguous
      if (r.is_correct != null) {
        const agg = (topicAgg[r.wiswits_id] ||= { correct: 0, attempted: 0 });
        agg.attempted++;
        if (r.is_correct) agg.correct++;
      }
    }
    const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;
    scores.push(percentage);
    await db.query(
      `UPDATE client_pl_attempt SET status='evaluated', score=:score, max_score=:max, percentage=:pct,
         correct_count=:c, wrong_count=:w, skipped_count=:s, submitted_at=COALESCE(submitted_at, NOW()), evaluated_at=NOW()
       WHERE id=:id`,
      { score, max: maxScore, pct: percentage, c: correct, w: wrong, s: skipped, id: att.id }
    );
  }

  emit('pl.attempted', { org_id, test_id, attempted: attempts.length, corrections_applied: corrections.length });

  const topicHealth = Object.entries(topicAgg).map(([wiswits_id, a]) => ({
    wiswits_id, accuracy: a.attempted ? Math.round((a.correct / a.attempted) * 100) : 0,
  })).sort((a, b) => a.accuracy - b.accuracy);

  res.json({
    ok: true,
    took_ms: Date.now() - t0,
    corrections_applied: corrections.length,
    students_corrected: touchedStudents.size,
    summary: {
      attempted: scores.length,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      median: Math.round(median(scores)),
      std_dev: Math.round(stdDev(scores)),
      max_score: maxScore,
    },
    topic_health: topicHealth,
  });
});

module.exports = router;
