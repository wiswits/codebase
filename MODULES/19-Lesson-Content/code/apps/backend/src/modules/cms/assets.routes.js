const express = require('express');
const router = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error, paginated } = require('../../utils/response');
const { buildSet } = require('../../utils/sqlBuild');
const { audit } = require('../../utils/audit');
const { employeeFor, getAsset, canEditAsset, latexCheck } = require('./shared');

/*
 * CMS — content assets: draft → in_review → (changes_requested)* → approved →
 * published → archived (hr-cms module, Step 3).
 *
 * Server-managed, never client-supplied (rejected or stripped, see each route):
 * status, version, view_count, created_by/updated_by, submitted/reviewed/
 * published stamps, org_id. created_by is ALWAYS the caller's employee profile
 * resolved from the token — this is what makes auto_metrics trustworthy.
 * SoD: an author can never review their own asset.
 */

router.use(authenticate);

const EDITABLE_STATUSES = ['draft', 'changes_requested'];
const CONTENT_FIELDS = ['title', 'title_hi', 'description', 'tags', 'language', 'estimated_minutes'];

const pickContent = (body) => {
  const out = {};
  for (const f of CONTENT_FIELDS) if (body[f] !== undefined) out[f] = f === 'tags' ? JSON.stringify(body[f]) : body[f];
  return out;
};

