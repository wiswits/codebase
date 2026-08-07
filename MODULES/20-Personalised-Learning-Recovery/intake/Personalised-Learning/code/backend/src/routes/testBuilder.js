'use strict';

/**
 * /api/pl/tests/* — Test Builder API surface (spec Part 8 general builder).
 *
 * Complements offlineTests.js (paper/offline flow) and attempts.js (online
 * attempt engine). This file owns test *authoring*: create, populate from
 * QBank/blueprint/manual entry, edit, clone, publish, preview/print, validate.
 *
 * ⚠️ question_snapshot_json is ALWAYS frozen at question-add time (Rule 1) —
 * later QBank edits never retroactively change a test students may have seen.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const { qbankApi } = require('../external');

// ─── helpers ────────────────────────────────────────────────────

function snapshotFromQbankQuestion(q) {
  return {
    stem: q.stem,
    options: q.options || [],
    correct: q.correct || null,
    solution: q.solution || null,
    wiswits_id: q.wiswits_id,
  };
}

async function loadTest(org_id, test_id) {
  const [t] = await db.query(
    `SELECT * FROM client_pl_test WHERE id = :id AND org_id = :org_id AND deleted_at IS NULL`,
    { id: test_id, org_id }
  );
  return t || null;
}

async function loadTestQuestions(org_id, test_id) {
  return db.query(
    `SELECT id, seq, question_id, wiswits_id, bloom, difficulty, est_time_sec, marks, negative_marks,
            question_snapshot_json, section_name, is_optional
     FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id ORDER BY seq`,
    { org_id, test_id }
  );
}

function parseSnap(tq) {
  return typeof tq.question_snapshot_json === 'string' ? JSON.parse(tq.question_snapshot_json) : tq.question_snapshot_json;
}

async function insertTestShell(org_id, uid, { title, subject_id, class_no, stream, type, mode, source, blueprint_id, status }) {
  const r = await db.query(
    `INSERT INTO client_pl_test
       (org_id, title, subject_id, class_no, stream, type, source, mode, blueprint_id, status, created_by)
     VALUES
       (:org_id, :title, :subject_id, :class_no, :stream, :type, :source, :mode, :blueprint_id, :status, :uid)`,
    {
      org_id, title, subject_id, class_no: class_no || 10, stream: stream || 'none',
      type: type || 'unit', source, mode: mode || 'online', blueprint_id: blueprint_id || null,
      status: status || 'draft', uid: uid || 1,
    }
  );
  return r.insertId;
}

async function insertQuestionRows(org_id, test_id, questions) {
  // questions: [{ seq, question_id, wiswits_id, bloom, difficulty, est_time_sec, marks, negative_marks, snapshot }]
  if (!questions.length) return;
  const rows = questions.map((q) => [
    org_id, test_id, q.seq, q.question_id || null, q.wiswits_id, q.bloom || null, q.difficulty || null,
    q.est_time_sec || null, q.marks != null ? q.marks : 2, q.negative_marks || 0, JSON.stringify(q.snapshot),
  ]);
  await db.query(
    `INSERT INTO client_pl_test_question
       (org_id, test_id, seq, question_id, wiswits_id, bloom, difficulty, est_time_sec, marks, negative_marks, question_snapshot_json)
     VALUES ${rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
    rows.flat()
  );
}

async function recomputeTotals(org_id, test_id) {
  const [agg] = await db.query(
    `SELECT COUNT(*) AS cnt, COALESCE(SUM(marks),0) AS marks
     FROM client_pl_test_question WHERE org_id = :org_id AND test_id = :test_id`,
    { org_id, test_id }
  );
  await db.query(
    `UPDATE client_pl_test SET total_questions = :cnt, total_marks = :marks WHERE id = :id AND org_id = :org_id`,
    { cnt: agg.cnt, marks: agg.marks, id: test_id, org_id }
  );
  return { total_questions: Number(agg.cnt), total_marks: Number(agg.marks) };
}

// ─── GET /tests — list ─────────────────────────────────────────
router.get('/tests', requirePermission('teacher', 'principal', 'admin'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { subject, class: classNo, status, type, mine } = req.query;
  const clauses = ['org_id = :org_id', 'deleted_at IS NULL'];
  const params = { org_id, limit: Number(req.query.limit || 100) };
  if (subject) { clauses.push('subject_id = :subject'); params.subject = Number(subject); }
  if (classNo) { clauses.push('class_no = :class_no'); params.class_no = Number(classNo); }
  if (status) { clauses.push('status = :status'); params.status = status; }
  if (type) { clauses.push('type = :type'); params.type = type; }
  if (mine === '1' || mine === 'true') { clauses.push('created_by = :uid'); params.uid = req.ctx.user_id || 0; }

  const rows = await db.query(
    `SELECT id, title, subject_id, class_no, stream, type, source, mode, status, total_marks,
            total_questions, duration_min, blueprint_id, created_by, created_at, updated_at
     FROM client_pl_test WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC LIMIT :limit`,
    params
  );
  res.json({ tests: rows });
});

// ─── POST /tests — draft shell ─────────────────────────────────
router.post('/tests', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { title, subject_id, class_no, stream, type, mode } = req.body;
  if (!title || !subject_id) return res.status(400).json({ error: 'title_and_subject_id_required' });

  const test_id = await insertTestShell(org_id, req.ctx.user_id, {
    title, subject_id, class_no, stream, type, mode, source: 'manual', status: 'draft',
  });
  emit('pl.test_created', { org_id, test_id, source: 'manual', mode: mode || 'online', class_no: class_no || 10, subject_id });
  res.status(201).json({ id: test_id, title, status: 'draft' });
});

// ─── POST /tests/from-qbank ─────────────────────────────────────
router.post('/tests/from-qbank', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { title, subject_id, class_no, filters = {}, count } = req.body;
  if (!title || !subject_id) return res.status(400).json({ error: 'title_and_subject_id_required' });

  const wiswitsIds = filters.wiswits_ids || [];
  if (!wiswitsIds.length) return res.status(400).json({ error: 'filters.wiswits_ids_required' });
  const difficulty = filters.difficulty || 'medium';
  const perTopic = Math.max(1, Math.round((count || wiswitsIds.length) / wiswitsIds.length));

  const test_id = await insertTestShell(org_id, req.ctx.user_id, {
    title, subject_id, class_no, type: 'unit', mode: 'online', source: 'qbank', status: 'draft',
  });

  let seq = 1;
  const toInsert = [];
  for (const wiswits_id of wiswitsIds) {
    const picked = await qbankApi.pick({ wiswits_id, difficulty, count: perTopic });
    for (const q of picked) {
      toInsert.push({
        seq: seq++, question_id: q.question_id || q.id, wiswits_id: q.wiswits_id,
        bloom: filters.bloom || q.bloom, difficulty: q.difficulty, est_time_sec: q.est_time_sec,
        marks: q.marks || 2, snapshot: snapshotFromQbankQuestion(q),
      });
    }
  }
  await insertQuestionRows(org_id, test_id, toInsert);
  const totals = await recomputeTotals(org_id, test_id);

  emit('pl.test_created', { org_id, test_id, source: 'qbank', mode: 'online', class_no: class_no || 10, subject_id });
  res.status(201).json({ id: test_id, title, status: 'draft', question_count: toInsert.length, ...totals });
});

// ─── POST /tests/from-blueprint ─────────────────────────────────
router.post('/tests/from-blueprint', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { blueprint_id } = req.body;
  if (!blueprint_id) return res.status(400).json({ error: 'blueprint_id_required' });

  const [bp] = await db.query(
    `SELECT * FROM client_pl_blueprint WHERE id = :id AND org_id = :org_id AND deleted_at IS NULL`,
    { id: blueprint_id, org_id }
  );
  if (!bp) return res.status(404).json({ error: 'blueprint_not_found' });

  const chapterWeights = normalizeJson(bp.chapter_weightage_json) || {}; // { wiswits_id: weight (0-1 or %) }
  const difficultyMix = normalizeJson(bp.difficulty_mix_json) || { easy: 0.3, medium: 0.5, hard: 0.2 };
  const totalQuestions = Number(bp.total_questions) || Object.keys(chapterWeights).length || 10;

  const entries = Object.entries(chapterWeights);
  const weightSum = entries.reduce((a, [, w]) => a + Number(w), 0) || 1;

  // proportional rounding, then top-up/trim to hit totalQuestions exactly
  const plan = entries.map(([wiswits_id, w]) => ({
    wiswits_id, count: Math.max(0, Math.round((Number(w) / weightSum) * totalQuestions)),
  }));
  let planned = plan.reduce((a, p) => a + p.count, 0);
  let idx = 0;
  while (planned < totalQuestions && plan.length) { plan[idx % plan.length].count++; planned++; idx++; }
  idx = 0;
  while (planned > totalQuestions && plan.some((p) => p.count > 0)) {
    if (plan[idx % plan.length].count > 0) { plan[idx % plan.length].count--; planned--; }
    idx++;
  }

  const test_id = await insertTestShell(org_id, req.ctx.user_id, {
    title: bp.name, subject_id: bp.subject_id, class_no: bp.class_no, type: 'unit',
    mode: 'online', source: 'blueprint', blueprint_id: bp.id, status: 'draft',
  });

  const diffKeys = Object.keys(difficultyMix);
  let seq = 1;
  const toInsert = [];
  const shortages = [];
  for (const p of plan) {
    if (p.count <= 0) continue;
    // split this chapter's count across the blueprint's difficulty mix proportionally
    const diffCounts = diffKeys.map((d) => Math.round(Number(difficultyMix[d]) * p.count));
    let sum = diffCounts.reduce((a, b) => a + b, 0);
    let di = 0;
    while (sum < p.count && diffKeys.length) { diffCounts[di % diffKeys.length]++; sum++; di++; }
    while (sum > p.count && diffCounts.some((c) => c > 0)) {
      if (diffCounts[di % diffKeys.length] > 0) { diffCounts[di % diffKeys.length]--; sum--; }
      di++;
    }

    for (let k = 0; k < diffKeys.length; k++) {
      const need = diffCounts[k];
      if (need <= 0) continue;
      const picked = await qbankApi.pick({ wiswits_id: p.wiswits_id, difficulty: diffKeys[k], count: need });
      if (picked.length < need) {
        shortages.push({ wiswits_id: p.wiswits_id, difficulty: diffKeys[k], needed: need, got: picked.length });
      }
      for (const q of picked) {
        toInsert.push({
          seq: seq++, question_id: q.question_id || q.id, wiswits_id: q.wiswits_id,
          bloom: q.bloom, difficulty: q.difficulty, est_time_sec: q.est_time_sec,
          marks: q.marks || 2, snapshot: snapshotFromQbankQuestion(q),
        });
      }
    }
  }

  // top-up cheapest available (medium difficulty, first chapter) if we fell short overall
  let shortBy = totalQuestions - toInsert.length;
  if (shortBy > 0 && entries.length) {
    const fallbackChapter = entries[0][0];
    const topUp = await qbankApi.pick({ wiswits_id: fallbackChapter, difficulty: 'medium', count: shortBy });
    for (const q of topUp) {
      toInsert.push({
        seq: seq++, question_id: q.question_id || q.id, wiswits_id: q.wiswits_id,
        bloom: q.bloom, difficulty: q.difficulty, est_time_sec: q.est_time_sec,
        marks: q.marks || 2, snapshot: snapshotFromQbankQuestion(q),
      });
    }
  }

  await insertQuestionRows(org_id, test_id, toInsert);
  const totals = await recomputeTotals(org_id, test_id);
  await db.query(
    `UPDATE client_pl_test SET duration_min = :dur WHERE id = :id AND org_id = :org_id`,
    { dur: bp.duration_min || 0, id: test_id, org_id }
  );

  if (shortages.length) emit('pl.qbank_shortage', { org_id, test_id, blueprint_id: bp.id, shortages });
  emit('pl.test_created', { org_id, test_id, source: 'blueprint', mode: 'online', class_no: bp.class_no, subject_id: bp.subject_id });

  res.status(201).json({
    id: test_id, title: bp.name, status: 'draft', question_count: toInsert.length,
    ...totals, plan, shortages,
  });
});

// ─── POST /tests/manual — teacher-typed questions ──────────────
router.post('/tests/manual', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { title, subject_id, class_no, mode, questions = [] } = req.body;
  if (!title || !subject_id) return res.status(400).json({ error: 'title_and_subject_id_required' });
  if (!questions.length) return res.status(400).json({ error: 'questions_required' });

  const test_id = await insertTestShell(org_id, req.ctx.user_id, {
    title, subject_id, class_no, type: 'unit', mode: mode || 'online', source: 'manual', status: 'draft',
  });

  const toInsert = questions.map((q, i) => ({
    seq: i + 1, question_id: null, wiswits_id: q.wiswits_id, bloom: q.bloom, difficulty: q.difficulty,
    est_time_sec: q.est_time_sec || { easy: 60, medium: 90, hard: 150 }[q.difficulty] || 90,
    marks: q.marks != null ? q.marks : 2,
    snapshot: { stem: q.stem, options: q.options || [], correct: q.correct || null, solution: q.solution || null, wiswits_id: q.wiswits_id },
  }));
  await insertQuestionRows(org_id, test_id, toInsert);
  const totals = await recomputeTotals(org_id, test_id);

  emit('pl.test_created', { org_id, test_id, source: 'manual', mode: mode || 'online', class_no: class_no || 10, subject_id });
  res.status(201).json({ id: test_id, title, status: 'draft', question_count: toInsert.length, ...totals });
});

// ─── POST /tests/:id/questions — add/remove/reorder ────────────
router.post('/tests/:id/questions', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  if (!['draft', 'ready'].includes(test.status)) return res.status(409).json({ error: 'test_locked', status: test.status });

  const { add = [], remove = [], reorder = [] } = req.body;

  if (remove.length) {
    await db.query(
      `DELETE FROM client_pl_test_question WHERE org_id = ? AND test_id = ? AND id IN (${remove.map(() => '?').join(',')})`,
      [org_id, test_id, ...remove]
    );
  }

  if (add.length) {
    const existing = await db.query(
      `SELECT COALESCE(MAX(seq),0) AS max_seq FROM client_pl_test_question WHERE org_id=:org_id AND test_id=:test_id`,
      { org_id, test_id }
    );
    let seq = Number(existing[0].max_seq) + 1;
    const toInsert = add.map((q) => ({
      seq: seq++, question_id: q.question_id || null, wiswits_id: q.wiswits_id, bloom: q.bloom, difficulty: q.difficulty,
      est_time_sec: q.est_time_sec || 90, marks: q.marks != null ? q.marks : 2,
      snapshot: q.snapshot || { stem: q.stem, options: q.options || [], correct: q.correct || null, solution: q.solution || null, wiswits_id: q.wiswits_id },
    }));
    await insertQuestionRows(org_id, test_id, toInsert);
  }

  for (const r of reorder) {
    await db.query(
      `UPDATE client_pl_test_question SET seq = :seq WHERE id = :id AND org_id = :org_id AND test_id = :test_id`,
      { seq: r.seq, id: r.id, org_id, test_id }
    );
  }

  const totals = await recomputeTotals(org_id, test_id);
  res.json({ ok: true, ...totals });
});

// ─── PATCH /tests/:id ───────────────────────────────────────────
router.patch('/tests/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });

  const fields = {};
  const { title, description, instructions_json, duration_min, class_no, stream, type, mode, status,
    negative_marking, negative_ratio } = req.body;

  const isStatusOnlyChange = status && Object.keys(req.body).every((k) => ['status'].includes(k));
  if (!['draft', 'ready'].includes(test.status) && !isStatusOnlyChange) {
    return res.status(409).json({ error: 'test_locked', status: test.status });
  }

  if (title !== undefined) fields.title = title;
  if (description !== undefined) fields.description = description;
  if (instructions_json !== undefined) fields.instructions_json = JSON.stringify(instructions_json);
  if (duration_min !== undefined) fields.duration_min = duration_min;
  if (class_no !== undefined) fields.class_no = class_no;
  if (stream !== undefined) fields.stream = stream;
  if (type !== undefined) fields.type = type;
  if (mode !== undefined) fields.mode = mode;
  if (negative_marking !== undefined) fields.negative_marking = negative_marking ? 1 : 0;
  if (negative_ratio !== undefined) fields.negative_ratio = negative_ratio;
  if (status !== undefined) fields.status = status;

  const keys = Object.keys(fields);
  if (!keys.length) return res.json({ ok: true, unchanged: true });

  const setClause = keys.map((k) => `${k} = :${k}`).join(', ');
  await db.query(
    `UPDATE client_pl_test SET ${setClause} WHERE id = :id AND org_id = :org_id`,
    { ...fields, id: test_id, org_id }
  );
  res.json({ ok: true, updated: keys });
});

// ─── POST /tests/:id/clone ──────────────────────────────────────
router.post('/tests/:id/clone', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });

  const newId = await insertTestShell(org_id, req.ctx.user_id, {
    title: `${test.title} (copy)`, subject_id: test.subject_id, class_no: test.class_no, stream: test.stream,
    type: test.type, mode: test.mode, source: test.source, blueprint_id: test.blueprint_id, status: 'draft',
  });

  const tqs = await loadTestQuestions(org_id, test_id);
  const toInsert = tqs.map((tq) => ({
    seq: tq.seq, question_id: tq.question_id, wiswits_id: tq.wiswits_id, bloom: tq.bloom, difficulty: tq.difficulty,
    est_time_sec: tq.est_time_sec, marks: Number(tq.marks), negative_marks: Number(tq.negative_marks),
    snapshot: parseSnap(tq),
  }));
  await insertQuestionRows(org_id, newId, toInsert);
  const totals = await recomputeTotals(org_id, newId);

  emit('pl.test_created', { org_id, test_id: newId, source: test.source, mode: test.mode, class_no: test.class_no, subject_id: test.subject_id });
  res.status(201).json({ id: newId, title: `${test.title} (copy)`, status: 'draft', question_count: toInsert.length, ...totals });
});

// ─── POST /tests/:id/publish ─────────────────────────────────────
router.post('/tests/:id/publish', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  if (!['draft', 'ready'].includes(test.status)) return res.status(400).json({ error: 'invalid_status', status: test.status });

  const tqs = await loadTestQuestions(org_id, test_id);
  if (!tqs.length) return res.status(400).json({ error: 'no_questions' });

  await db.query(`UPDATE client_pl_test SET status = 'published' WHERE id = :id AND org_id = :org_id`, { id: test_id, org_id });
  emit('pl.test_published', { org_id, test_id, question_count: tqs.length });
  res.json({ ok: true, id: test_id, status: 'published', question_count: tqs.length });
});

// ─── DELETE /tests/:id — soft delete ────────────────────────────
router.delete('/tests/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  await db.query(`UPDATE client_pl_test SET deleted_at = NOW() WHERE id = :id AND org_id = :org_id`, { id: test_id, org_id });
  res.json({ ok: true, id: test_id, deleted: true });
});

// ─── GET /tests/:id/preview — full snapshot (teacher view) ──────
router.get('/tests/:id/preview', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  const tqs = await loadTestQuestions(org_id, test_id);
  res.json({
    test,
    questions: tqs.map((tq) => ({
      test_question_id: tq.id, seq: tq.seq, wiswits_id: tq.wiswits_id, bloom: tq.bloom, difficulty: tq.difficulty,
      marks: Number(tq.marks), est_time_sec: tq.est_time_sec, section_name: tq.section_name, is_optional: !!tq.is_optional,
      ...parseSnap(tq), // stem, options, correct, solution — full, unstripped (teacher preview)
    })),
  });
});

// ─── GET /tests/:id/print — print-friendly payload ───────────────
router.get('/tests/:id/print', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  const tqs = await loadTestQuestions(org_id, test_id);
  const includeAnswers = req.query.answers === 'true' || req.query.answers === '1';

  const questions = tqs.map((tq) => {
    const snap = parseSnap(tq);
    const lettered = (snap.options || []).map((o, i) => ({ letter: String.fromCharCode(65 + i), text: o.text }));
    const q = {
      seq: tq.seq, wiswits_id: tq.wiswits_id, marks: Number(tq.marks), stem: snap.stem, options: lettered,
    };
    if (includeAnswers) {
      q.correct = snap.correct;
      q.solution = snap.solution || null;
    }
    return q;
  });

  res.json({
    test: {
      id: test.id, title: test.title, subject_id: test.subject_id, class_no: test.class_no,
      duration_min: test.duration_min, total_marks: test.total_marks, total_questions: test.total_questions,
      instructions_json: test.instructions_json,
    },
    includes_answer_key: includeAnswers,
    questions,
  });
});

// ─── GET /tests/:id/validate — vs blueprint (or basic sanity) ───
router.get('/tests/:id/validate', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const test_id = Number(req.params.id);
  const test = await loadTest(org_id, test_id);
  if (!test) return res.status(404).json({ error: 'not_found' });
  const tqs = await loadTestQuestions(org_id, test_id);

  if (!test.blueprint_id) {
    const gaps = [];
    if (!tqs.length) gaps.push('no_questions');
    if (tqs.some((q) => !(Number(q.marks) > 0))) gaps.push('question_with_zero_marks');
    if (tqs.some((q) => !q.wiswits_id)) gaps.push('question_missing_wiswits_id');
    return res.json({ has_blueprint: false, question_count: tqs.length, gaps, sane: gaps.length === 0 });
  }

  const [bp] = await db.query(
    `SELECT bloom_distribution_json, difficulty_mix_json FROM client_pl_blueprint WHERE id = :id AND org_id = :org_id`,
    { id: test.blueprint_id, org_id }
  );
  if (!bp) return res.json({ has_blueprint: true, matches_blueprint: false, gaps: ['blueprint_not_found'] });

  const target = {
    bloom: normalizeJson(bp.bloom_distribution_json) || {},
    difficulty: normalizeJson(bp.difficulty_mix_json) || {},
  };
  const total = tqs.length || 1;
  const actual = { bloom: {}, difficulty: {} };
  for (const tq of tqs) {
    if (tq.bloom) actual.bloom[tq.bloom] = (actual.bloom[tq.bloom] || 0) + 1;
    if (tq.difficulty) actual.difficulty[tq.difficulty] = (actual.difficulty[tq.difficulty] || 0) + 1;
  }
  for (const k of Object.keys(actual.bloom)) actual.bloom[k] = Number((actual.bloom[k] / total).toFixed(3));
  for (const k of Object.keys(actual.difficulty)) actual.difficulty[k] = Number((actual.difficulty[k] / total).toFixed(3));

  const gaps = [];
  const TOLERANCE = 0.1;
  for (const [dim, targetDist] of [['bloom', target.bloom], ['difficulty', target.difficulty]]) {
    for (const [key, targetVal] of Object.entries(targetDist)) {
      const actualVal = actual[dim][key] || 0;
      if (Math.abs(actualVal - Number(targetVal)) > TOLERANCE) {
        gaps.push({ dimension: dim, key, target: Number(targetVal), actual: actualVal });
      }
    }
  }

  res.json({
    has_blueprint: true, matches_blueprint: gaps.length === 0, question_count: tqs.length,
    actual, target, gaps,
  });
});

function normalizeJson(v) {
  if (v == null) return null;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

module.exports = router;
