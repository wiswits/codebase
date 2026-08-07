'use strict';

/**
 * /api/pl/analytics/test/:id/{distractors,clusters,quality,distribution,toppers}
 * and /api/pl/weak-areas/{heatmap,recompute} — class/test-level analytics that
 * lean on the distractor + weak-area-detector + root-cause cores.
 *
 * ⚠️ /toppers is SCORE ONLY — no student_id, no name, per the dignity rules
 *    already enforced by algorithms/benchmark.js.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { median, stdDev } = require('../algorithms/util');
const { discriminationIndex, analyzeQuestion, clusterMisconceptions } = require('../algorithms/distractor');
const { detectFromTopics } = require('../algorithms/weakAreaDetector');
const { findRootCauses } = require('../algorithms/rootCause');
const { SEVERITY_BANDS } = require('../algorithms/constants');
const { curriculumApi } = require('../external');
const { TOPICS, CHAPTER_NAME } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;
const TEACHER = requirePermission('teacher', 'principal');

function safeParseJson(v) {
  if (v == null) return null;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return null; }
}

// ─── Shared loader: questions + evaluated attempts + responses for a test ──
async function loadTestData(org_id, test_id) {
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

  const attempts = await db.query(
    `SELECT id, percentage FROM client_pl_attempt
     WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated' ORDER BY percentage DESC`,
    { org_id, test_id }
  );

  const respRows = await db.query(
    `SELECT r.attempt_id, r.test_question_id, r.answer_json, r.is_correct, a.student_id
     FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
     WHERE r.org_id=:org_id AND a.test_id=:test_id AND a.status='evaluated'`,
    { org_id, test_id }
  );

  const byQuestion = {}; // test_question_id -> [{answer_json, is_correct, student_id}]
  const byAttemptQuestion = {}; // "attemptId:tqId" -> is_correct (bool)
  for (const r of respRows) {
    (byQuestion[r.test_question_id] ||= []).push({
      answer_json: safeParseJson(r.answer_json), is_correct: !!r.is_correct, student_id: r.student_id,
    });
    byAttemptQuestion[`${r.attempt_id}:${r.test_question_id}`] = !!r.is_correct;
  }

  return { questions, attempts, byQuestion, byAttemptQuestion };
}

/** Internal — not an HTTP self-call. Real, actionable misconceptions only. */
async function computeDistractorInsights(org_id, test_id) {
  const { questions, byQuestion } = await loadTestData(org_id, test_id);
  const insights = [];
  for (const q of questions) {
    const responses = byQuestion[q.question_id] || [];
    const { insight } = analyzeQuestion(q, responses, null);
    if (insight) insights.push(insight);
  }
  return insights;
}

// ─── Distractor / misconception insights per question ──────────────
router.get('/analytics/test/:id/distractors', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const insights = await computeDistractorInsights(org_id, test_id);
  res.json({ insights });
});

// ─── Cluster misconceptions that recur across 2+ questions ──────────
router.get('/analytics/test/:id/clusters', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const insights = await computeDistractorInsights(org_id, test_id);
  res.json({ clusters: clusterMisconceptions(insights) });
});

// ─── Question quality flags: key_error / ambiguous / non_discriminating ─
router.get('/analytics/test/:id/quality', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const { questions, attempts, byQuestion, byAttemptQuestion } = await loadTestData(org_id, test_id);

  const flags = [];
  for (const q of questions) {
    const responses = byQuestion[q.question_id] || [];
    const di = discriminationIndex(
      attempts,
      (attempt) => byAttemptQuestion[`${attempt.id}:${q.question_id}`] === true
    );
    const { flags: qFlags } = analyzeQuestion(q, responses, di);
    for (const f of qFlags) flags.push({ ...f, seq: q.seq, wiswits_id: q.wiswits_id, discrimination_index: di });
  }

  res.json({ flags });
});

// ─── Score distribution histogram (10-point bins) ───────────────────
router.get('/analytics/test/:id/distribution', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const rows = await db.query(
    `SELECT percentage FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated'`,
    { org_id, test_id }
  );
  const scores = rows.map((r) => Number(r.percentage));
  if (!scores.length) return res.json({ attempted_count: 0, bins: [] });

  const bins = [];
  for (let lo = 0; lo < 100; lo += 10) {
    const hi = lo + 10;
    const count = scores.filter((s) => s >= lo && (hi === 100 ? s <= hi : s < hi)).length;
    bins.push({ range: `${lo}-${hi}`, count });
  }

  res.json({
    attempted_count: scores.length,
    bins,
    avg_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    median_score: Math.round(median(scores)),
    std_dev: Math.round(stdDev(scores)),
    topper_score: Math.max(...scores),
    lowest_score: Math.min(...scores),
  });
});

