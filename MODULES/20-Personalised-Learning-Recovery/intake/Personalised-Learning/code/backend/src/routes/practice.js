'use strict';

/**
 * /api/pl/practice/* — adaptive daily practice, driven by SM-2 (ALGORITHM 8).
 *
 * Priority for "what's next":
 *   1. a due `client_pl_practice_card` (spaced repetition is due)
 *   2. an open weak area for the student (prefer root cause)
 *   3. a random challenge question (hard difficulty)
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { sm2, responseToQuality, nextDifficulty } = require('../algorithms/sm2');
const { TOPICS } = require('../db/fixtures');
const { qbankApi } = require('../external');

const STUDENT_OR_TEACHER = requirePermission('student', 'teacher', 'parent');

/** JS Date → MySQL DATETIME string (local, matches dateStrings:true reads). */
function toMysqlDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Rough difficulty pick for a due spaced-repetition card from its ease factor. */
function difficultyFromEase(ef) {
  if (ef >= 2.6) return 'hard';
  if (ef >= 2.0) return 'medium';
  return 'easy';
}

// ─── What's next ────────────────────────────────────────────────
router.get('/practice/next', STUDENT_OR_TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  const subject_id = Number(req.query.subject_id || 9001);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  // 1) due spaced-repetition card
  const [dueCard] = await db.query(
    `SELECT * FROM client_pl_practice_card
     WHERE org_id=:org_id AND student_id=:sid AND due_at IS NOT NULL AND due_at <= NOW()
     ORDER BY due_at ASC LIMIT 1`,
    { org_id, sid: student_id }
  );
  if (dueCard) {
    const difficulty = difficultyFromEase(Number(dueCard.ease_factor));
    const question = await qbankApi.pickOne({ wiswits_id: dueCard.wiswits_id, difficulty });
    return res.json({ question, reason: 'spaced_repetition', target_wiswits_id: dueCard.wiswits_id });
  }

  // 2) open weak area, prefer root cause
  const [weak] = await db.query(
    `SELECT wiswits_id FROM client_pl_weak_area
     WHERE org_id=:org_id AND student_id=:sid AND status IN ('open','in_recovery')
     ORDER BY is_root_cause DESC, FIELD(severity,'critical','weak','borderline','strong','mastered')
     LIMIT 1`,
    { org_id, sid: student_id }
  );
  if (weak) {
    const [topic] = await db.query(
      `SELECT accuracy FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:sid AND wiswits_id=:wid`,
      { org_id, sid: student_id, wid: weak.wiswits_id }
    );
    const difficulty = nextDifficulty(topic ? Number(topic.accuracy) : 0);
    const question = await qbankApi.pickOne({ wiswits_id: weak.wiswits_id, difficulty });
    return res.json({ question, reason: 'weak_area', target_wiswits_id: weak.wiswits_id });
  }

  // 3) challenge — random topic, hard difficulty
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const question = await qbankApi.pickOne({ wiswits_id: topic.id, difficulty: 'hard' });
  res.json({ question, reason: 'challenge', target_wiswits_id: topic.id, subject_id });
});

