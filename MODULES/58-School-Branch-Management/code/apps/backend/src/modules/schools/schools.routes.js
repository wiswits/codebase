'use strict';
/**
 * Branches / Institutes under an org (multi-branch, SUG — MULTI_BRANCH_PLAN.md).
 * Phase 1: the owner can add & manage institutes under their org; every request
 * is org-scoped. Branch DATA scoping + the header switcher land in Phase 2.
 */
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { seedBranchLabels } = require('../blueprints/blueprint.service');
const { istToday } = require('../../utils/schoolDay');
const { safePct } = require('../../utils/pct');

router.use(authenticate);

// only org leadership may create/edit institutes
const requireOwner = requireRole('owner', 'admin', 'principal', 'super_admin', 'system_admin');

// All institutes under the caller's org (with a live student count per branch)
router.get('/', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM client_students st JOIN client_users u ON u.id=st.user_id
          WHERE st.org_id=? AND u.is_active=1 AND st.school_id=s.id) AS student_count,
        (SELECT COUNT(*) FROM client_user_schools us WHERE us.school_id=s.id) AS member_count
       FROM client_schools s
       WHERE s.org_id=?
       ORDER BY s.is_primary DESC, s.name`, [o, o]);
    return success(res, { schools: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Institutes the CURRENT user may act in (Phase-2 branch switcher reads this)
router.get('/mine', async (req, res) => {
  try {
    const o = req.user.org_id, uid = req.user.user_id;
    const rows = await query(
      `SELECT s.id, s.name, s.type, s.is_primary
       FROM client_user_schools us JOIN client_schools s ON s.id=us.school_id
       WHERE us.user_id=? AND us.org_id=? AND s.status='active'
       ORDER BY s.is_primary DESC, s.name`, [uid, o]);
    return success(res, { schools: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// GROUP ROLLUP — every branch side-by-side with live KPIs + org totals.
// The "country-head" view: one screen to run a group of institutions.
// Leadership-only. All numbers derive from branch-tagged rows (school_id).
router.get('/rollup', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const today = istToday(); // the school's IST day — utils/schoolDay.js

    const branches = await query(
      `SELECT id, name, type, is_primary FROM client_schools
       WHERE org_id=? AND status='active' ORDER BY is_primary DESC, name`, [o]);

    // one grouped query per metric — cheap, and merged in JS by school_id
    const [students, classes, teachers, att, feesAssigned, feesPaid] = await Promise.all([
      query(`SELECT st.school_id sid, COUNT(*) c FROM client_students st
             JOIN client_users u ON u.id=st.user_id
             WHERE st.org_id=? AND u.is_active=1 GROUP BY st.school_id`, [o]),
      query(`SELECT school_id sid, COUNT(*) c FROM client_classes
             WHERE org_id=? AND status='active' GROUP BY school_id`, [o]),
      query(`SELECT us.school_id sid, COUNT(DISTINCT us.user_id) c
             FROM client_user_schools us
             JOIN client_user_roles ur ON ur.user_id=us.user_id AND ur.org_id=us.org_id
             JOIN client_roles ro ON ro.id=ur.role_id AND ro.base_role='teacher'
             WHERE us.org_id=? GROUP BY us.school_id`, [o]),
      query(`SELECT sec.school_id sid,
               COUNT(DISTINCT ar.student_id) marked,
               COUNT(ar.id) marked_records,
               SUM(ar.status='present') present
             FROM client_attendance_sessions s
             JOIN client_sections sec ON sec.id=s.section_id
             JOIN client_attendance_records ar ON ar.session_id=s.id
             WHERE s.org_id=? AND s.date=? GROUP BY sec.school_id`, [o, today]),
      query(`SELECT st.school_id sid, COALESCE(SUM(fa.final_amount),0) v
             FROM client_fee_assignments fa JOIN client_students st ON st.id=fa.student_id
             WHERE fa.org_id=? GROUP BY st.school_id`, [o]),
      query(`SELECT st.school_id sid, COALESCE(SUM(fp.amount),0) v
             FROM client_fee_payments fp JOIN client_students st ON st.id=fp.student_id
             WHERE fp.org_id=? GROUP BY st.school_id`, [o]),
    ]);

    const byId = (rows, k = 'c') => {
      const m = {}; for (const r of rows) m[r.sid] = r; return m;
    };
    const S = byId(students), C = byId(classes), T = byId(teachers);
    const A = byId(att), FA = byId(feesAssigned), FP = byId(feesPaid);

    const rows = branches.map((b) => {
      const marked = A[b.id]?.marked || 0;
      const present = Number(A[b.id]?.present || 0);
      const assigned = Number(FA[b.id]?.v || 0);
      const collected = Number(FP[b.id]?.v || 0);
      return {
        id: b.id, name: b.name, type: b.type, is_primary: !!b.is_primary,
        students: S[b.id]?.c || 0,
        classes: C[b.id]?.c || 0,
        teachers: T[b.id]?.c || 0,
        attendance_marked: marked,
        // present is a RECORD count, so the denominator must be records too —
        // dividing by the distinct-student count printed >100% for any branch
        // with more than one session in a day. null when nothing is marked.
        attendance_pct: safePct(present, A[b.id]?.marked_records),
        fees_assigned: assigned,
        fees_collected: collected,
        fees_pending: Math.max(0, assigned - collected),
        collection_rate: safePct(collected, assigned),
      };
    });

    const sum = (k) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const totals = {
      branches: rows.length,
      students: sum('students'),
      classes: sum('classes'),
      teachers: sum('teachers'),
      fees_assigned: sum('fees_assigned'),
      fees_collected: sum('fees_collected'),
      fees_pending: sum('fees_pending'),
      collection_rate: sum('fees_assigned') > 0
        ? Math.round((sum('fees_collected') / sum('fees_assigned')) * 100) : 0,
    };

    return success(res, { date: today, branches: rows, totals });
  } catch (e) { return error(res, e.message, 500); }
});

// Staff who can be assigned to a branch (never students/parents). For the picker.
router.get('/assignable-users', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query(
      `SELECT u.id,
        TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS name,
        u.email,
        (SELECT ro.base_role FROM client_user_roles ur JOIN client_roles ro ON ro.id=ur.role_id
          WHERE ur.user_id=u.id AND ur.org_id=? LIMIT 1) AS base_role
       FROM client_users u
       WHERE u.org_id=? AND u.is_active=1
         AND EXISTS (SELECT 1 FROM client_user_roles ur JOIN client_roles ro ON ro.id=ur.role_id
                     WHERE ur.user_id=u.id AND ur.org_id=? AND ro.base_role NOT IN ('student','parent'))
       ORDER BY name LIMIT 300`, [o, o, o]);
    return success(res, { users: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ── BRANCH ACCESS (per-institution binding) ──────────────────────────────────
// A branch's members, with lock state. Locked = bound to only this institute.
router.get('/:id/members', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const s = await queryOne('SELECT id FROM client_schools WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);
    const rows = await query(
      `SELECT us.user_id, us.is_locked, us.is_primary,
        TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS name,
        u.email,
        (SELECT ro.base_role FROM client_user_roles ur JOIN client_roles ro ON ro.id=ur.role_id
          WHERE ur.user_id=u.id AND ur.org_id=us.org_id LIMIT 1) AS base_role,
        (SELECT COUNT(*) FROM client_user_schools x WHERE x.user_id=us.user_id AND x.org_id=us.org_id) AS branch_count
       FROM client_user_schools us
       JOIN client_users u ON u.id=us.user_id
       WHERE us.org_id=? AND us.school_id=?
       ORDER BY us.is_locked DESC, name`, [o, req.params.id]);
    return success(res, { members: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Give a user access to a branch (roam access, unlocked by default).
router.post('/:id/members', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { user_id } = req.body || {};
    if (!user_id) return error(res, 'user_id is required', 400);
    const s = await queryOne('SELECT id FROM client_schools WHERE id=? AND org_id=? AND status=\'active\'', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);
    const u = await queryOne('SELECT id FROM client_users WHERE id=? AND org_id=?', [user_id, o]);
    if (!u) return error(res, 'User not found', 404);
    await query('INSERT IGNORE INTO client_user_schools (org_id, user_id, school_id) VALUES (?,?,?)', [o, user_id, req.params.id]);
    return success(res, {}, 'Access granted');
  } catch (e) { return error(res, e.message, 500); }
});

// Lock / unlock a user to this branch. Locking BINDS them to only this institute
// (removes their other branch memberships) — the server then forces their scope.
router.patch('/:id/members/:userId', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { is_locked } = req.body || {};
    const s = await queryOne('SELECT id FROM client_schools WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);

    // An org owner must always roam — never bind them to a single branch.
    //
    // This read base_role only, and so never fired for a single real customer.
    // EVERY customer organisation is seeded with a role whose slug is literally
    // `owner` but whose base_role is `admin` — deliberately, so a school's owner
    // never carries a platform-level base_role (modules/owner/invoices.routes.js
    // leans on that same fact). `base_role === 'owner'` therefore matched only
    // WisWits' own org, and every customer's owner was lockable.
    //
    // It also looked at ONE role, `ORDER BY base_role LIMIT 1` — and 'admin'
    // sorts before 'owner', so a user holding both slipped through as well.
    //
    // Missing is not cosmetic here: locking is DESTRUCTIVE. The branch below
    // deletes every other membership the user has, so an owner who got locked
    // lost sight of every other campus they own, and undoing it means re-adding
    // those memberships by hand. Match on either half, across all their roles.
    const ownerRole = await queryOne(
      `SELECT 1 AS ok FROM client_user_roles ur JOIN client_roles ro ON ro.id=ur.role_id
        WHERE ur.user_id=? AND ur.org_id=? AND (ro.slug='owner' OR ro.base_role='owner')
        LIMIT 1`, [req.params.userId, o]);
    if (is_locked && ownerRole)
      return error(res, 'The organization owner cannot be locked to a single institute', 400);

    if (is_locked) {
      // bind: this becomes their ONLY branch, locked
      await query('DELETE FROM client_user_schools WHERE user_id=? AND org_id=? AND school_id<>?', [req.params.userId, o, req.params.id]);
      await query('INSERT INTO client_user_schools (org_id, user_id, school_id, is_locked) VALUES (?,?,?,1) ON DUPLICATE KEY UPDATE is_locked=1', [o, req.params.userId, req.params.id]);
      return success(res, {}, 'User bound to this institute');
    }
    await query('UPDATE client_user_schools SET is_locked=0 WHERE user_id=? AND org_id=? AND school_id=?', [req.params.userId, o, req.params.id]);
    return success(res, {}, 'User unbound (can roam if given access)');
  } catch (e) { return error(res, e.message, 500); }
});

// Remove a user's access to a branch.
router.delete('/:id/members/:userId', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const s = await queryOne('SELECT id, is_primary FROM client_schools WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);
    await query('DELETE FROM client_user_schools WHERE user_id=? AND org_id=? AND school_id=?', [req.params.userId, o, req.params.id]);
    return success(res, {}, 'Access removed');
  } catch (e) { return error(res, e.message, 500); }
});

// Add an institute under the org (the owner self-service ask)
router.post('/', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, type = 'school', code, address, phone, email } = req.body || {};
    if (!name || !name.trim()) return error(res, 'Institute name is required', 400);

    const r = await query(
      `INSERT INTO client_schools (org_id, name, type, code, address, phone, email, is_primary, status)
       VALUES (?,?,?,?,?,?,?,0,'active')`,
      [o, name.trim(), type || 'school', code || null, address || null, phone || null, email || null]);

    // org leadership can access every branch, so they can switch to the new one
    await query(
      `INSERT IGNORE INTO client_user_schools (org_id, user_id, school_id)
       SELECT DISTINCT u.org_id, u.id, ? FROM client_users u
       JOIN client_user_roles ur ON ur.user_id=u.id AND ur.org_id=u.org_id
       JOIN client_roles ro ON ro.id=ur.role_id
       WHERE u.org_id=? AND ro.base_role IN ('owner','admin','principal')`, [r.insertId, o]);
    // and always the creator
    await query('INSERT IGNORE INTO client_user_schools (org_id, user_id, school_id) VALUES (?,?,?)', [o, req.user.user_id, r.insertId]);

    // P2: seed this branch's terminology from its own type's blueprint, so a
    // coaching branch in a school group reads "Batch/Faculty" out of the box.
    try { await seedBranchLabels(o, r.insertId, type || 'school'); } catch { /* fail-soft */ }

    return success(res, { id: r.insertId }, 'Institute added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/:id', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const s = await queryOne('SELECT id FROM client_schools WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);
    const { name, type, code, address, phone, email, status } = req.body || {};
    await query(
      `UPDATE client_schools SET name=COALESCE(?,name), type=COALESCE(?,type), code=?, address=?, phone=?, email=?, status=COALESCE(?,status)
       WHERE id=? AND org_id=?`,
      [name || null, type || null, code || null, address || null, phone || null, email || null, status || null, req.params.id, o]);
    // P2: if the type changed, (re)seed this branch's terminology from the new
    // type's blueprint (INSERT IGNORE — never clobbers admin-customised labels).
    if (type) { try { await seedBranchLabels(o, Number(req.params.id), type); } catch { /* fail-soft */ } }
    return success(res, {}, 'Institute updated');
  } catch (e) { return error(res, e.message, 500); }
});

// Deactivate a branch (never the primary one)
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const o = req.user.org_id;
    const s = await queryOne('SELECT id, is_primary FROM client_schools WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!s) return error(res, 'Institute not found', 404);
    if (s.is_primary) return error(res, 'The primary institute cannot be removed', 400);
    await query("UPDATE client_schools SET status='inactive' WHERE id=? AND org_id=?", [req.params.id, o]);
    return success(res, {}, 'Institute deactivated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
