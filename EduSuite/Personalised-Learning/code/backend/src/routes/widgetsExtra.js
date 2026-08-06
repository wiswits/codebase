'use strict';

/**
 * /api/pl/widgets/* — remaining dashboard widget payloads (small, compact
 * cards). See widgets.js for the recovery-stats route and the SQL style this
 * file follows. This file is additive — widgets.js is untouched.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;

const SEVERITY_RANK = { critical: 0, weak: 1, borderline: 2, strong: 3, mastered: 4 };

// ─── student: my-weak-areas ──────────────────────────────────────
router.get('/widgets/my-weak-areas', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  try {
    const rows = await db.query(
      `SELECT wiswits_id, severity, accuracy, is_root_cause
       FROM client_pl_weak_area
       WHERE org_id = :org_id AND student_id = :student_id AND status IN ('open','in_recovery')
       ORDER BY FIELD(severity,'critical','weak','borderline','strong','mastered') ASC, accuracy ASC
       LIMIT 5`,
      { org_id, student_id }
    );
    res.json({
      weak_areas: rows.map((r) => ({
        wiswits_id: r.wiswits_id,
        label: topicLabel(r.wiswits_id),
        severity: r.severity,
        accuracy: Number(r.accuracy),
        is_root_cause: !!r.is_root_cause,
      })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── student: my-progress ────────────────────────────────────────
router.get('/widgets/my-progress', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  try {
    const rows = await db.query(
      `SELECT percentage FROM client_pl_attempt
       WHERE org_id = :org_id AND student_id = :student_id AND status = 'evaluated' AND is_offline_entry = 1
       ORDER BY submitted_at ASC`,
      { org_id, student_id }
    );
    const first = rows[0] ? Number(rows[0].percentage) : null;
    const latest = rows.length ? Number(rows[rows.length - 1].percentage) : null;
    const delta = first != null && latest != null ? Math.round(latest - first) : null;
    let trend = 'stable';
    if (delta != null) trend = delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable';
    res.json({ current_avg: latest, delta_since_first: delta, trend });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── student: practice-streak ────────────────────────────────────
router.get('/widgets/practice-streak', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  try {
    const days = await db.query(
      `SELECT DISTINCT DATE(last_reviewed_at) AS d
       FROM client_pl_practice_card
       WHERE org_id = :org_id AND student_id = :student_id AND last_reviewed_at IS NOT NULL
       ORDER BY d DESC`,
      { org_id, student_id }
    );
    // count consecutive days back from the most recent reviewed day (days is
    // DISTINCT DATE(...) sorted DESC, so each row is a unique calendar day)
    let streak = 0;
    if (days.length) {
      streak = 1;
      let cursor = new Date(days[0].d);
      for (let i = 1; i < days.length; i++) {
        const d = new Date(days[i].d);
        const diffDays = Math.round((cursor - d) / 86400000);
        if (diffDays === 1) {
          streak++;
          cursor = d;
        } else break;
      }
    }
    const [dueRow] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_practice_card
       WHERE org_id = :org_id AND student_id = :student_id AND due_at <= NOW()`,
      { org_id, student_id }
    );
    res.json({ current_streak: streak, cards_due: Number(dueRow.n || 0) });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── student: next-worksheet ─────────────────────────────────────
router.get('/widgets/next-worksheet', requirePermission('student', 'teacher', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  try {
    const [ws] = await db.query(
      `SELECT id, target_wiswits_ids_json, strategy, total_questions, est_time_min, status, generated_at
       FROM client_pl_worksheet
       WHERE org_id = :org_id AND student_id = :student_id AND status IN ('generated','assigned')
       ORDER BY generated_at DESC LIMIT 1`,
      { org_id, student_id }
    );
    if (!ws) return res.json({ worksheet: null, message: 'No worksheet pending — kaam khatam!' });
    let targets = [];
    try { targets = JSON.parse(ws.target_wiswits_ids_json || '[]'); } catch { targets = []; }
    res.json({
      worksheet: {
        id: ws.id,
        strategy: ws.strategy,
        total_questions: ws.total_questions,
        est_time_min: ws.est_time_min,
        status: ws.status,
        generated_at: ws.generated_at,
        targets: targets.map((t) => ({ wiswits_id: t, label: topicLabel(t) })),
      },
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── teacher: reteach-alerts ──────────────────────────────────────
router.get('/widgets/reteach-alerts', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  try {
    const [countRow] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_alert WHERE org_id = :org_id AND type = 'reteach_alert' AND status = 'new'`,
      { org_id }
    );
    const preview = await db.query(
      `SELECT id, title, severity, subject_id, created_at
       FROM client_pl_alert
       WHERE org_id = :org_id AND type = 'reteach_alert' AND status = 'new'
       ORDER BY created_at DESC LIMIT 3`,
      { org_id }
    );
    res.json({
      count: Number(countRow.n || 0),
      preview: preview.map((p) => ({ id: p.id, title: p.title, severity: p.severity, wiswits_id: p.subject_id, created_at: p.created_at })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── teacher: class-health ────────────────────────────────────────
// NOTE: the seed has no real class/section split — this is an org-wide
// (single-class-equivalent) quick health snapshot, not per-section.
router.get('/widgets/class-health', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  try {
    const [acc] = await db.query(
      `SELECT ROUND(AVG(accuracy)) AS avg_accuracy FROM client_pl_topic_score WHERE org_id = :org_id`,
      { org_id }
    );
    const [weak] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_weak_area WHERE org_id = :org_id AND severity IN ('critical','weak')`,
      { org_id }
    );
    const [escalated] = await db.query(
      `SELECT COUNT(DISTINCT student_id) AS n FROM client_pl_weak_area WHERE org_id = :org_id AND status = 'escalated'`,
      { org_id }
    );
    res.json({
      scope: 'org_wide',
      avg_accuracy: Number(acc.avg_accuracy || 0),
      weak_area_count: Number(weak.n || 0),
      students_escalated: Number(escalated.n || 0),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── teacher: attention-needed ───────────────────────────────────
router.get('/widgets/attention-needed', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  try {
    const rows = await db.query(
      `SELECT student_id, wiswits_id, severity
       FROM client_pl_weak_area
       WHERE org_id = :org_id AND status = 'escalated'
       ORDER BY detected_at DESC`,
      { org_id }
    );
    const byStudent = new Map();
    for (const r of rows) {
      if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, r);
    }
    const top = [...byStudent.values()].slice(0, 5);
    res.json({
      count: byStudent.size,
      students: top.map((r) => ({
        student_id: r.student_id,
        name: nameFor(r.student_id),
        wiswits_id: r.wiswits_id,
        severity: r.severity,
      })),
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── teacher: pending-evaluation ─────────────────────────────────
router.get('/widgets/pending-evaluation', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  try {
    const [submitted] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_attempt WHERE org_id = :org_id AND status = 'submitted'`,
      { org_id }
    );
    let offline_unmarked = 0;
    try {
      const [asRow] = await db.query(
        `SELECT COUNT(*) AS n FROM client_pl_assignment_student
         WHERE org_id = :org_id AND status NOT IN ('evaluated','absent','excused')`,
        { org_id }
      );
      offline_unmarked = Number(asRow.n || 0);
    } catch {
      offline_unmarked = 0;
    }
    res.json({
      pending_attempts: Number(submitted.n || 0),
      offline_unmarked,
      note: 'Online submissions auto-evaluate in this system, so pending_attempts is usually 0. offline_unmarked reflects assignment_student rows not yet evaluated/absent/excused.',
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── parent: child-progress ──────────────────────────────────────
router.get('/widgets/child-progress', requirePermission('parent', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.query.student_id);
  if (!student_id) return res.status(400).json({ error: 'student_id required' });
  try {
    const rows = await db.query(
      `SELECT percentage FROM client_pl_attempt
       WHERE org_id = :org_id AND student_id = :student_id AND status = 'evaluated' AND is_offline_entry = 1
       ORDER BY submitted_at ASC`,
      { org_id, student_id }
    );
    const first = rows[0] ? Number(rows[0].percentage) : null;
    const latest = rows.length ? Number(rows[rows.length - 1].percentage) : null;
    const delta = first != null && latest != null ? Math.round(latest - first) : null;
    let trend = 'stable';
    if (delta != null) trend = delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable';

    let narrative;
    if (delta == null) narrative = `${nameFor(student_id)} abhi apni pehli test ka intezaar kar raha/rahi hai.`;
    else if (delta > 2) narrative = `${nameFor(student_id)} ne pichle tests se ${delta} points sudhaar dikhaya hai — accha kaam ho raha hai!`;
    else if (delta < -2) narrative = `${nameFor(student_id)} ko thoda extra support chahiye is samay — hum saath me kaam kar rahe hain.`;
    else narrative = `${nameFor(student_id)} steady progress kar raha/rahi hai.`;

    res.json({ current_avg: latest, delta_since_first: delta, trend, narrative });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

// ─── principal: subject-health ───────────────────────────────────
router.get('/widgets/subject-health', requirePermission('principal', 'teacher'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const subject_id = Number(req.query.subject_id || 9001);
  try {
    const [acc] = await db.query(
      `SELECT ROUND(AVG(accuracy)) AS avg_accuracy FROM client_pl_topic_score WHERE org_id = :org_id AND subject_id = :subject_id`,
      { org_id, subject_id }
    );
    const [gapsRow] = await db.query(
      `SELECT COUNT(*) AS n FROM client_pl_weak_area WHERE org_id = :org_id AND subject_id = :subject_id`,
      { org_id, subject_id }
    );
    const [cyclesRow] = await db.query(
      `SELECT COUNT(*) AS total, SUM(outcome = 'closed') AS closed
       FROM client_pl_recovery_cycle WHERE org_id = :org_id`,
      { org_id }
    );
    const total = Number(cyclesRow.total || 0);
    const closed = Number(cyclesRow.closed || 0);
    const close_rate = total ? Math.round((closed / total) * 100) : 0;
    res.json([
      {
        subject_id,
        name: 'Mathematics',
        avg_accuracy: Number(acc.avg_accuracy || 0),
        gaps: Number(gapsRow.n || 0),
        closed,
        close_rate,
      },
    ]);
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

module.exports = router;
