'use strict';

/**
 * /api/pl/worksheets/* — ALGORITHM 5 service layer (spec Block E).
 *
 * "Ek worksheet jo sirf is bachche ke liye bani hai."
 *
 * The pure PLAN (strategy, targets, ladder, behaviour override) comes from
 * algorithms/worksheet.js. This file is the I/O shell: load weak areas +
 * profile from the DB, fetch questions from qbankApi, persist the worksheet.
 *
 * ⚠️ No PDF library is available in this repo. `pdf_path` is always stored/
 * returned as null — instead GET /:id/pdf returns fully structured content
 * (questions + solutions) so a frontend can render + print it itself.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const worksheetAlgo = require('../algorithms/worksheet');
const { qbankApi } = require('../external');

// ─── helpers ────────────────────────────────────────────────────
async function loadOpenWeakAreas(org_id, student_id) {
  return db.query(
    `SELECT * FROM client_pl_weak_area
     WHERE org_id=:org_id AND student_id=:student_id AND status IN ('open','in_recovery')
     ORDER BY FIELD(severity,'critical','weak','borderline','strong','mastered'), accuracy ASC`,
    { org_id, student_id }
  );
}

async function loadProfile(org_id, student_id, subject_id) {
  const [p] = await db.query(
    `SELECT * FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
    { org_id, student_id, subject_id }
  );
  return p || null;
}

function parseJson(v) {
  if (v == null) return v;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

/** Fetch questions for a plan's targets, ladder-ordered. */
async function fetchQuestionsForPlan(plan, exclude = []) {
  let questions = [];
  for (const target of plan.plan) {
    for (const [difficulty, count] of Object.entries(target.ladder)) {
      if (!count) continue;
      const picked = await qbankApi.pick({ wiswits_id: target.wiswits_id, difficulty, count, exclude });
      questions.push(...picked);
    }
  }
  return worksheetAlgo.orderByLadder(questions);
}

/** Internal: generate (or coach-instead) a worksheet for one student. NOT an HTTP call. */
async function generateForStudent(org_id, student_id, opts = {}, uid) {
  const subject_id = opts.subject_id || 9001;
  const weakAreas = await loadOpenWeakAreas(org_id, student_id);
  const profile = await loadProfile(org_id, student_id, subject_id);

  const plan = worksheetAlgo.planWorksheet(weakAreas, profile, opts);
  if (!plan) return { skip_worksheet: true, reason: 'no_open_weak_areas', student_id };
  if (plan.skip_worksheet) return { ...plan, student_id };

  const questions = await fetchQuestionsForPlan(plan);
  const ladder = worksheetAlgo.countByDifficulty(questions);
  const total_questions = questions.length;
  const est_time_min = Math.round(questions.reduce((a, q) => a + (q.est_time_sec || 0), 0) / 60);

  const r = await db.query(
    `INSERT INTO client_pl_worksheet
       (org_id, student_id, target_wiswits_ids_json, strategy, question_ids_json,
        difficulty_ladder_json, total_questions, est_time_min, generated_by, generation_reason, status)
     VALUES (:org_id, :student_id, :targets, :strategy, :questions,
        :ladder, :total, :est, :uid, :reason, 'generated')`,
    {
      org_id, student_id,
      targets: JSON.stringify(plan.targets),
      strategy: plan.strategy,
      questions: JSON.stringify(questions),
      ladder: JSON.stringify(ladder),
      total: total_questions,
      est: est_time_min,
      uid: uid || null,
      reason: plan.generation_reason,
    }
  );
  const id = r.insertId;

  emit('pl.worksheet_generated', {
    org_id, student_id, worksheet_id: id, strategy: plan.strategy,
    targets: plan.targets, total_questions,
  });

  return {
    id, student_id,
    target_wiswits_ids: plan.targets,
    strategy: plan.strategy,
    questions,
    difficulty_ladder: ladder,
    total_questions,
    est_time_min,
    generation_reason: plan.generation_reason,
    status: 'generated',
  };
}

async function loadWorksheet(org_id, id) {
  const [w] = await db.query(`SELECT * FROM client_pl_worksheet WHERE id=:id AND org_id=:org_id`, { id, org_id });
  return w || null;
}

function shapeWorksheet(w) {
  return {
    ...w,
    target_wiswits_ids: parseJson(w.target_wiswits_ids_json),
    questions: parseJson(w.question_ids_json) || [],
    difficulty_ladder: parseJson(w.difficulty_ladder_json) || {},
  };
}

// ─── POST /worksheets/generate ─────────────────────────────────
router.post('/worksheets/generate', requirePermission('teacher', 'principal'), async (req, res) => {
  const { student_id, opts = {} } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });
  const result = await generateForStudent(req.ctx.org_id, Number(student_id), opts, req.ctx.user_id);
  res.status(result.skip_worksheet ? 200 : 201).json(result);
});