// ── list & read ──
router.get('/', requirePermission('cms.asset.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const where = ['a.org_id=?', 'a.is_active=1'];
    const params = [orgId];
    for (const [q, col] of [['topic_id', 'a.topic_id'], ['chapter_id', 'a.chapter_id'], ['status', 'a.status'],
      ['content_type_id', 'a.content_type_id'], ['created_by', 'a.created_by']]) {
      if (req.query[q]) { where.push(`${col}=?`); params.push(req.query[q]); }
    }
    const total = (await queryOne(`SELECT COUNT(*) n FROM client_cms_assets a WHERE ${where.join(' AND ')}`, params)).n;
    const rows = await query(
      `SELECT a.*, t.asset_code, ct.type_key, ct.label type_label
       FROM client_cms_assets a
       LEFT JOIN client_cms_topics t ON t.id=a.topic_id AND t.org_id=a.org_id
       LEFT JOIN client_cms_types ct ON ct.id=a.content_type_id AND ct.org_id=a.org_id
       WHERE ${where.join(' AND ')} ORDER BY a.sort_order, a.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]);
    return paginated(res, { assets: rows }, total, page, limit);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:id', requirePermission('cms.asset.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const [media, reviews] = await Promise.all([
      query('SELECT * FROM client_cms_media WHERE org_id=? AND asset_id=? ORDER BY sort_order, id', [orgId, asset.id]),
      query('SELECT * FROM client_cms_review_log WHERE org_id=? AND asset_id=? ORDER BY created_at DESC LIMIT 50', [orgId, asset.id]),
    ]);
    return success(res, { asset, media, reviews });
  } catch (e) { return error(res, e.message, 500); }
});

// ── create ──
router.post('/', requirePermission('cms.asset.create'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // Server-managed fields: reject loudly so tampering is visible, never silent.
    for (const f of ['status', 'version', 'view_count', 'created_by', 'updated_by', 'submitted_by', 'submitted_at',
      'reviewed_by', 'reviewed_at', 'published_at', 'parent_version_id']) {
      if (req.body[f] !== undefined) return error(res, `${f} is server-managed`, 400);
    }
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile — content authorship requires one', 403);
    const { topic_id = null, chapter_id = null, content_type_id, title } = req.body;
    if (!content_type_id || !title) return error(res, 'content_type_id and title required', 400);
    if (!topic_id === !chapter_id) return error(res, 'exactly one of topic_id / chapter_id required', 400);
    const scope = topic_id ? 'topic' : 'chapter';
    const parent = topic_id
      ? await queryOne('SELECT id FROM client_cms_topics WHERE id=? AND org_id=?', [topic_id, orgId])
      : await queryOne('SELECT id FROM client_cms_chapters WHERE id=? AND org_id=?', [chapter_id, orgId]);
    if (!parent) return error(res, `${scope} not found`, 404);
    const ctype = await queryOne('SELECT id FROM client_cms_types WHERE id=? AND org_id=? AND is_active=1', [content_type_id, orgId]);
    if (!ctype) return error(res, 'content type not found', 404);

    const { errors, warnings } = latexCheck(req.body.payload);
    if (errors.length) return error(res, `LaTeX rules violated: ${errors.join(' | ')}`, 400);

    const c = pickContent(req.body);
    const sortRow = await queryOne(
      `SELECT COALESCE(MAX(sort_order),0) m FROM client_cms_assets WHERE org_id=? AND ${scope === 'topic' ? 'topic_id' : 'chapter_id'}=? AND content_type_id=?`,
      [orgId, topic_id || chapter_id, ctype.id]);
    const r = await query(
      `INSERT INTO client_cms_assets (org_id, topic_id, chapter_id, content_type_id, title, title_hi, description, scope,
         payload, status, version, created_by, updated_by, sort_order, tags, language, estimated_minutes)
       VALUES (?,?,?,?,?,?,?,?,?,'draft',1,?,?,?,?,?,?)`,
      [orgId, topic_id, chapter_id, ctype.id, title, c.title_hi ?? null, c.description ?? null, scope,
        req.body.payload ? JSON.stringify(req.body.payload) : null, emp.id, emp.id,
        Number(sortRow.m) + 1, c.tags ?? null, c.language ?? 'en', c.estimated_minutes ?? null]);
    return success(res, { id: r.insertId, status: 'draft', version: 1, warnings }, 'Asset created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ── reorder within a topic tab (declared BEFORE /:id so 'reorder' never binds as an id) ──
router.patch('/reorder', requirePermission('cms.reorder'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { topic_id, items } = req.body;
    if (!topic_id || !Array.isArray(items) || !items.length || items.length > 200) return error(res, 'topic_id and items required (max 200)', 400);
    const ids = items.map(i => Number(i.id));
    const rows = await query(
      `SELECT id FROM client_cms_assets WHERE org_id=? AND topic_id=? AND id IN (${ids.map(() => '?').join(',')})`,
      [orgId, topic_id, ...ids]);
    if (rows.length !== ids.length) return error(res, 'One or more assets not found in this topic', 404);
    await transaction(async (conn) => {
      for (const it of items) {
        await conn.execute('UPDATE client_cms_assets SET sort_order=? WHERE id=? AND org_id=?', [Number(it.sort_order) || 0, Number(it.id), orgId]);
      }
    });
    return success(res, { reordered: items.length }, 'Order saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── edit (own draft/changes_requested, or cms.asset.update_any) ──
router.patch('/:id', requirePermission('cms.asset.update_own'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    for (const f of ['status', 'version', 'view_count', 'created_by', 'updated_by', 'submitted_by', 'submitted_at',
      'reviewed_by', 'reviewed_at', 'published_at', 'parent_version_id', 'topic_id', 'chapter_id', 'scope', 'content_type_id']) {
      if (req.body[f] !== undefined) return error(res, `${f} is server-managed (re-parenting via /move)`, 400);
    }
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const { ok, emp } = await canEditAsset(req, asset);
    if (!ok) return error(res, 'You can only edit your own assets', 403);
    if (!EDITABLE_STATUSES.includes(asset.status)) return error(res, `Cannot edit a ${asset.status} asset`, 409);

    const { errors, warnings } = latexCheck(req.body.payload);
    if (errors.length) return error(res, `LaTeX rules violated: ${errors.join(' | ')}`, 400);

    const c = pickContent(req.body); // already allow-listed + transformed (tags→JSON)
    const built = buildSet(CONTENT_FIELDS, c);
    const sets = built.clause ? [built.clause] : [];
    const vals = [...built.values];
    if (req.body.payload !== undefined) { sets.push('payload=?'); vals.push(JSON.stringify(req.body.payload)); }
    if (!sets.length) return error(res, 'nothing to update', 400);
    sets.push('updated_by=?'); vals.push(emp ? emp.id : asset.updated_by);
    await query(`UPDATE client_cms_assets SET ${sets.join(', ')} WHERE id=? AND org_id=?`, [...vals, asset.id, orgId]);
    return success(res, { warnings }, 'Asset saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── workflow: submit → review → publish / archive ──
router.post('/:id/submit', requirePermission('cms.asset.submit'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const { ok, emp } = await canEditAsset(req, asset);
    if (!ok) return error(res, 'You can only submit your own assets', 403);
    if (!EDITABLE_STATUSES.includes(asset.status)) return error(res, `Cannot submit a ${asset.status} asset`, 409);
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO client_cms_versions (org_id, asset_id, version_number, payload_snapshot, changed_by, change_note)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE payload_snapshot=VALUES(payload_snapshot), changed_by=VALUES(changed_by), change_note=VALUES(change_note)`,
        [orgId, asset.id, asset.version, asset.payload, emp ? emp.id : asset.created_by, req.body.change_note ?? null]);
      await conn.execute(
        `UPDATE client_cms_assets SET status='in_review', submitted_by=?, submitted_at=NOW() WHERE id=? AND org_id=?`,
        [emp ? emp.id : asset.created_by, asset.id, orgId]);
    });
    return success(res, { status: 'in_review', version: asset.version }, 'Submitted for review');
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/:id/review', requirePermission('cms.asset.review'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const { action, comment = null, field_ref = null } = req.body;
    if (!['approve', 'request_changes', 'reject', 'comment'].includes(action)) {
      return error(res, 'action must be approve | request_changes | reject | comment', 400);
    }
    const emp = await employeeFor(orgId, req.user.user_id);
    // SoD (SUG-0071): never your own asset — not even elevated roles.
    if (emp && emp.id === asset.created_by) return error(res, 'You cannot review your own asset', 403);
    if (action !== 'comment' && asset.status !== 'in_review') {
      return error(res, `Only in_review assets can be ${action === 'approve' ? 'approved' : 'sent back'}`, 409);
    }
    await query(
      'INSERT INTO client_cms_review_log (org_id, asset_id, reviewer_id, action, comment, field_ref) VALUES (?,?,?,?,?,?)',
      [orgId, asset.id, emp ? emp.id : 0, action, comment, field_ref]);
    if (action === 'approve') {
      await query("UPDATE client_cms_assets SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE id=? AND org_id=?",
        [emp ? emp.id : null, asset.id, orgId]);
    } else if (action === 'request_changes' || action === 'reject') {
      await query("UPDATE client_cms_assets SET status='changes_requested', reviewed_by=?, reviewed_at=NOW() WHERE id=? AND org_id=?",
        [emp ? emp.id : null, asset.id, orgId]);
    }
    await audit(req, 'CMS_ASSET_REVIEW', 'cms_asset', asset.id, { new_data: { action } });
    return success(res, { action }, 'Review recorded');
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/:id/publish', requirePermission('cms.asset.publish'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    if (asset.status !== 'approved') return error(res, 'Only approved assets can be published', 409);
    await query("UPDATE client_cms_assets SET status='published', published_at=NOW() WHERE id=? AND org_id=?", [asset.id, orgId]);
    await audit(req, 'CMS_ASSET_PUBLISH', 'cms_asset', asset.id, { new_data: { title: asset.title } });
    return success(res, { status: 'published' }, 'Published');
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/:id/archive', requirePermission('cms.asset.delete'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    await query("UPDATE client_cms_assets SET status='archived', is_active=0 WHERE id=? AND org_id=?", [asset.id, orgId]);
    await audit(req, 'CMS_ASSET_ARCHIVE', 'cms_asset', asset.id, {});
    return success(res, { status: 'archived' }, 'Archived');
  } catch (e) { return error(res, e.message, 500); }
});

