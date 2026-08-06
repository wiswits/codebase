'use strict';

/**
 * /api/pl/weak-areas/* — read APIs over the ⭐⭐ core output table.
 * Includes the Evidence API (Rule 8): "kyun weak bola?" → proof, not a black box.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;

// ─── List with filters ─────────────────────────────────────────
router.get('/weak-areas', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student, severity, status, subject } = req.query;
  const clauses = ['org_id = :org_id'];
  const params = { org_id, limit: Number(req.query.limit || 100) };
  if (student) { clauses.push('student_id = :student'); params.student = Number(student); }
  if (severity) { clauses.push('severity = :severity'); params.severity = severity; }
  if (status) { clauses.push('status = :status'); params.status = status; }
  if (subject) { clauses.push('subject_id = :subject'); params.subject = Number(subject); }

  const rows = await db.query(
    `SELECT id, student_id, wiswits_id, subject_id, severity, accuracy, sample_size, confidence,
            is_root_cause, root_wiswits_id, depth_from_root, dominant_error_type, status, detected_at
     FROM client_pl_weak_area WHERE ${clauses.join(' AND ')}
     ORDER BY FIELD(severity,'critical','weak','borderline','strong','mastered'), accuracy ASC
     LIMIT :limit`,
    params
  );
  res.json({ weak_areas: rows.map((r) => ({ ...r, label: topicLabel(r.wiswits_id), student_name: nameFor(r.student_id) })) });
});

// ─── Root cause chain + viz data for one student ──────────────
router.get('/weak-areas/student/:id/roots', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const rows = await db.query(
    `SELECT wiswits_id, severity, accuracy, is_root_cause, root_wiswits_id, depth_from_root, status
     FROM client_pl_weak_area WHERE org_id=:org_id AND student_id=:student_id ORDER BY depth_from_root ASC`,
    { org_id, student_id }
  );
  const byRoot = {};
  for (const w of rows) (byRoot[w.root_wiswits_id] ||= []).push({ ...w, label: topicLabel(w.wiswits_id) });
  const chains = Object.entries(byRoot).map(([root, chain]) => ({
    root_wiswits_id: root, root_label: topicLabel(root),
    chain: chain.sort((a, b) => a.depth_from_root - b.depth_from_root),
  }));
  res.json({ student_id, chains });
});

// ─── Evidence — "why weak?" proof ──────────────────────────────
router.get('/weak-areas/:id/evidence', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const [wa] = await db.query(`SELECT * FROM client_pl_weak_area WHERE id=:id AND org_id=:org_id`, { id: Number(req.params.id), org_id });
  if (!wa) return res.status(404).json({ error: 'not_found' });

  const [topic] = await db.query(
    `SELECT attempted, correct, accuracy, avg_time_sec, easy_acc, medium_acc, hard_acc, sample_size, last_attempt_at
     FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:sid AND wiswits_id=:wid`,
    { org_id, sid: wa.student_id, wid: wa.wiswits_id }
  );
  const recentWrong = await db.query(
    `SELECT r.difficulty, r.time_sec, r.marks_awarded, a.submitted_at
     FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
     WHERE a.org_id=:org_id AND a.student_id=:sid AND r.wiswits_id=:wid AND r.is_correct = 0
     ORDER BY a.submitted_at DESC LIMIT 10`,
    { org_id, sid: wa.student_id, wid: wa.wiswits_id }
  );

  res.json({
    weak_area: { ...wa, label: topicLabel(wa.wiswits_id), student_name: nameFor(wa.student_id) },
    topic_stats: topic || null,
    recent_wrong_responses: recentWrong,
    explanation: `${nameFor(wa.student_id)} ne ${wa.wiswits_id} (${topicLabel(wa.wiswits_id)}) me ${wa.sample_size} attempts kiye, `
      + `${wa.accuracy}% accuracy — ${wa.severity} band. Confidence ${wa.confidence} `
      + `(sample size + recency + consistency se bana). Isliye weak flag laga.`,
  });
});

// ─── Manual override (teacher, reason mandatory — Rule) ────────
router.patch('/weak-areas/:id/status', requirePermission('teacher', 'principal'), async (req, res) => {
  const { status, reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'reason_required' });
  await db.query(
    `UPDATE client_pl_weak_area SET status=:status, override_by=:uid, override_reason=:reason WHERE id=:id AND org_id=:org_id`,
    { status, uid: req.ctx.user_id || 1, reason, id: Number(req.params.id), org_id: req.ctx.org_id }
  );
  res.json({ ok: true });
});

module.exports = router;