// ─── POST /worksheets/generate-bulk ────────────────────────────
router.post('/worksheets/generate-bulk', requirePermission('teacher', 'principal'), async (req, res) => {
  const { student_ids = [], opts = {} } = req.body;
  const org_id = req.ctx.org_id;
  const worksheets = [];
  let generated = 0;
  let skipped_coaching = 0;

  for (const sid of student_ids) {
    const result = await generateForStudent(org_id, Number(sid), opts, req.ctx.user_id);
    worksheets.push(result);
    if (result.skip_worksheet) skipped_coaching++;
    else generated++;
  }

  res.status(201).json({ generated, skipped_coaching, worksheets });
});

// ─── POST /worksheets/generate-class ───────────────────────────
// "24 students chose option B, common misconception" → bulk-generate for
// every student with an OPEN weak area on that wiswits_id.
router.post('/worksheets/generate-class', requirePermission('teacher', 'principal'), async (req, res) => {
  const { test_id, wiswits_id, opts = {} } = req.body;
  if (!wiswits_id) return res.status(400).json({ error: 'wiswits_id_required' });
  const org_id = req.ctx.org_id;

  const rows = await db.query(
    `SELECT DISTINCT student_id FROM client_pl_weak_area
     WHERE org_id=:org_id AND wiswits_id=:wiswits_id AND status='open'`,
    { org_id, wiswits_id }
  );
  const student_ids = rows.map((r) => r.student_id);

  const worksheets = [];
  let generated = 0;
  let skipped_coaching = 0;
  for (const sid of student_ids) {
    const result = await generateForStudent(org_id, sid, opts, req.ctx.user_id);
    worksheets.push(result);
    if (result.skip_worksheet) skipped_coaching++;
    else generated++;
  }

  res.status(201).json({ test_id: test_id || null, wiswits_id, matched: student_ids.length, generated, skipped_coaching, worksheets });
});

// ─── GET /worksheets ────────────────────────────────────────────
router.get('/worksheets', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student, status } = req.query;
  const clauses = ['org_id = :org_id'];
  const params = { org_id, limit: Number(req.query.limit || 100) };
  if (student) { clauses.push('student_id = :student'); params.student = Number(student); }
  if (status) { clauses.push('status = :status'); params.status = status; }

  const rows = await db.query(
    `SELECT id, student_id, target_wiswits_ids_json, strategy, total_questions, est_time_min,
            status, generated_at, assigned_at, attempted_at, score
     FROM client_pl_worksheet WHERE ${clauses.join(' AND ')} ORDER BY generated_at DESC LIMIT :limit`,
    params
  );
  res.json({ worksheets: rows.map((r) => ({ ...r, target_wiswits_ids: parseJson(r.target_wiswits_ids_json) })) });
});

// ─── GET /worksheets/:id ────────────────────────────────────────
router.get('/worksheets/:id', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const w = await loadWorksheet(req.ctx.org_id, Number(req.params.id));
  if (!w) return res.status(404).json({ error: 'not_found' });
  res.json(shapeWorksheet(w));
});

// ─── PATCH /worksheets/:id — teacher edits before assign ───────
router.patch('/worksheets/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const w = await loadWorksheet(org_id, id);
  if (!w) return res.status(404).json({ error: 'not_found' });

  const { question_ids_json, total_questions, difficulty_ladder_json, est_time_min } = req.body;
  const fields = { status: 'edited' };
  if (question_ids_json !== undefined) fields.question_ids_json = JSON.stringify(question_ids_json);
  if (difficulty_ladder_json !== undefined) fields.difficulty_ladder_json = JSON.stringify(difficulty_ladder_json);
  if (total_questions !== undefined) fields.total_questions = total_questions;
  else if (question_ids_json !== undefined) fields.total_questions = question_ids_json.length;
  if (est_time_min !== undefined) fields.est_time_min = est_time_min;

  const sets = Object.keys(fields).map((k) => `${k} = :${k}`).join(', ');
  await db.query(`UPDATE client_pl_worksheet SET ${sets} WHERE id=:id AND org_id=:org_id`, { ...fields, id, org_id });

  const updated = await loadWorksheet(org_id, id);
  res.json(shapeWorksheet(updated));
});