// ── versions ──
router.get('/:id/versions', requirePermission('cms.asset.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const rows = await query(
      'SELECT id, version_number, changed_by, change_note, created_at FROM client_cms_versions WHERE org_id=? AND asset_id=? ORDER BY version_number DESC',
      [orgId, asset.id]);
    return success(res, { current_version: asset.version, versions: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/:id/restore/:versionId', requirePermission('cms.asset.update_own'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    const { ok, emp } = await canEditAsset(req, asset);
    if (!ok) return error(res, 'You can only restore your own assets', 403);
    if (!EDITABLE_STATUSES.includes(asset.status)) return error(res, `Cannot restore a ${asset.status} asset`, 409);
    const snap = await queryOne('SELECT * FROM client_cms_versions WHERE id=? AND asset_id=? AND org_id=?', [req.params.versionId, asset.id, orgId]);
    if (!snap) return error(res, 'Version not found', 404);
    await query(
      'UPDATE client_cms_assets SET payload=?, version=version+1, updated_by=? WHERE id=? AND org_id=?',
      [snap.payload_snapshot, emp ? emp.id : asset.updated_by, asset.id, orgId]);
    return success(res, { restored_from: snap.version_number, version: asset.version + 1 }, 'Version restored');
  } catch (e) { return error(res, e.message, 500); }
});

// ── re-parent (Arrange Board) ──
router.post('/:id/move', requirePermission('cms.reorder'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const asset = await getAsset(orgId, req.params.id);
    if (!asset) return error(res, 'Not found', 404);
    if (asset.scope !== 'topic') return error(res, 'Only topic-scoped assets can be moved', 400);
    const { topic_id, confirm_published = false } = req.body;
    if (!topic_id) return error(res, 'topic_id required', 400);
    const target = await queryOne('SELECT id FROM client_cms_topics WHERE id=? AND org_id=?', [topic_id, orgId]);
    if (!target) return error(res, 'Target topic not found', 404);
    // Published content never silently moves (spec: explicit confirm on re-parent).
    if (asset.status === 'published' && !confirm_published) {
      return error(res, 'Asset is published — pass confirm_published:true to move it', 409);
    }
    await query('UPDATE client_cms_assets SET topic_id=? WHERE id=? AND org_id=?', [target.id, asset.id, orgId]);
    await audit(req, 'CMS_ASSET_MOVE', 'cms_asset', asset.id, { new_data: { from_topic: asset.topic_id, to_topic: target.id } });
    return success(res, {}, 'Asset moved');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
