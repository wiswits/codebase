'use strict';

/**
 * /api/pl/cycles/* — ALGORITHM 6 service layer (spec Block E).
 * ⭐⭐⭐ THE LOOP — proof that WISWITS closes gaps, not just detects them.
 *
 * Separate from routes/cycles.js (which only owns /cycles/stats — untouched).
 * The pure decisions (classifyOutcome, nextAction, canStartCycle) live in
 * algorithms/recoveryCycle.js; this file is the I/O shell.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const recoveryCycle = require('../algorithms/recoveryCycle');

// ─── GET /cycles — filters ──────────────────────────────────────
router.get('/cycles', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student, outcome, status } = req.query;
  const clauses = ['org_id = :org_id'];
  const params = { org_id, limit: Number(req.query.limit || 200) };
  if (student) { clauses.push('student_id = :student'); params.student = Number(student); }
  if (outcome) { clauses.push('outcome = :outcome'); params.outcome = outcome; }
  if (status === 'open') clauses.push('outcome IS NULL');
  else if (status) { clauses.push('outcome = :status'); params.status = status; }

  const rows = await db.query(
    `SELECT * FROM client_pl_recovery_cycle WHERE ${clauses.join(' AND ')} ORDER BY detected_at DESC LIMIT :limit`,
    params
  );
  res.json({ cycles: rows });
});

// ─── GET /cycles/student/:id — full history, annotated ─────────
router.get('/cycles/student/:id', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const rows = await db.query(
    `SELECT c.*, w.status AS weak_area_status, w.severity AS weak_area_severity
     FROM client_pl_recovery_cycle c
     LEFT JOIN client_pl_weak_area w ON w.id = c.weak_area_id AND w.org_id = c.org_id
     WHERE c.org_id = :org_id AND c.student_id = :student_id
     ORDER BY c.detected_at DESC`,
    { org_id, student_id }
  );
  res.json({ student_id, cycles: rows });
});

// ─── POST /cycles/start ─────────────────────────────────────────
router.post('/cycles/start', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { weak_area_id } = req.body;
  if (!weak_area_id) return res.status(400).json({ error: 'weak_area_id_required' });

  const [wa] = await db.query(`SELECT * FROM client_pl_weak_area WHERE id=:id AND org_id=:org_id`, { id: weak_area_id, org_id });
  if (!wa) return res.status(404).json({ error: 'weak_area_not_found' });

  const [{ cnt }] = await db.query(
    `SELECT COUNT(*) AS cnt FROM client_pl_recovery_cycle WHERE org_id=:org_id AND weak_area_id=:weak_area_id`,
    { org_id, weak_area_id }
  );
  const decision = recoveryCycle.canStartCycle(Number(cnt));

  if (!decision.allowed) {
    emit('pl.needs_teacher', { org_id, student_id: wa.student_id, weak_area_id, wiswits_id: wa.wiswits_id, reason: 'max_cycles_exceeded', cycles: Number(cnt) });
    return res.json({ needs_teacher: true, cycles: Number(cnt) });
  }

  const r = await db.query(
    `INSERT INTO client_pl_recovery_cycle (org_id, student_id, weak_area_id, wiswits_id, cycle_no, detected_at, detected_accuracy)
     VALUES (:org_id, :student_id, :weak_area_id, :wiswits_id, :cycle_no, NOW(), :accuracy)`,
    { org_id, student_id: wa.student_id, weak_area_id, wiswits_id: wa.wiswits_id, cycle_no: decision.cycleNo, accuracy: wa.accuracy }
  );
  await db.query(`UPDATE client_pl_weak_area SET status='in_recovery' WHERE id=:id AND org_id=:org_id`, { id: weak_area_id, org_id });

  const [cycle] = await db.query(`SELECT * FROM client_pl_recovery_cycle WHERE id=:id`, { id: r.insertId });
  res.status(201).json(cycle);
});

// ─── POST /cycles/:id/retest ────────────────────────────────────
router.post('/cycles/:id/retest', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const { retest_accuracy, retest_attempt_id } = req.body;
  if (retest_accuracy == null) return res.status(400).json({ error: 'retest_accuracy_required' });

  const [cycle] = await db.query(`SELECT * FROM client_pl_recovery_cycle WHERE id=:id AND org_id=:org_id`, { id, org_id });
  if (!cycle) return res.status(404).json({ error: 'not_found' });

  const { outcome, delta } = recoveryCycle.classifyOutcome(Number(cycle.detected_accuracy), Number(retest_accuracy));
  const closed = outcome === 'closed';
  const daysToClose = closed
    ? Math.max(0, Math.round((Date.now() - new Date(cycle.detected_at).getTime()) / 86400000))
    : null;

  await db.query(
    `UPDATE client_pl_recovery_cycle SET
       retest_accuracy=:retest_accuracy, retest_at=NOW(), retest_attempt_id=:retest_attempt_id,
       delta=:delta, outcome=:outcome, days_to_close=:days_to_close, closed_at=:closed_at
     WHERE id=:id AND org_id=:org_id`,
    {
      retest_accuracy, retest_attempt_id: retest_attempt_id || null, delta, outcome,
      days_to_close: daysToClose, closed_at: closed ? new Date() : null, id, org_id,
    }
  );

  const nextAction = recoveryCycle.nextAction(outcome);

  const [wa] = await db.query(`SELECT * FROM client_pl_weak_area WHERE id=:id AND org_id=:org_id`, { id: cycle.weak_area_id, org_id });

  if (nextAction.action === 'close_weak_area') {
    await db.query(`UPDATE client_pl_weak_area SET status='closed', closed_at=NOW() WHERE id=:id AND org_id=:org_id`, { id: cycle.weak_area_id, org_id });
    emit('pl.gap_closed', {
      org_id, student_id: cycle.student_id, weak_area_id: cycle.weak_area_id, wiswits_id: cycle.wiswits_id,
      before: Number(cycle.detected_accuracy), after: Number(retest_accuracy), delta,
      cycles: cycle.cycle_no, days: daysToClose,
    });
  } else if (nextAction.action === 'escalate') {
    await db.query(`UPDATE client_pl_weak_area SET status='escalated' WHERE id=:id AND org_id=:org_id`, { id: cycle.weak_area_id, org_id });
    emit('pl.needs_teacher', {
      org_id, student_id: cycle.student_id, weak_area_id: cycle.weak_area_id, wiswits_id: cycle.wiswits_id, reason: 'worsened',
    });
  }
  // 'start_cycle' → weak_area stays 'in_recovery'; a new cycle can be started via /cycles/start.
  void wa;

  const [updated] = await db.query(`SELECT * FROM client_pl_recovery_cycle WHERE id=:id`, { id });
  res.json({ outcome, cycle: updated, next_action: nextAction });
});

// ─── GET /cycles/timeline/:student_id ───────────────────────────
router.get('/cycles/timeline/:student_id', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.student_id);
  const rows = await db.query(
    `SELECT id, weak_area_id, wiswits_id, cycle_no, detected_at, detected_accuracy,
            retest_at, retest_accuracy, delta, outcome, days_to_close, closed_at
     FROM client_pl_recovery_cycle WHERE org_id=:org_id AND student_id=:student_id ORDER BY detected_at ASC`,
    { org_id, student_id }
  );
  res.json({
    student_id,
    timeline: rows.map((r) => ({
      cycle_id: r.id,
      wiswits_id: r.wiswits_id,
      cycle_no: r.cycle_no,
      detected_at: r.detected_at,
      before: Number(r.detected_accuracy),
      after: r.retest_accuracy != null ? Number(r.retest_accuracy) : null,
      delta: r.delta != null ? Number(r.delta) : null,
      outcome: r.outcome,
      days: r.days_to_close,
      closed_at: r.closed_at,
    })),
  });
});

module.exports = router;
