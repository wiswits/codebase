'use strict';

/**
 * /api/pl/insights/* — the teacher's live action list. Nothing here is
 * pre-seeded; every endpoint computes off the real tables on request.
 *
 *   GET /insights/reteach          class-wide misconceptions for one test
 *   GET /insights/attention        students who need a human, now
 *   GET /insights/question-quality org-wide flagged questions
 *   GET /insights/qbank-gaps       topics × difficulty where QBank is thin
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { analyzeQuestion } = require('../algorithms/distractor');
const { TOPICS, DIFFICULTIES, CHAPTER_NAME, nameFor } = require('../db/fixtures');
const { qbankApi } = require('../external');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;
const TEACHER = requirePermission('teacher', 'principal');

function safeParseJson(v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return null; }
}

// ─── Self-contained loader: questions + evaluated responses for a test ─────
// (Deliberately independent of testQuality.js — same shape, own query, per
// task instructions: don't cross-import, it's fine if the logic overlaps.)
async function loadTestQuestionsAndResponses(org_id, test_id) {
  const tqRows = await db.query(
    `SELECT id, seq, wiswits_id, marks, question_snapshot_json
     FROM client_pl_test_question WHERE org_id=:org_id AND test_id=:test_id ORDER BY seq ASC`,
    { org_id, test_id }
  );
  const questions = tqRows.map((tq) => {
    const snap = safeParseJson(tq.question_snapshot_json) || {};
    const optionMeta = {};
    if (Array.isArray(snap.options)) {
      for (const o of snap.options) {
        optionMeta[o.key] = {
          text: o.text, distractor_reason: o.distractor_reason,
          misconception: o.misconception, remediation_hint: o.remediation_hint,
        };
      }
    }
    return {
      question_id: tq.id, seq: tq.seq, wiswits_id: tq.wiswits_id,
      marks: Number(tq.marks), correct_option: snap.correct ?? null, optionMeta,
    };
  });

  const respRows = await db.query(
    `SELECT r.test_question_id, r.answer_json, r.is_correct, a.student_id
     FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
     WHERE r.org_id=:org_id AND a.test_id=:test_id AND a.status='evaluated'`,
    { org_id, test_id }
  );
  const byQuestion = {};
  for (const r of respRows) {
    (byQuestion[r.test_question_id] ||= []).push({
      answer_json: safeParseJson(r.answer_json), is_correct: !!r.is_correct, student_id: r.student_id,
    });
  }
  return { questions, byQuestion };
}

// ─── Reteach alerts: class-wide / significant misconceptions ───────────────
router.get('/insights/reteach', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.query.test_id);
  if (!test_id) return res.status(400).json({ error: 'test_id_required' });

  const { questions, byQuestion } = await loadTestQuestionsAndResponses(org_id, test_id);

  const reteach = [];
  for (const q of questions) {
    const responses = byQuestion[q.question_id] || [];
    const { insight } = analyzeQuestion(q, responses, null);
    if (!insight) continue;

    const reteach_text = insight.misconception.remediation_hint
      || insight.misconception.explanation
      || `Class ko ${topicLabel(insight.wiswits_id)} par dobara samjhaayein — ${insight.misconception.count} students ne "${insight.misconception.option}" chuna.`;

    reteach.push({
      headline: insight.headline,
      question_id: insight.question_id,
      wiswits_id: insight.wiswits_id,
      misconception: insight.misconception,
      count: insight.misconception.count,
      affected_students: insight.affected_students,
      action: {
        reteach_text,
        content_link: `/content/topics/${insight.wiswits_id}`,
      },
    });

    // ⭐ class_wide (>=50%) → persist an alert + emit, once per question per day
    if (insight.strength === 'class_wide') {
      const [existing] = await db.query(
        `SELECT id FROM client_pl_alert
         WHERE org_id=:org_id AND type='reteach_alert' AND subject_type='question' AND subject_id=:qid
           AND DATE(created_at) = CURDATE() LIMIT 1`,
        { org_id, qid: insight.question_id }
      );
      if (!existing) {
        await db.query(
          `INSERT INTO client_pl_alert (org_id, type, severity, target_role, subject_type, subject_id, title, body, action_json)
           VALUES (:org_id, 'reteach_alert', 'high', 'teacher', 'question', :qid, :title, :body, :action)`,
          {
            org_id,
            qid: insight.question_id,
            title: `${insight.headline} — ${topicLabel(insight.wiswits_id)}`,
            body: `${insight.misconception.count} students (${insight.misconception.pct}%) chose "${insight.misconception.option}" on Q${insight.seq}.`,
            action: JSON.stringify({ reteach_text, content_link: `/content/topics/${insight.wiswits_id}` }),
          }
        );
        emit('pl.reteach_alert', {
          org_id, test_id, question_id: insight.question_id, wiswits_id: insight.wiswits_id,
          pct: insight.misconception.pct,
        });
      }
    }
  }

  res.json({ reteach });
});

// ─── Students needing a human, now ─────────────────────────────────────────
router.get('/insights/attention', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await db.query(
    `SELECT wa.id, wa.student_id, wa.wiswits_id, wa.severity, wa.accuracy,
            (SELECT COUNT(*) FROM client_pl_recovery_cycle rc
              WHERE rc.org_id = wa.org_id AND rc.weak_area_id = wa.id) AS cycles_run
     FROM client_pl_weak_area wa
     WHERE wa.org_id = :org_id
       AND (wa.status = 'escalated' OR (wa.status IN ('open','in_recovery') AND wa.severity = 'critical'))
     ORDER BY FIELD(wa.severity,'critical','weak','borderline'), wa.accuracy ASC
     LIMIT :limit`,
    { org_id, limit: Number(req.query.limit || 100) }
  );

  res.json({
    students: rows.map((r) => ({
      student_id: r.student_id,
      name: nameFor(r.student_id),
      wiswits_id: r.wiswits_id,
      label: topicLabel(r.wiswits_id),
      severity: r.severity,
      accuracy: Number(r.accuracy),
      cycles_run: r.cycles_run,
    })),
  });
});

// ─── Org-wide question quality flags ───────────────────────────────────────
router.get('/insights/question-quality', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const rows = await db.query(
    `SELECT question_id, wiswits_id, attempts, correct, p_value, discrimination_index, flag, flag_reason
     FROM client_pl_question_stat WHERE org_id=:org_id AND flag != 'none'
     ORDER BY updated_at DESC LIMIT :limit`,
    { org_id, limit: Number(req.query.limit || 50) }
  );
  if (!rows.length) {
    return res.json({
      flags: [],
      note: 'no flagged questions yet — quality flags populate as client_pl_question_stat rows accumulate from nightly calibration',
    });
  }
  res.json({ flags: rows.map((r) => ({ ...r, label: topicLabel(r.wiswits_id) })) });
});

// ─── QBank supply gaps (topic × difficulty) ────────────────────────────────
router.get('/insights/qbank-gaps', TEACHER, async (req, res) => {
  const REQUEST = Number(req.query.count || 100); // deliberately large — surfaces real gaps only
  const gaps = [];
  for (const t of TOPICS) {
    for (const difficulty of DIFFICULTIES) {
      // eslint-disable-next-line no-await-in-loop
      const pool = await qbankApi.pick({ wiswits_id: t.id, difficulty, count: REQUEST });
      if (pool.length < REQUEST) {
        gaps.push({
          wiswits_id: t.id, label: topicLabel(t.id), difficulty,
          requested: REQUEST, available: pool.length, shortfall: REQUEST - pool.length,
        });
        emit('pl.qbank_shortage', { wiswits_id: t.id, difficulty, requested: REQUEST, available: pool.length });
      }
    }
  }
  res.json({
    gaps,
    note: gaps.length
      ? undefined
      : 'no shortages found — the mock QBank adapter generates questions on demand, so gaps only surface against the real QBank service',
  });
});

module.exports = router;
