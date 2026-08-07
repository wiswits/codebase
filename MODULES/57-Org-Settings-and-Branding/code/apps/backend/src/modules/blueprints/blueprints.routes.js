const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { success, error } = require('../../utils/response');
const { getActiveSchool } = require('../../utils/activeSchool');

/*
 * Institution Blueprints + Terminology (Sprint A1/A2, SUG-0074 P0/P1).
 * Blueprints are PLATFORM config (superadmin edits from the screen — new
 * institution types with zero code). Labels are per-tenant terminology.
 */

router.use(authenticate);
const PLATFORM = ['owner', 'super_admin', 'system_admin'];
const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);
// Blueprints are PLATFORM config — a client school's owner must never edit them.
const platformOnly = (req, res, next) =>
  req.user.org_id === PLATFORM_ORG_ID ? next() : error(res, 'Platform access is restricted to WisWits', 403);

// ── Blueprints (platform console) ──
router.get('/blueprints', requireRole(...PLATFORM), platformOnly, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM platform_institution_blueprints ORDER BY id`);
    return success(res, { blueprints: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/blueprints/:type', requireRole(...PLATFORM), platformOnly, async (req, res) => {
  try {
    const { name, labels, roles, features, field_sets, grading_mode, is_active } = req.body;
    const bp = await queryOne(`SELECT id FROM platform_institution_blueprints WHERE type=?`, [req.params.type]);
    const js = (v) => (v === undefined ? null : JSON.stringify(v));
    if (!bp) {
      // New institution type from the screen — the whole point of "fully dynamic"
      await query(
        `INSERT INTO platform_institution_blueprints (type, name, labels, roles, features, field_sets_json, grading_mode, is_active)
         VALUES (?,?,?,?,?,?,?,1)`,
        [req.params.type.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30),
         name || req.params.type, js(labels) || '{}', js(roles), js(features) || '{}', js(field_sets) || '{}', grading_mode || 'percentage_band']);
      return success(res, {}, 'Institution type created ✓', 201);
    }
    await query(
      `UPDATE platform_institution_blueprints SET
         name=COALESCE(?,name), labels=COALESCE(?,labels), roles=COALESCE(?,roles),
         features=COALESCE(?,features), field_sets_json=COALESCE(?,field_sets_json),
         grading_mode=COALESCE(?,grading_mode), is_active=COALESCE(?,is_active)
       WHERE type=?`,
      [name ?? null, js(labels), js(roles), js(features), js(field_sets), grading_mode ?? null,
       is_active === undefined ? null : (is_active ? 1 : 0), req.params.type]);
    return success(res, {}, 'Blueprint saved ✓');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Per-tenant terminology labels ──
// Any authenticated user reads their org's map (the frontend hook). Multi-branch
// (P2): overlay the ACTIVE branch's labels (school_id) over the org-wide ones
// (school_id=0) so a caller scoped to a branch reads that branch's vocabulary.
// Single-branch orgs → getActiveSchool null → only school_id=0 rows → unchanged.
router.get('/labels', async (req, res) => {
  try {
    const activeSchool = (await getActiveSchool(req)) || 0;
    // org rows first (school_id=0), then branch rows — so the branch overrides.
    const rows = await query(
      `SELECT canonical, display FROM client_labels
        WHERE org_id=? AND (school_id=0 OR school_id=?)
        ORDER BY (school_id=0) DESC`,
      [req.user.org_id, activeSchool]);
    const map = {};
    rows.forEach(r => { map[r.canonical] = r.display; });
    return success(res, { labels: map });
  } catch (e) { return success(res, { labels: {} }); } // fail-soft: default English
});

// Owner/admin customizes their institution's vocabulary (no code, per tenant).
// P2: when a branch is active, edits are scoped to that branch (school_id); the
// primary/org view (no active branch) edits the org-wide (school_id=0) map.
router.put('/labels', requireRole('owner', 'admin', 'super_admin', 'system_admin'), async (req, res) => {
  try {
    const labels = req.body && typeof req.body.labels === 'object' ? req.body.labels : null;
    if (!labels) return error(res, 'labels object required', 400);
    const o = req.user.org_id;
    const school = (await getActiveSchool(req)) || 0;
    for (const [canonical, display] of Object.entries(labels)) {
      if (!canonical) continue;
      if (!display) { await query(`DELETE FROM client_labels WHERE org_id=? AND school_id=? AND canonical=?`, [o, school, canonical]); continue; }
      await query(
        `INSERT INTO client_labels (org_id, school_id, canonical, display) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE display=VALUES(display)`,
        [o, school, String(canonical).slice(0, 64), String(display).slice(0, 64)]);
    }
    return success(res, {}, 'Terminology saved ✓');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