// ─── POST /worksheets/:id/regenerate ───────────────────────────
// Same targets/strategy, different questions (exclude the old ones).
router.post('/worksheets/:id/regenerate', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const w = await loadWorksheet(org_id, id);
  if (!w) return res.status(404).json({ error: 'not_found' });

  const targetIds = parseJson(w.target_wiswits_ids_json) || [];
  const oldQuestions = parseJson(w.question_ids_json) || [];
  const excludeIds = oldQuestions.map((q) => q.id);

  // Re-derive per-target severity from current weak areas (falls back to 'weak').
  // ⚠️ all-positional (?) here — never mix with :named placeholders in one query.
  const currentWeak = targetIds.length
    ? await db.query(
        `SELECT wiswits_id, severity, is_root_cause, root_wiswits_id, dominant_bloom_gap
         FROM client_pl_weak_area WHERE org_id = ? AND student_id = ? AND wiswits_id IN (${targetIds.map(() => '?').join(',')})`,
        [org_id, w.student_id, ...targetIds]
      )
    : [];
  const byId = Object.fromEntries(currentWeak.map((r) => [r.wiswits_id, r]));

  const plan = {
    strategy: w.strategy,
    targets: targetIds,
    plan: targetIds.map((wid) => {
      const wa = byId[wid] || { wiswits_id: wid, severity: 'weak' };
      return {
        wiswits_id: wid,
        root_wiswits_id: wa.root_wiswits_id || wid,
        severity: wa.severity,
        dominant_bloom_gap: wa.dominant_bloom_gap || null,
        ladder: worksheetAlgo.ladderFor(wa, w.strategy),
      };
    }),
    generation_reason: w.generation_reason,
  };

  const questions = await fetchQuestionsForPlan(plan, excludeIds);
  const ladder = worksheetAlgo.countByDifficulty(questions);
  const total_questions = questions.length;
  const est_time_min = Math.round(questions.reduce((a, q) => a + (q.est_time_sec || 0), 0) / 60);

  await db.query(
    `UPDATE client_pl_worksheet SET
       question_ids_json=:questions, difficulty_ladder_json=:ladder, total_questions=:total,
       est_time_min=:est, status='generated', assigned_at=NULL, attempted_at=NULL, score=NULL
     WHERE id=:id AND org_id=:org_id`,
    { questions: JSON.stringify(questions), ladder: JSON.stringify(ladder), total: total_questions, est: est_time_min, id, org_id }
  );

  const updated = await loadWorksheet(org_id, id);
  res.json(shapeWorksheet(updated));
});

// ─── GET /worksheets/:id/pdf — NOT a real PDF (no pdf lib in this repo) ─
// Returns fully structured content so a frontend can render + print it.
// `pdf_path` stays null on purpose — see file header comment.
router.get('/worksheets/:id/pdf', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const w = await loadWorksheet(req.ctx.org_id, Number(req.params.id));
  if (!w) return res.status(404).json({ error: 'not_found' });
  const withSolutions = String(req.query.solutions || 'false') === 'true';
  const questions = parseJson(w.question_ids_json) || [];

  res.json({
    content: {
      worksheet_id: w.id,
      student_id: w.student_id,
      strategy: w.strategy,
      target_wiswits_ids: parseJson(w.target_wiswits_ids_json),
      total_questions: w.total_questions,
      est_time_min: w.est_time_min,
      generation_reason: w.generation_reason,
      questions: questions.map((q) => ({
        id: q.id,
        wiswits_id: q.wiswits_id,
        difficulty: q.difficulty,
        bloom: q.bloom,
        marks: q.marks,
        stem: q.stem,
        ...(withSolutions ? { solution: q.solution || null, has_solution: !!q.has_solution } : {}),
      })),
    },
    pdf_path: null, // no PDF library available — render `content` client-side instead
  });
});

// ─── POST /worksheets/:id/assign ───────────────────────────────
router.post('/worksheets/:id/assign', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const w = await loadWorksheet(org_id, id);
  if (!w) return res.status(404).json({ error: 'not_found' });

  await db.query(`UPDATE client_pl_worksheet SET assigned_at=NOW(), status='assigned' WHERE id=:id AND org_id=:org_id`, { id, org_id });
  emit('pl.assigned', { org_id, student_id: w.student_id, worksheet_id: id });

  const updated = await loadWorksheet(org_id, id);
  res.json(shapeWorksheet(updated));
});

// ─── POST /worksheets/:id/attempt — simple recorded score ─────
router.post('/worksheets/:id/attempt', requirePermission('teacher', 'student'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const { score } = req.body;
  const w = await loadWorksheet(org_id, id);
  if (!w) return res.status(404).json({ error: 'not_found' });

  await db.query(
    `UPDATE client_pl_worksheet SET attempted_at=NOW(), score=:score, status='attempted' WHERE id=:id AND org_id=:org_id`,
    { score, id, org_id }
  );

  // Link back to an in-progress recovery cycle on a matching target, if any.
  // ⚠️ all-positional (?) here — never mix with :named placeholders in one query.
  const targetIds = parseJson(w.target_wiswits_ids_json) || [];
  if (targetIds.length) {
    await db.query(
      `UPDATE client_pl_recovery_cycle
         SET worksheet_id = ?, worksheet_score = ?, worksheet_attempted_at = NOW()
       WHERE org_id = ? AND student_id = ? AND wiswits_id IN (${targetIds.map(() => '?').join(',')})
         AND outcome IS NULL
       ORDER BY detected_at DESC LIMIT 1`,
      [id, score, org_id, w.student_id, ...targetIds]
    );
  }

  const updated = await loadWorksheet(org_id, id);
  res.json(shapeWorksheet(updated));
});

module.exports = router;
module.exports.generateForStudent = generateForStudent;
