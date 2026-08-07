const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');

/*
 * ⚠️ SUPERSEDED 2026-08-02 by the `cie` module (/api/cie) — ADR-013.
 *
 * Every route in this file reads `platform_curriculum`, a table migration 016
 * describes and which HAS NEVER EXISTED on any database — verified against
 * production and dev via information_schema. So every handler below currently
 * returns a 500 on a missing table; nothing is being broken by replacing it.
 *
 * It stays mounted, unchanged, until its routes have no callers left:
 * mark → migrate → remove (CLAUDE.md §15), and "looks dead" is a hypothesis
 * until every usage has been traced. Do not add to it — new curriculum work
 * belongs in src/modules/cie/.
 *
 * platform_curriculum — the spine (APEX Modules Unification, Phase 1 / Task 1).
 * Global, no org_id (same documented exception as platform_content). Org #1
 * (WisWits HQ) is the only writer; every school reads. wiswits_id is the key
 * every question/asset/assessment eventually hangs off — see 016_platform_curriculum.sql.
 */

const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);
const platformOnly = (req, res, next) =>
  req.user.org_id === PLATFORM_ORG_ID ? next() : error(res, 'Curriculum authoring is a WisWits-internal workspace', 403);

// Two accepted wiswits_id shapes (both appear in the source Master Index files):
//   MATH10C01T01     — SUBJ + class + C + chapter-no + T + topic-no, no separators
//   SCI-10-C07-T03   — same fields, hyphen-separated
const WISWITS_ID_PLAIN = /^[A-Z]{2,8}\d{1,2}C\d{2}T\d{2}$/;
const WISWITS_ID_HYPHEN = /^[A-Z]{2,8}-\d{1,2}-C\d{2}-T\d{2}$/;
function isValidWiswitsId(id) {
  return typeof id === 'string' && (WISWITS_ID_PLAIN.test(id) || WISWITS_ID_HYPHEN.test(id));
}

router.use(authenticate);

