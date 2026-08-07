const express = require('express');
const router = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error } = require('../../utils/response');
const { buildSet } = require('../../utils/sqlBuild');
const { audit } = require('../../utils/audit');
const { pad2 } = require('./shared');

/*
 * CMS — taxonomy: Class → Subject → Chapter → Topic + content types
 * (hr-cms module, Step 3). Content factory v2 — org-scoped from day one;
 * self-contained tree, distinct from /api/content-dev (untouched, no shim).
 *
 * ASSET CODES ARE LOCKED (grammar {SUBJ}{CLASS}C{NN}T{NN}, e.g. MATH10C05T02):
 * generated HERE, server-side, on create — IMMUTABLE afterwards. No route
 * accepts asset_code / asset_code_prefix in a payload; requests carrying one
 * are rejected, not silently stripped, so tampering is visible to the caller.
 */

router.use(authenticate);

const rejectImmutable = (body, fields) => {
  for (const f of fields) if (body[f] !== undefined) return f;
  return null;
};

// ── classes ──
router.get('/classes', requirePermission('cms.view'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM client_cms_subjects s WHERE s.class_id=c.id AND s.org_id=c.org_id AND s.is_active=1) subject_count
       FROM client_cms_classes c WHERE c.org_id=? AND c.is_active=1 ORDER BY c.sort_order, c.numeric_level`,
      [req.user.org_id]);
    return success(res, { classes: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/classes', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const { name, numeric_level = null, board = 'CBSE' } = req.body;
    if (!name) return error(res, 'name required', 400);
    const dupe = await queryOne('SELECT id FROM client_cms_classes WHERE org_id=? AND name=? AND board=?', [req.user.org_id, name, board]);
    if (dupe) return error(res, 'Class already exists for this board', 409);
    const r = await query(
      'INSERT INTO client_cms_classes (org_id, name, numeric_level, board) VALUES (?,?,?,?)',
      [req.user.org_id, name, numeric_level, board]);
    return success(res, { id: r.insertId }, 'Class created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ── subjects ──
router.get('/classes/:id/subjects', requirePermission('cms.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const cls = await queryOne('SELECT id FROM client_cms_classes WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!cls) return error(res, 'Not found', 404);
    const rows = await query(
      `SELECT s.*, (SELECT COUNT(*) FROM client_cms_chapters c WHERE c.subject_id=s.id AND c.org_id=s.org_id AND c.is_active=1) chapter_count
       FROM client_cms_subjects s WHERE s.org_id=? AND s.class_id=? AND s.is_active=1 ORDER BY s.sort_order, s.name`,
      [orgId, cls.id]);
    return success(res, { subjects: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/subjects', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { class_id, name, code, color_hex = null, icon = null } = req.body;
    if (!class_id || !name || !code) return error(res, 'class_id, name, code required', 400);
    if (!/^[A-Z]{2,10}\d{0,2}$/.test(code)) return error(res, 'code must match e.g. MATH10 (uppercase letters + class digits)', 400);
    const cls = await queryOne('SELECT id FROM client_cms_classes WHERE id=? AND org_id=?', [class_id, orgId]);
    if (!cls) return error(res, 'Class not found', 404);
    const dupe = await queryOne('SELECT id FROM client_cms_subjects WHERE org_id=? AND code=?', [orgId, code]);
    if (dupe) return error(res, 'Subject code already exists', 409);
    const r = await query(
      'INSERT INTO client_cms_subjects (org_id, class_id, name, code, color_hex, icon) VALUES (?,?,?,?,?,?)',
      [orgId, cls.id, name, code, color_hex, icon]);
    return success(res, { id: r.insertId, code }, 'Subject created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ── chapters ──
router.get('/subjects/:id/chapters', requirePermission('cms.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const subj = await queryOne('SELECT id FROM client_cms_subjects WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!subj) return error(res, 'Not found', 404);
    const rows = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM client_cms_topics t WHERE t.chapter_id=c.id AND t.org_id=c.org_id AND t.is_active=1) topic_count,
        (SELECT COUNT(*) FROM client_cms_assets a WHERE a.org_id=c.org_id AND a.is_active=1 AND
           (a.chapter_id=c.id OR a.topic_id IN (SELECT t2.id FROM client_cms_topics t2 WHERE t2.chapter_id=c.id AND t2.org_id=c.org_id))) asset_count,
        (SELECT COUNT(*) FROM client_cms_assets a WHERE a.org_id=c.org_id AND a.status='in_review' AND
           (a.chapter_id=c.id OR a.topic_id IN (SELECT t2.id FROM client_cms_topics t2 WHERE t2.chapter_id=c.id AND t2.org_id=c.org_id))) pending_review
       FROM client_cms_chapters c WHERE c.org_id=? AND c.subject_id=? AND c.is_active=1
       ORDER BY c.sort_order, c.chapter_number`,
      [orgId, subj.id]);
    return success(res, { chapters: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/chapters', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const bad = rejectImmutable(req.body, ['asset_code_prefix', 'asset_code']);
    if (bad) return error(res, `${bad} is server-generated and immutable`, 400);
    const orgId = req.user.org_id;
    const { subject_id, chapter_number, name } = req.body;
    if (!subject_id || !chapter_number || !name) return error(res, 'subject_id, chapter_number, name required', 400);
    const subj = await queryOne('SELECT id, code FROM client_cms_subjects WHERE id=? AND org_id=?', [subject_id, orgId]);
    if (!subj) return error(res, 'Subject not found', 404);
    const n = parseInt(chapter_number, 10);
    if (!Number.isInteger(n) || n < 1 || n > 99) return error(res, 'chapter_number must be 1-99', 400);
    const prefix = `${subj.code}C${pad2(n)}`;  // LOCKED grammar — server-generated
    const dupe = await queryOne(
      'SELECT id FROM client_cms_chapters WHERE org_id=? AND (asset_code_prefix=? OR (subject_id=? AND chapter_number=?))',
      [orgId, prefix, subj.id, n]);
    if (dupe) return error(res, 'Chapter number already exists for this subject', 409);
    const r = await query(
      `INSERT INTO client_cms_chapters (org_id, subject_id, chapter_number, name, name_hi, asset_code_prefix, estimated_hours, blurb, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [orgId, subj.id, n, name, req.body.name_hi ?? null, prefix, req.body.estimated_hours ?? null, req.body.blurb ?? null, n]);
    return success(res, { id: r.insertId, asset_code_prefix: prefix }, 'Chapter created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/chapters/:id', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const bad = rejectImmutable(req.body, ['asset_code_prefix', 'asset_code', 'chapter_number', 'subject_id']);
    if (bad) return error(res, `${bad} is immutable`, 400);
    const orgId = req.user.org_id;
    const ch = await queryOne('SELECT id FROM client_cms_chapters WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!ch) return error(res, 'Not found', 404);
    const FIELDS = ['name', 'name_hi', 'estimated_hours', 'cover_image_url', 'blurb', 'is_active'];
    const { clause, values: vals, count } = buildSet(FIELDS, req.body);
    if (!count) return error(res, 'nothing to update', 400);
    await query(`UPDATE client_cms_chapters SET ${clause} WHERE id=? AND org_id=?`, [...vals, ch.id, orgId]);
    return success(res, {}, 'Chapter updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── topics ──
router.get('/chapters/:id/topics', requirePermission('cms.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const ch = await queryOne('SELECT id FROM client_cms_chapters WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!ch) return error(res, 'Not found', 404);
    const rows = await query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM client_cms_assets a WHERE a.topic_id=t.id AND a.org_id=t.org_id AND a.is_active=1) asset_count,
        (SELECT COUNT(*) FROM client_cms_assets a WHERE a.topic_id=t.id AND a.org_id=t.org_id AND a.status='published') published_count
       FROM client_cms_topics t WHERE t.org_id=? AND t.chapter_id=? AND t.is_active=1
       ORDER BY t.sort_order, t.topic_number`,
      [orgId, ch.id]);
    return success(res, { topics: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Topic detail + breadcrumb (workspace header). Declared before POST /topics.
router.get('/topics/:id', requirePermission('cms.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const t = await queryOne(
      `SELECT t.*, c.id chapter_id, c.name chapter_name, c.chapter_number, c.asset_code_prefix,
              s.id subject_id, s.name subject_name, s.code subject_code,
              cl.id class_id, cl.name class_name
       FROM client_cms_topics t
       JOIN client_cms_chapters c ON c.id=t.chapter_id AND c.org_id=t.org_id
       JOIN client_cms_subjects s ON s.id=c.subject_id AND s.org_id=c.org_id
       JOIN client_cms_classes cl ON cl.id=s.class_id AND cl.org_id=s.org_id
       WHERE t.id=? AND t.org_id=?`,
      [req.params.id, orgId]);
    if (!t) return error(res, 'Not found', 404);
    return success(res, { topic: t });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/topics', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const bad = rejectImmutable(req.body, ['asset_code', 'asset_code_prefix']);
    if (bad) return error(res, `${bad} is server-generated and immutable`, 400);
    const orgId = req.user.org_id;
    const { chapter_id, name } = req.body;
    if (!chapter_id || !name) return error(res, 'chapter_id and name required', 400);
    const ch = await queryOne('SELECT id, asset_code_prefix FROM client_cms_chapters WHERE id=? AND org_id=?', [chapter_id, orgId]);
    if (!ch) return error(res, 'Chapter not found', 404);
    let n = parseInt(req.body.topic_number, 10);
    if (!Number.isInteger(n) || n < 1) {
      const max = await queryOne('SELECT COALESCE(MAX(topic_number),0) m FROM client_cms_topics WHERE org_id=? AND chapter_id=?', [orgId, ch.id]);
      n = Number(max.m) + 1;
    }
    if (n > 99) return error(res, 'topic_number must be 1-99', 400);
    const assetCode = `${ch.asset_code_prefix}T${pad2(n)}`;  // LOCKED grammar — server-generated
    const dupe = await queryOne(
      'SELECT id FROM client_cms_topics WHERE org_id=? AND (asset_code=? OR (chapter_id=? AND topic_number=?))',
      [orgId, assetCode, ch.id, n]);
    if (dupe) return error(res, 'Topic number already exists for this chapter', 409);
    const r = await query(
      `INSERT INTO client_cms_topics (org_id, chapter_id, topic_number, name, name_hi, asset_code, learning_objectives, difficulty_band, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [orgId, ch.id, n, name, req.body.name_hi ?? null, assetCode,
        req.body.learning_objectives ? JSON.stringify(req.body.learning_objectives) : null,
        req.body.difficulty_band ?? null, n]);
    return success(res, { id: r.insertId, asset_code: assetCode }, 'Topic created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/topics/:id', requirePermission('cms.taxonomy.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const bad = rejectImmutable(req.body, ['asset_code', 'asset_code_prefix', 'topic_number', 'chapter_id']);
    if (bad) return error(res, `${bad} is immutable`, 400);
    const orgId = req.user.org_id;
    const t = await queryOne('SELECT id FROM client_cms_topics WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!t) return error(res, 'Not found', 404);
    const FIELDS = ['name', 'name_hi', 'difficulty_band', 'is_active'];
    const built = buildSet(FIELDS, req.body);
    const sets = built.clause ? [built.clause] : [];
    const vals = [...built.values];
    if (req.body.learning_objectives !== undefined) { sets.push('learning_objectives=?'); vals.push(JSON.stringify(req.body.learning_objectives)); }
    if (!sets.length) return error(res, 'nothing to update', 400);
    await query(`UPDATE client_cms_topics SET ${sets.join(', ')} WHERE id=? AND org_id=?`, [...vals, t.id, orgId]);
    return success(res, {}, 'Topic updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ── bulk reorder: single transaction, same-parent + same-org validated ──
const REORDER = {
  class: { table: 'client_cms_classes', parent: null },
  subject: { table: 'client_cms_subjects', parent: 'class_id' },
  chapter: { table: 'client_cms_chapters', parent: 'subject_id' },
  topic: { table: 'client_cms_topics', parent: 'chapter_id' },
};
router.patch('/reorder', requirePermission('cms.reorder'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { entity, items } = req.body;
    const def = REORDER[entity];
    if (!def) return error(res, `entity must be one of: ${Object.keys(REORDER).join(', ')}`, 400);
    if (!Array.isArray(items) || !items.length || items.length > 500) return error(res, 'items required (max 500)', 400);
    const ids = items.map(i => Number(i.id));
    if (ids.some(id => !Number.isInteger(id) || id < 1)) return error(res, 'invalid item id', 400);
    const rows = await query(
      `SELECT id${def.parent ? `, ${def.parent} parent` : ''} FROM ${def.table} WHERE org_id=? AND id IN (${ids.map(() => '?').join(',')})`,
      [orgId, ...ids]);
    if (rows.length !== ids.length) return error(res, 'One or more items not found in your organization', 404);
    if (def.parent && new Set(rows.map(r => String(r.parent))).size > 1) {
      return error(res, 'All items must share the same parent', 400);
    }
    await transaction(async (conn) => {
      for (const it of items) {
        await conn.execute(`UPDATE ${def.table} SET sort_order=? WHERE id=? AND org_id=?`, [Number(it.sort_order) || 0, Number(it.id), orgId]);
      }
    });
    return success(res, { reordered: items.length }, 'Order saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── content types (runtime-extensible; system types seeded) ──
router.get('/types', requirePermission('cms.view'), async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM client_cms_types WHERE org_id=? AND is_active=1 ORDER BY sort_order, label', [req.user.org_id]);
    return success(res, { types: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/types', requirePermission('cms.type.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { type_key, label } = req.body;
    if (!type_key || !label) return error(res, 'type_key and label required', 400);
    if (!/^[a-z][a-z0-9_]{1,39}$/.test(type_key)) return error(res, 'type_key must be snake_case', 400);
    const dupe = await queryOne('SELECT id FROM client_cms_types WHERE org_id=? AND type_key=?', [orgId, type_key]);
    if (dupe) return error(res, 'type_key already exists', 409);
    const r = await query(
      `INSERT INTO client_cms_types (org_id, type_key, label, icon, color_hex, accepted_formats, schema_json, is_system, sort_order)
       VALUES (?,?,?,?,?,?,?,0,?)`,
      [orgId, type_key, label, req.body.icon ?? null, req.body.color_hex ?? null,
        req.body.accepted_formats ? JSON.stringify(req.body.accepted_formats) : null,
        req.body.schema_json ? JSON.stringify(req.body.schema_json) : null,
        Number(req.body.sort_order) || 999]);
    await audit(req, 'CMS_TYPE_CREATE', 'cms_type', r.insertId, { new_data: { type_key, label } });
    return success(res, { id: r.insertId }, 'Content type created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/types/:id', requirePermission('cms.type.manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    if (req.body.type_key !== undefined) return error(res, 'type_key is immutable', 400);
    if (req.body.is_system !== undefined) return error(res, 'is_system is server-managed', 400);
    const orgId = req.user.org_id;
    const t = await queryOne('SELECT id FROM client_cms_types WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!t) return error(res, 'Not found', 404);
    const FIELDS = ['label', 'icon', 'color_hex', 'sort_order', 'is_active'];
    const built = buildSet(FIELDS, req.body);
    const sets = built.clause ? [built.clause] : [];
    const vals = [...built.values];
    for (const f of ['accepted_formats', 'schema_json']) if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(JSON.stringify(req.body[f])); }
    if (!sets.length) return error(res, 'nothing to update', 400);
    await query(`UPDATE client_cms_types SET ${sets.join(', ')} WHERE id=? AND org_id=?`, [...vals, t.id, orgId]);
    return success(res, {}, 'Content type updated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
