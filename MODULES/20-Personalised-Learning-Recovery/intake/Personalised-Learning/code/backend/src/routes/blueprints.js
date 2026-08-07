'use strict';

/**
 * /api/pl/blueprints/* — reusable test structures (chapter weightage,
 * bloom distribution, difficulty mix) that testBuilder.js's
 * POST /tests/from-blueprint consumes to auto-generate a test.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { qbankApi } = require('../external');

function normalizeJson(v) {
  if (v == null) return null;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

async function loadBlueprint(org_id, id) {
  const [bp] = await db.query(
    `SELECT * FROM client_pl_blueprint WHERE id = :id AND org_id = :org_id AND deleted_at IS NULL`,
    { id, org_id }
  );
  return bp || null;
}

// ─── GET /blueprints — list ─────────────────────────────────────
router.get('/blueprints', requirePermission('teacher', 'principal', 'admin'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { subject, class: classNo } = req.query;
  const clauses = ['org_id = :org_id', 'deleted_at IS NULL'];
  const params = { org_id, limit: Number(req.query.limit || 100) };
  if (subject) { clauses.push('subject_id = :subject'); params.subject = Number(subject); }
  if (classNo) { clauses.push('class_no = :class_no'); params.class_no = Number(classNo); }

  const rows = await db.query(
    `SELECT id, name, subject_id, class_no, total_marks, total_questions, duration_min, is_locked,
            created_by, created_at, updated_at
     FROM client_pl_blueprint WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC LIMIT :limit`,
    params
  );
  res.json({ blueprints: rows });
});

// ─── GET /blueprints/:id ─────────────────────────────────────────
router.get('/blueprints/:id', requirePermission('teacher', 'principal', 'admin'), async (req, res) => {
  const bp = await loadBlueprint(req.ctx.org_id, Number(req.params.id));
  if (!bp) return res.status(404).json({ error: 'not_found' });
  res.json({ blueprint: bp });
});

// ─── POST /blueprints — create ───────────────────────────────────
router.post('/blueprints', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const {
    name, subject_id, class_no, chapter_weightage_json, bloom_distribution_json,
    difficulty_mix_json, type_mix_json, total_marks, total_questions, duration_min,
  } = req.body;
  if (!name || !subject_id || !class_no) return res.status(400).json({ error: 'name_subject_id_class_no_required' });

  const r = await db.query(
    `INSERT INTO client_pl_blueprint
       (org_id, name, subject_id, class_no, chapter_weightage_json, bloom_distribution_json,
        difficulty_mix_json, type_mix_json, total_marks, total_questions, duration_min, created_by)
     VALUES
       (:org_id, :name, :subject_id, :class_no, :chapter_weightage_json, :bloom_distribution_json,
        :difficulty_mix_json, :type_mix_json, :total_marks, :total_questions, :duration_min, :uid)`,
    {
      org_id, name, subject_id, class_no,
      chapter_weightage_json: JSON.stringify(chapter_weightage_json || {}),
      bloom_distribution_json: JSON.stringify(bloom_distribution_json || {}),
      difficulty_mix_json: JSON.stringify(difficulty_mix_json || {}),
      type_mix_json: JSON.stringify(type_mix_json || {}),
      total_marks: total_marks || 0, total_questions: total_questions || 0, duration_min: duration_min || 0,
      uid: req.ctx.user_id || 1,
    }
  );
  res.status(201).json({ id: r.insertId, name, status: 'created' });
});

// ─── PATCH /blueprints/:id ────────────────────────────────────────
router.patch('/blueprints/:id', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const bp = await loadBlueprint(org_id, id);
  if (!bp) return res.status(404).json({ error: 'not_found' });
  if (bp.is_locked && !req.body.force) return res.status(409).json({ error: 'blueprint_locked', hint: 'pass force:true to override' });

  const fields = {};
  const {
    name, subject_id, class_no, chapter_weightage_json, bloom_distribution_json,
    difficulty_mix_json, type_mix_json, total_marks, total_questions, duration_min, is_locked,
  } = req.body;
  if (name !== undefined) fields.name = name;
  if (subject_id !== undefined) fields.subject_id = subject_id;
  if (class_no !== undefined) fields.class_no = class_no;
  if (chapter_weightage_json !== undefined) fields.chapter_weightage_json = JSON.stringify(chapter_weightage_json);
  if (bloom_distribution_json !== undefined) fields.bloom_distribution_json = JSON.stringify(bloom_distribution_json);
  if (difficulty_mix_json !== undefined) fields.difficulty_mix_json = JSON.stringify(difficulty_mix_json);
  if (type_mix_json !== undefined) fields.type_mix_json = JSON.stringify(type_mix_json);
  if (total_marks !== undefined) fields.total_marks = total_marks;
  if (total_questions !== undefined) fields.total_questions = total_questions;
  if (duration_min !== undefined) fields.duration_min = duration_min;
  if (is_locked !== undefined) fields.is_locked = is_locked ? 1 : 0;

  const keys = Object.keys(fields);
  if (!keys.length) return res.json({ ok: true, unchanged: true });

  const setClause = keys.map((k) => `${k} = :${k}`).join(', ');
  await db.query(
    `UPDATE client_pl_blueprint SET ${setClause} WHERE id = :id AND org_id = :org_id`,
    { ...fields, id, org_id }
  );
  res.json({ ok: true, updated: keys });
});

// ─── shared: plan proportional per-chapter counts from a blueprint ─
function planChapterCounts(chapterWeights, totalQuestions) {
  const entries = Object.entries(chapterWeights || {});
  const weightSum = entries.reduce((a, [, w]) => a + Number(w), 0) || 1;
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
  return plan;
}

// ─── POST /blueprints/:id/simulate — dry-run, no test created ────
router.post('/blueprints/:id/simulate', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const bp = await loadBlueprint(org_id, id);
  if (!bp) return res.status(404).json({ error: 'not_found' });

  const chapterWeights = normalizeJson(bp.chapter_weightage_json) || {};
  const difficultyMix = normalizeJson(bp.difficulty_mix_json) || { medium: 1 };
  const totalQuestions = Number(bp.total_questions) || Object.keys(chapterWeights).length || 10;
  const plan = planChapterCounts(chapterWeights, totalQuestions);
  const diffKeys = Object.keys(difficultyMix);

  const results = [];
  for (const p of plan) {
    if (p.count <= 0) { results.push({ wiswits_id: p.wiswits_id, requested: 0, available: 0 }); continue; }
    let requested = 0, available = 0;
    for (const d of diffKeys) {
      const need = Math.round(Number(difficultyMix[d]) * p.count);
      if (need <= 0) continue;
      requested += need;
      const picked = await qbankApi.pick({ wiswits_id: p.wiswits_id, difficulty: d, count: need });
      available += picked.length;
    }
    results.push({ wiswits_id: p.wiswits_id, requested, available });
  }

  res.json({ blueprint_id: id, total_questions: totalQuestions, plan: results });
});

// ─── GET /blueprints/:id/coverage — capacity check ────────────────
router.get('/blueprints/:id/coverage', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const bp = await loadBlueprint(org_id, id);
  if (!bp) return res.status(404).json({ error: 'not_found' });

  const chapterWeights = normalizeJson(bp.chapter_weightage_json) || {};
  const totalQuestions = Number(bp.total_questions) || Object.keys(chapterWeights).length || 10;
  const plan = planChapterCounts(chapterWeights, totalQuestions);
  const LARGE_PROBE = 500; // "how many exist at all" probe count

  const coverage = [];
  for (const p of plan) {
    const picked = await qbankApi.pick({ wiswits_id: p.wiswits_id, difficulty: 'medium', count: LARGE_PROBE });
    coverage.push({
      chapter: p.wiswits_id, needed: p.count, available: picked.length, sufficient: picked.length >= p.count,
    });
  }

  res.json({ blueprint_id: id, coverage });
});

module.exports = router;