// ── Read: any authenticated user (school reads always, per the target model) ──
router.get('/', async (req, res) => {
  try {
    const { board, class_no, subject_key, chapter_no, is_active } = req.query;
    let where = 'WHERE 1=1';
    const p = [];
    if (board) { where += ' AND board=?'; p.push(board); }
    if (class_no) { where += ' AND class_no=?'; p.push(parseInt(class_no, 10)); }
    if (subject_key) { where += ' AND subject_key=?'; p.push(subject_key); }
    if (chapter_no) { where += ' AND chapter_no=?'; p.push(parseInt(chapter_no, 10)); }
    where += ' AND is_active=?';
    p.push(is_active === '0' ? 0 : 1);
    const rows = await query(
      `SELECT * FROM platform_curriculum ${where} ORDER BY board, class_no, subject_key, chapter_no, topic_no LIMIT 2000`, p);
    return success(res, { curriculum: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:wiswitsId', async (req, res) => {
  try {
    const row = await queryOne(`SELECT * FROM platform_curriculum WHERE wiswits_id=?`, [req.params.wiswitsId]);
    if (!row) return error(res, 'Not found', 404);
    return success(res, { curriculum: row });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:wiswitsId/map', async (req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM platform_curriculum_map WHERE from_wiswits_id=? OR to_wiswits_id=?`,
      [req.params.wiswitsId, req.params.wiswitsId]);
    return success(res, { map: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Write: org #1 only ──
router.post('/', platformOnly, async (req, res) => {
  try {
    const {
      wiswits_id, board, class_no, stream, subject_key, subject_name,
      chapter_no, chapter_name, topic_no, topic_name, nep_stage, competency_code,
      learning_outcome, ncf_code, bloom_suggested, est_periods, difficulty, prerequisites_json,
    } = req.body;
    if (!isValidWiswitsId(wiswits_id)) {
      return error(res, `Invalid wiswits_id "${wiswits_id}" — expected MATH10C01T01 or SCI-10-C07-T03 format`, 400);
    }
    if (!class_no || !subject_key || !chapter_no || !topic_no) {
      return error(res, 'class_no, subject_key, chapter_no and topic_no are required', 400);
    }
    const existing = await queryOne(`SELECT wiswits_id FROM platform_curriculum WHERE wiswits_id=?`, [wiswits_id]);
    if (existing) return error(res, `wiswits_id "${wiswits_id}" already exists`, 409);
    await query(
      `INSERT INTO platform_curriculum
        (wiswits_id, board, class_no, stream, subject_key, subject_name, chapter_no, chapter_name,
         topic_no, topic_name, nep_stage, competency_code, learning_outcome, ncf_code,
         bloom_suggested, est_periods, difficulty, prerequisites_json)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [wiswits_id, board || 'CBSE', class_no, stream || null, subject_key,
       subject_name ? JSON.stringify(subject_name) : null, chapter_no,
       chapter_name ? JSON.stringify(chapter_name) : null, topic_no,
       topic_name ? JSON.stringify(topic_name) : null, nep_stage || null, competency_code || null,
       learning_outcome ? JSON.stringify(learning_outcome) : null, ncf_code || null,
       bloom_suggested || null, est_periods || null, difficulty || null,
       prerequisites_json ? JSON.stringify(prerequisites_json) : null]);
    return success(res, { wiswits_id }, 'Curriculum slot created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// wiswits_id is IMMUTABLE — the URL param is the only source of truth for it;
// any wiswits_id in the body is silently ignored, never applied.
router.patch('/:wiswitsId', platformOnly, async (req, res) => {
  try {
    const item = await queryOne(`SELECT wiswits_id FROM platform_curriculum WHERE wiswits_id=?`, [req.params.wiswitsId]);
    if (!item) return error(res, 'Not found', 404);
    const {
      board, class_no, stream, subject_key, subject_name, chapter_no, chapter_name,
      topic_no, topic_name, nep_stage, competency_code, learning_outcome, ncf_code,
      bloom_suggested, est_periods, difficulty, prerequisites_json, is_active,
    } = req.body;
    await query(
      `UPDATE platform_curriculum SET
         board=COALESCE(?,board), class_no=COALESCE(?,class_no), stream=COALESCE(?,stream),
         subject_key=COALESCE(?,subject_key), subject_name=COALESCE(?,subject_name),
         chapter_no=COALESCE(?,chapter_no), chapter_name=COALESCE(?,chapter_name),
         topic_no=COALESCE(?,topic_no), topic_name=COALESCE(?,topic_name),
         nep_stage=COALESCE(?,nep_stage), competency_code=COALESCE(?,competency_code),
         learning_outcome=COALESCE(?,learning_outcome), ncf_code=COALESCE(?,ncf_code),
         bloom_suggested=COALESCE(?,bloom_suggested), est_periods=COALESCE(?,est_periods),
         difficulty=COALESCE(?,difficulty), prerequisites_json=COALESCE(?,prerequisites_json),
         is_active=COALESCE(?,is_active), version=version+1
       WHERE wiswits_id=?`,
      [board ?? null, class_no ?? null, stream ?? null, subject_key ?? null,
       subject_name ? JSON.stringify(subject_name) : null, chapter_no ?? null,
       chapter_name ? JSON.stringify(chapter_name) : null, topic_no ?? null,
       topic_name ? JSON.stringify(topic_name) : null, nep_stage ?? null, competency_code ?? null,
       learning_outcome ? JSON.stringify(learning_outcome) : null, ncf_code ?? null,
       bloom_suggested ?? null, est_periods ?? null, difficulty ?? null,
       prerequisites_json ? JSON.stringify(prerequisites_json) : null,
       is_active === undefined ? null : (is_active ? 1 : 0), item.wiswits_id]);
    return success(res, {}, 'Saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Prerequisite/related map. Full cycle detection lands with the bulk
//    importer (Task 3b) — this single-edge insert only rejects a direct
//    self-reference and an exact duplicate edge (UNIQUE KEY, 409 on repeat). ──
router.post('/map', platformOnly, async (req, res) => {
  try {
    const { from_wiswits_id, to_wiswits_id, relation } = req.body;
    if (!from_wiswits_id || !to_wiswits_id) return error(res, 'from_wiswits_id and to_wiswits_id are required', 400);
    if (from_wiswits_id === to_wiswits_id) return error(res, 'A curriculum slot cannot reference itself', 400);
    const rel = ['prerequisite', 'related', 'extends', 'revises'].includes(relation) ? relation : 'prerequisite';
    const [from, to] = await Promise.all([
      queryOne(`SELECT wiswits_id FROM platform_curriculum WHERE wiswits_id=?`, [from_wiswits_id]),
      queryOne(`SELECT wiswits_id FROM platform_curriculum WHERE wiswits_id=?`, [to_wiswits_id]),
    ]);
    if (!from || !to) return error(res, 'Both wiswits_id values must already exist in platform_curriculum', 404);
    const r = await query(
      `INSERT INTO platform_curriculum_map (from_wiswits_id, to_wiswits_id, relation) VALUES (?,?,?)`,
      [from_wiswits_id, to_wiswits_id, rel]);
    return success(res, { id: r.insertId }, 'Edge added', 201);
  } catch (e) {
    if (/duplicate/i.test(e.message)) return error(res, 'That edge already exists', 409);
    return error(res, e.message, 500);
  }
});

module.exports = router;
module.exports.isValidWiswitsId = isValidWiswitsId;