// ─── Record a response → SM-2 update ────────────────────────────
router.post('/practice/response', STUDENT_OR_TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student_id, question_id, wiswits_id, is_correct, time_sec, est_time_sec } = req.body || {};
  if (!student_id || !question_id || !wiswits_id) {
    return res.status(400).json({ error: 'student_id_question_id_wiswits_id_required' });
  }

  const quality = responseToQuality({
    is_correct: !!is_correct,
    time_ratio: (Number(time_sec) || 0) / (Number(est_time_sec) || 1),
  });

  const [existing] = await db.query(
    `SELECT * FROM client_pl_practice_card WHERE org_id=:org_id AND student_id=:sid AND question_id=:qid`,
    { org_id, sid: Number(student_id), qid: Number(question_id) }
  );
  const card = existing
    ? { ease_factor: Number(existing.ease_factor), interval_days: existing.interval_days, repetitions: existing.repetitions }
    : { ease_factor: 2.5, interval_days: 0, repetitions: 0 };

  const updated = sm2(card, quality);
  const lapseInc = quality < 3 ? 1 : 0;

  await db.query(
    `INSERT INTO client_pl_practice_card
       (org_id, student_id, question_id, wiswits_id, ease_factor, interval_days, repetitions, due_at,
        last_result, last_reviewed_at, lapses)
     VALUES (:org_id, :sid, :qid, :wid, :ef, :iv, :rep, :due, :result, NOW(), :lapse)
     ON DUPLICATE KEY UPDATE
       wiswits_id = VALUES(wiswits_id), ease_factor = VALUES(ease_factor), interval_days = VALUES(interval_days),
       repetitions = VALUES(repetitions), due_at = VALUES(due_at), last_result = VALUES(last_result),
       last_reviewed_at = NOW(), lapses = lapses + :lapse`,
    {
      org_id, sid: Number(student_id), qid: Number(question_id), wid: wiswits_id,
      ef: updated.ease_factor, iv: updated.interval_days, rep: updated.repetitions,
      due: toMysqlDateTime(updated.due_at), result: is_correct ? 1 : 0, lapse: lapseInc,
    }
  );

  const [card_row] = await db.query(
    `SELECT * FROM client_pl_practice_card WHERE org_id=:org_id AND student_id=:sid AND question_id=:qid`,
    { org_id, sid: Number(student_id), qid: Number(question_id) }
  );
  res.json({ quality, card: card_row });
});

// ─── Due cards ───────────────────────────────────────────────────
router.get('/practice/due', STUDENT_OR_TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });
  const rows = await db.query(
    `SELECT * FROM client_pl_practice_card
     WHERE org_id=:org_id AND student_id=:sid AND due_at IS NOT NULL AND due_at <= NOW()
     ORDER BY due_at ASC LIMIT :limit`,
    { org_id, sid: student_id, limit: Number(req.query.limit || 50) }
  );
  res.json({ due: rows });
});

// ─── Daily streak ────────────────────────────────────────────────
router.get('/practice/streak', STUDENT_OR_TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  const rows = await db.query(
    `SELECT DISTINCT DATE(last_reviewed_at) AS d FROM client_pl_practice_card
     WHERE org_id=:org_id AND student_id=:sid AND last_reviewed_at IS NOT NULL
     ORDER BY d DESC`,
    { org_id, sid: student_id }
  );
  // dateStrings:true → 'YYYY-MM-DD' strings. Convert to a UTC day-index using
  // the SAME y/m/d→UTC conversion for both the DB dates and "today", so local
  // timezone offset can never desync the two sides of the comparison.
  const toDayIndex = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const days = rows.map((r) => {
    const [y, m, d] = String(r.d).split('-').map(Number);
    return toDayIndex(y, m, d);
  });

  if (!days.length) return res.json({ current_streak: 0, longest_streak_seen: 0 });

  const now = new Date();
  const today = toDayIndex(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const yesterday = today - 1;

  // current streak: consecutive days walking back from today/yesterday
  let current_streak = 0;
  if (days[0] === today || days[0] === yesterday) {
    current_streak = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i - 1] - days[i] === 1) current_streak++;
      else break;
    }
  }

  // longest run found anywhere in the available dates
  let longest_streak_seen = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = (days[i - 1] - days[i] === 1) ? run + 1 : 1;
    if (run > longest_streak_seen) longest_streak_seen = run;
  }

  res.json({ current_streak, longest_streak_seen });
});

// ─── Stats ───────────────────────────────────────────────────────
router.get('/practice/stats', STUDENT_OR_TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  const [row] = await db.query(
    `SELECT
       COUNT(*) AS cards_total,
       SUM(CASE WHEN due_at IS NOT NULL AND due_at <= NOW() THEN 1 ELSE 0 END) AS cards_due,
       SUM(CASE WHEN repetitions >= 3 AND ease_factor > 2.5 THEN 1 ELSE 0 END) AS cards_mastered,
       AVG(ease_factor) AS avg_ease_factor
     FROM client_pl_practice_card WHERE org_id=:org_id AND student_id=:sid`,
    { org_id, sid: student_id }
  );

  res.json({
    cards_total: Number(row.cards_total) || 0,
    cards_due: Number(row.cards_due) || 0,
    cards_mastered: Number(row.cards_mastered) || 0,
    avg_ease_factor: row.avg_ease_factor != null ? Number(Number(row.avg_ease_factor).toFixed(3)) : null,
  });
});

module.exports = router;
