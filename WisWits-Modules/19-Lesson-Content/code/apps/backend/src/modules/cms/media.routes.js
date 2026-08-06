const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error } = require('../../utils/response');
const { getAsset, canEditAsset } = require('./shared');

/*
 * CMS — media METADATA only (hr-cms module, Step 3 scope decision).
 * External URL (YouTube/Vimeo/Drive/direct) is the PRIMARY video path:
 * validated against a provider allowlist, canonicalized server-side, oEmbed
 * metadata fetched best-effort. File attachments reference the EXISTING
 * uploads pipeline (storage_key) — no S3, no presign, no new upload infra.
 * Upload size is capped at 100MB (Step 3 decision).
 */

router.use(authenticate);

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const KINDS = ['video', 'pdf', 'image', 'audio', 'attachment'];

// Provider allowlist → canonical URL. Raw pasted URLs are never stored unparsed.
function canonicalize(rawUrl) {
  let u;
  try { u = new URL(String(rawUrl)); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    const id = host === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : (u.searchParams.get('v') || (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null));
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return { provider: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, oembed: `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}` };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d{6,12})/);
    if (!m) return null;
    return { provider: 'vimeo', url: `https://vimeo.com/${m[1]}`, oembed: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${m[1]}`)}` };
  }
  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([\w-]{10,})/);
    if (!m) return null;
    return { provider: 'drive', url: `https://drive.google.com/file/d/${m[1]}/view`, oembed: null };
  }
  if (/\.(mp4|webm|m3u8)$/i.test(u.pathname)) return { provider: 'direct', url: u.toString(), oembed: null };
  return null;
}

// Best-effort oEmbed — 3s cap, failure is metadata-less success, never an error.
async function fetchOembed(url) {
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Attach rights = edit rights on the parent asset, in an editable status.
async function editableAsset(req, assetId) {
  const asset = await getAsset(req.user.org_id, assetId);
  if (!asset) return { err: ['Not found', 404] };
  const { ok } = await canEditAsset(req, asset);
  if (!ok) return { err: ['You can only manage media on your own assets', 403] };
  if (!['draft', 'changes_requested'].includes(asset.status)) return { err: [`Cannot modify media on a ${asset.status} asset`, 409] };
  return { asset };
}

router.post('/external', requirePermission('cms.asset.update_own'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { asset_id, url } = req.body;
    if (!asset_id || !url) return error(res, 'asset_id and url required', 400);
    const { asset, err } = await editableAsset(req, asset_id);
    if (err) return error(res, err[0], err[1]);
    const canon = canonicalize(url);
    if (!canon) return error(res, 'Unsupported or invalid URL — allowed: YouTube, Vimeo, Google Drive, direct https video', 400);
    const meta = await fetchOembed(canon.oembed);
    const r = await query(
      `INSERT INTO client_cms_media (org_id, asset_id, kind, external_url, external_provider, thumbnail_url, duration_seconds, upload_status)
       VALUES (?,?,'video',?,?,?,?,'ready')`,
      [orgId, asset.id, canon.url, canon.provider, meta?.thumbnail_url ?? null, meta?.duration ?? null]);
    return success(res, { id: r.insertId, provider: canon.provider, canonical_url: canon.url, oembed: !!meta }, 'External media attached', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/attach', requirePermission('cms.asset.update_own'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { asset_id, kind, storage_key, original_filename = null, mime_type = null, size_bytes = null } = req.body;
    if (!asset_id || !kind || !storage_key) return error(res, 'asset_id, kind, storage_key required', 400);
    if (!KINDS.includes(kind)) return error(res, `kind must be one of: ${KINDS.join(', ')}`, 400);
    if (size_bytes != null && Number(size_bytes) > MAX_UPLOAD_BYTES) return error(res, 'File exceeds the 100MB limit — use an external video URL for large lectures', 400);
    const { asset, err } = await editableAsset(req, asset_id);
    if (err) return error(res, err[0], err[1]);
    const r = await query(
      `INSERT INTO client_cms_media (org_id, asset_id, kind, storage_key, original_filename, mime_type, size_bytes, upload_status)
       VALUES (?,?,?,?,?,?,?,'ready')`,
      [orgId, asset.id, kind, String(storage_key).slice(0, 500), original_filename, mime_type, size_bytes]);
    return success(res, { id: r.insertId }, 'Media attached', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/reorder', requirePermission('cms.reorder'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { asset_id, items } = req.body;
    if (!asset_id || !Array.isArray(items) || !items.length || items.length > 100) return error(res, 'asset_id and items required (max 100)', 400);
    const ids = items.map(i => Number(i.id));
    const rows = await query(
      `SELECT id FROM client_cms_media WHERE org_id=? AND asset_id=? AND id IN (${ids.map(() => '?').join(',')})`,
      [orgId, asset_id, ...ids]);
    if (rows.length !== ids.length) return error(res, 'One or more media items not found on this asset', 404);
    for (const it of items) {
      await query('UPDATE client_cms_media SET sort_order=? WHERE id=? AND org_id=?', [Number(it.sort_order) || 0, Number(it.id), orgId]);
    }
    return success(res, { reordered: items.length }, 'Order saved');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/:id', requirePermission('cms.asset.update_own'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const media = await queryOne('SELECT * FROM client_cms_media WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!media) return error(res, 'Not found', 404);
    const { err } = await editableAsset(req, media.asset_id);
    if (err) return error(res, err[0], err[1]);
    await query('DELETE FROM client_cms_media WHERE id=? AND org_id=?', [media.id, orgId]);
    return success(res, {}, 'Media removed');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