// ─── Toppers — SCORE ONLY, no names, no student ids ─────────────────
router.get('/analytics/test/:id/toppers', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const limit = Number(req.query.limit || 5);
  const rows = await db.query(
    `SELECT percentage FROM client_pl_attempt WHERE org_id=:org_id AND test_id=:test_id AND status='evaluated'
     ORDER BY percentage DESC LIMIT :limit`,
    { org_id, test_id, limit }
  );
  res.json({ scores: rows.map((r) => Number(r.percentage)) });
});

// ─── Weak-area heatmap: topic × severity-band matrix ────────────────
router.get('/weak-areas/heatmap', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const scope = req.query.scope || 'class';
  const bands = Object.keys(SEVERITY_BANDS);

  const clauses = ['org_id = :org_id'];
  const params = { org_id };
  if (scope === 'student') {
    if (!req.query.student_id) return res.status(400).json({ error: 'student_id_required' });
    clauses.push('student_id = :student_id');
    params.student_id = Number(req.query.student_id);
  }
  // scope 'class' and 'school' both aggregate across the whole seeded org for this demo.

  const rows = await db.query(
    `SELECT wiswits_id, severity, COUNT(*) AS n
     FROM client_pl_weak_area WHERE ${clauses.join(' AND ')}
     GROUP BY wiswits_id, severity`,
    params
  );

  const byTopic = {};
  for (const t of TOPICS) byTopic[t.id] = Object.fromEntries(bands.map((b) => [b, 0]));
  for (const r of rows) {
    if (!byTopic[r.wiswits_id]) byTopic[r.wiswits_id] = Object.fromEntries(bands.map((b) => [b, 0]));
    byTopic[r.wiswits_id][r.severity] = r.n;
  }

  res.json({
    scope,
    bands,
    matrix: TOPICS.map((t) => ({ wiswits_id: t.id, label: topicLabel(t.id), counts: byTopic[t.id] })),
  });
});

// ─── Recompute weak areas for a student (or a small demo batch) ─────
router.post('/weak-areas/recompute', TEACHER, async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student_id } = req.body || {};

  let studentIds;
  if (student_id) {
    studentIds = [Number(student_id)];
  } else {
    const rows = await db.query(
      `SELECT DISTINCT student_id FROM client_pl_topic_score WHERE org_id=:org_id ORDER BY student_id LIMIT 5`,
      { org_id }
    );
    studentIds = rows.map((r) => r.student_id);
  }

  const graph = await curriculumApi.getPrerequisiteGraph();
  let candidates_found = 0;

  for (const sid of studentIds) {
    const topicRows = await db.query(
      `SELECT wiswits_id, subject_id, accuracy, attempted, last_attempt_at, variance, easy_acc, medium_acc, hard_acc
       FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:sid`,
      { org_id, sid }
    );
    const topics = topicRows.map((t) => ({
      wiswits_id: t.wiswits_id, subject_id: t.subject_id, accuracy: Number(t.accuracy),
      attempted: t.attempted, last_attempt_at: t.last_attempt_at,
      variance: t.variance != null ? Number(t.variance) : null,
      easy_acc: t.easy_acc != null ? Number(t.easy_acc) : null,
      medium_acc: t.medium_acc != null ? Number(t.medium_acc) : null,
      hard_acc: t.hard_acc != null ? Number(t.hard_acc) : null,
    }));

    const { candidates } = detectFromTopics(topics);
    const withRoots = findRootCauses(candidates, graph);
    candidates_found += withRoots.length;

    for (const wa of withRoots) {
      await db.query(
        `INSERT INTO client_pl_weak_area
           (org_id, student_id, wiswits_id, subject_id, severity, accuracy, sample_size, confidence,
            is_root_cause, root_wiswits_id, depth_from_root, detected_at, status)
         VALUES (:org_id, :student_id, :wiswits_id, :subject_id, :severity, :accuracy, :sample_size, :confidence,
                 :is_root_cause, :root_wiswits_id, :depth_from_root, NOW(), 'open')
         ON DUPLICATE KEY UPDATE
           severity = VALUES(severity), accuracy = VALUES(accuracy), sample_size = VALUES(sample_size),
           confidence = VALUES(confidence), is_root_cause = VALUES(is_root_cause),
           root_wiswits_id = VALUES(root_wiswits_id), depth_from_root = VALUES(depth_from_root),
           detected_at = NOW(), status = IF(status = 'closed', 'closed', 'open')`,
        {
          org_id, student_id: sid, wiswits_id: wa.wiswits_id, subject_id: wa.subject_id,
          severity: wa.severity, accuracy: wa.accuracy, sample_size: wa.sample_size, confidence: wa.confidence,
          is_root_cause: wa.is_root_cause ? 1 : 0, root_wiswits_id: wa.root_wiswits_id, depth_from_root: wa.depth_from_root,
        }
      );
    }
  }

  res.json({ processed: studentIds.length, candidates_found });
});

module.exports = router;
