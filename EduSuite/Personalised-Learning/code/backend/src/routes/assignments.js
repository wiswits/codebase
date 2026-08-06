'use strict';

/**
 * /api/pl/assignments/* — assignment & delivery layer (spec Block B).
 *
 *   GET   /assignments                       list (filters: test, class, status)
 *   POST  /assignments                       create + materialize assignment_student rows
 *   POST  /assignments/auto-group            weak-area-driven targeting → create
 *   POST  /assignments/preview-group         same matching logic, read-only
 *   PATCH /assignments/:id                   update mutable scheduling/delivery fields
 *   POST  /assignments/:id/close             close early
 *   POST  /assignments/:id/extend            push closes_at out
 *   GET   /assignments/:id/status            delivery funnel counts + per-student list
 *
 * ⚠️ SIMPLIFICATION: there is no real class-roster table in this schema slice.
 * For target_type='class'/'section' we materialize against the seeded demo
 * student range 900001..900500 (a slice sized off target_json.count, default
 * 30) — see materializeTargets(). In production this would resolve against
 * the platform's roster service instead.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { nameFor } = require('../db/fixtures');

const DEMO_STUDENT_FIRST = 900001;
const DEMO_STUDENT_LAST = 900500;

// ─── Resolve which student_ids an assignment targets ───────────
function materializeTargets(target_type, target_json) {
  const tj = target_json || {};
  if (target_type === 'students') {
    return (tj.student_ids || []).map(Number);
  }
  // class / section / batch — no real roster table in this schema slice;
  // fall back to a slice of the seeded demo students.
  const count = Math.max(1, Math.min(500, Number(tj.count) || 30));
  const offset = Math.max(0, Number(tj.offset) || 0);
  const ids = [];
  for (let i = 0; i < count; i++) {
    const id = DEMO_STUDENT_FIRST + offset + i;
    if (id > DEMO_STUDENT_LAST) break;
    ids.push(id);
  }
  return ids;
}

async function insertAssignmentStudents(org_id, assignment_id, student_ids) {
  if (!student_ids.length) return;
  const rows = student_ids.map((sid) => [org_id, assignment_id, sid]);
  await db.query(
    `INSERT IGNORE INTO client_pl_assignment_student (org_id, assignment_id, student_id)
     VALUES ${rows.map(() => '(?,?,?)').join(',')}`,
    rows.flat()
  );
}

async function createAssignment(org_id, uid, body) {
  const {
    test_id, target_type, target_json, auto_group_rule_json = null,
    opens_at = null, closes_at = null, attempts_allowed = 1, time_limit_min = null,
    shuffle_questions = false, shuffle_options = false,
    show_solution = 'after_close', show_score = 'after_submit', mode = 'test',
  } = body;

  const r = await db.query(
    `INSERT INTO client_pl_assignment (org_id, test_id, target_type, target_json, auto_group_rule_json,
       opens_at, closes_at, attempts_allowed, time_limit_min, shuffle_questions, shuffle_options,
       show_solution, show_score, mode, status, created_by)
     VALUES (:org_id, :test_id, :target_type, :target_json, :auto_group_rule_json,
       :opens_at, :closes_at, :attempts_allowed, :time_limit_min, :shuffle_questions, :shuffle_options,
       :show_solution, :show_score, :mode, 'open', :uid)`,
    {
      org_id, test_id, target_type, target_json: JSON.stringify(target_json || {}),
      auto_group_rule_json: auto_group_rule_json ? JSON.stringify(auto_group_rule_json) : null,
      opens_at, closes_at, attempts_allowed, time_limit_min,
      shuffle_questions: shuffle_questions ? 1 : 0, shuffle_options: shuffle_options ? 1 : 0,
      show_solution, show_score, mode, uid: uid || 1,
    }
  );
  return r.insertId;
}

// ─── List with filters ─────────────────────────────────────────
router.get('/assignments', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { test, status } = req.query;
  const clauses = ['a.org_id = :org_id'];
  const params = { org_id };
  if (test) { clauses.push('a.test_id = :test'); params.test = Number(test); }
  if (status) { clauses.push('a.status = :status'); params.status = status; }
  // 'class' filter matches against target_json (best-effort — no roster table).
  if (req.query.class) {
    clauses.push(`JSON_EXTRACT(a.target_json, '$.class_no') = :class_no`);
    params.class_no = Number(req.query.class);
  }

  const rows = await db.query(
    `SELECT a.id, a.test_id, t.title AS test_title, a.target_type, a.target_json, a.status,
            a.opens_at, a.closes_at, a.attempts_allowed, a.time_limit_min, a.mode, a.created_at,
            (SELECT COUNT(*) FROM client_pl_assignment_student s WHERE s.assignment_id = a.id) AS student_count
     FROM client_pl_assignment a
     JOIN client_pl_test t ON t.id = a.test_id AND t.org_id = a.org_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY a.created_at DESC`,
    params
  );
  res.json({ assignments: rows });
});

// ─── Create ─────────────────────────────────────────────────────
router.post('/assignments', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { test_id, target_type, target_json } = req.body;
  if (!test_id || !target_type) return res.status(400).json({ error: 'test_id_and_target_type_required' });

  const [test] = await db.query(`SELECT id FROM client_pl_test WHERE id=:id AND org_id=:org_id`, { id: test_id, org_id });
  if (!test) return res.status(404).json({ error: 'test_not_found' });

  const assignment_id = await createAssignment(org_id, req.ctx.user_id, req.body);
  const student_ids = materializeTargets(target_type, target_json);
  await insertAssignmentStudents(org_id, assignment_id, student_ids);

  emit('pl.assigned', { org_id, assignment_id, test_id, target_type, student_ids });

  res.status(201).json({ id: assignment_id, test_id, target_type, student_count: student_ids.length, student_ids });
});

// ─── Auto-group matching logic (shared by auto-group + preview-group) ──
async function matchWeakStudents(org_id, subject_id, rule) {
  const wiswits_id = rule?.weak_in;
  if (!wiswits_id) return [];
  const severity = Array.isArray(rule.severity) && rule.severity.length ? rule.severity : ['critical', 'weak'];
  const status = Array.isArray(rule.status) && rule.status.length ? rule.status : ['open', 'in_recovery'];

  const sevPlaceholders = severity.map(() => '?').join(',');
  const statusPlaceholders = status.map(() => '?').join(',');
  const params = [org_id, wiswits_id, ...severity, ...status];
  let sql = `SELECT student_id, severity, accuracy, status
     FROM client_pl_weak_area
     WHERE org_id = ? AND wiswits_id = ? AND severity IN (${sevPlaceholders}) AND status IN (${statusPlaceholders})`;
  if (subject_id) { sql += ' AND subject_id = ?'; params.push(subject_id); }
  sql += ' ORDER BY accuracy ASC';

  return db.query(sql, params);
}

// ─── Preview (read-only) ────────────────────────────────────────
router.post('/assignments/preview-group', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { rule = {}, subject_id } = req.body;
  const matches = await matchWeakStudents(org_id, subject_id, rule);
  res.json({
    count: matches.length,
    students: matches.map((m) => ({
      id: m.student_id, name: nameFor(m.student_id), severity: m.severity, accuracy: Number(m.accuracy),
    })),
  });
});

// ─── Auto-group (creates) ───────────────────────────────────────
router.post('/assignments/auto-group', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { test_id, rule = {}, subject_id } = req.body;
  if (!test_id || !rule.weak_in) return res.status(400).json({ error: 'test_id_and_rule.weak_in_required' });

  const [test] = await db.query(`SELECT id FROM client_pl_test WHERE id=:id AND org_id=:org_id`, { id: test_id, org_id });
  if (!test) return res.status(404).json({ error: 'test_not_found' });

  const matches = await matchWeakStudents(org_id, subject_id, rule);
  const student_ids = matches.map((m) => m.student_id);

  const assignment_id = await createAssignment(org_id, req.ctx.user_id, {
    ...req.body, target_type: 'auto_group', target_json: { rule, matched: student_ids.length },
    auto_group_rule_json: rule,
  });
  await insertAssignmentStudents(org_id, assignment_id, student_ids);

  emit('pl.assigned', { org_id, assignment_id, test_id, target_type: 'auto_group', student_ids });

  res.status(201).json({
    id: assignment_id, test_id, target_type: 'auto_group',
    matched_count: student_ids.length, student_ids,
  });
});

// ─── Update mutable fields ───────────────────────────────────────
router.patch('/assignments/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const [existing] = await db.query(`SELECT id FROM client_pl_assignment WHERE id=:id AND org_id=:org_id`, { id, org_id });
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const allowed = ['opens_at', 'closes_at', 'attempts_allowed', 'time_limit_min',
    'shuffle_questions', 'shuffle_options', 'show_solution', 'show_score', 'mode'];
  const sets = [];
  const params = { id, org_id };
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sets.push(`${key} = :${key}`);
      params[key] = typeof req.body[key] === 'boolean' ? (req.body[key] ? 1 : 0) : req.body[key];
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'no_fields_to_update' });

  await db.query(
    `UPDATE client_pl_assignment SET ${sets.join(', ')} WHERE id = :id AND org_id = :org_id`,
    params
  );
  res.json({ ok: true, updated: Object.keys(params).filter((k) => k !== 'id' && k !== 'org_id') });
});

// ─── Close early ─────────────────────────────────────────────────
router.post('/assignments/:id/close', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const r = await db.query(
    `UPDATE client_pl_assignment SET status = 'closed' WHERE id = :id AND org_id = :org_id`,
    { id, org_id }
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true, status: 'closed' });
});

// ─── Extend deadline ──────────────────────────────────────────────
router.post('/assignments/:id/extend', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const { closes_at } = req.body;
  if (!closes_at) return res.status(400).json({ error: 'closes_at_required' });

  const [existing] = await db.query(
    `SELECT closes_at FROM client_pl_assignment WHERE id=:id AND org_id=:org_id`, { id, org_id });
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (existing.closes_at && new Date(closes_at) <= new Date(existing.closes_at)) {
    return res.status(400).json({ error: 'new_closes_at_must_be_later', current: existing.closes_at });
  }

  await db.query(
    `UPDATE client_pl_assignment SET closes_at = :closes_at WHERE id = :id AND org_id = :org_id`,
    { closes_at, id, org_id }
  );
  res.json({ ok: true, closes_at });
});

// ─── Delivery funnel status ────────────────────────────────────
router.get('/assignments/:id/status', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const [assignment] = await db.query(`SELECT id FROM client_pl_assignment WHERE id=:id AND org_id=:org_id`, { id, org_id });
  if (!assignment) return res.status(404).json({ error: 'not_found' });

  const rows = await db.query(
    `SELECT student_id, status FROM client_pl_assignment_student WHERE org_id=:org_id AND assignment_id=:id ORDER BY student_id`,
    { org_id, id }
  );
  const counts = { total: rows.length, assigned: 0, started: 0, submitted: 0, evaluated: 0, absent: 0, excused: 0 };
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;

  res.json({
    ...counts,
    students: rows.map((r) => ({ student_id: r.student_id, name: nameFor(r.student_id), status: r.status })),
  });
});

module.exports = router;
