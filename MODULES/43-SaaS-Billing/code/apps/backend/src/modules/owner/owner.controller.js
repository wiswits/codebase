'use strict';

const db = require('../../config/db');
const { EMAIL_RE } = require('../../utils/validate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const orgHalt = require('../../utils/orgHalt');
const { audit } = require('../../utils/audit');
const { _helpers: onboardingHelpers } = require('../onboarding/onboarding.controller');

// ── GET /api/owner/stats ──────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const [[platform]] = await db.pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM client_organizations WHERE id != 1) total_orgs,
        (SELECT COUNT(*) FROM client_organizations WHERE id != 1 AND is_active = 1) active_orgs,
        (SELECT COUNT(*) FROM client_organizations WHERE id != 1 AND is_active = 0) suspended_orgs,
        (SELECT COUNT(*) FROM client_subscriptions WHERE status = 'trial') trial_orgs,
        (SELECT COUNT(*) FROM client_subscriptions WHERE status = 'active') paid_orgs,
        (SELECT COUNT(*) FROM client_users WHERE org_id != 1) total_users,
        (SELECT COUNT(*) FROM client_organizations WHERE id != 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) new_this_month,
        (SELECT COUNT(*) FROM client_organizations WHERE id != 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) new_this_week
    `);

    const [recentOrgs] = await db.pool.execute(`
      SELECT o.id, o.name, o.type, o.city, o.state, o.is_active, o.created_at,
             s.status sub_status, s.end_date trial_end,
             (SELECT COUNT(*) FROM client_users WHERE org_id = o.id) user_count
      FROM client_organizations o
      LEFT JOIN client_subscriptions s ON s.org_id = o.id
      WHERE o.id != 1
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return res.json({ success: true, stats: platform, recent_orgs: recentOrgs });
  } catch (err) {
    console.error('[owner.stats]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/tenants ────────────────────────────────────────────────────
exports.tenants = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE o.id != 1';
    const params = [];

    if (search) {
      where += ' AND (o.name LIKE ? OR o.org_code LIKE ? OR o.city LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') { where += ' AND o.is_active = 1'; }
    if (status === 'suspended') { where += ' AND o.is_active = 0'; }
    if (status === 'trial') { where += ' AND s.status = "trial"'; }

    const [orgs] = await db.pool.execute(`
      SELECT o.id, o.name, o.slug, o.org_code, o.type, o.city, o.state,
             o.is_active, o.created_at, o.phone,
             s.status sub_status, s.start_date, s.end_date, s.end_date AS trial_end,
             (SELECT COUNT(*) FROM client_users WHERE org_id = o.id) user_count,
             (SELECT COUNT(*) FROM client_students st JOIN client_users cu2 ON cu2.id = st.user_id
              WHERE st.org_id = o.id AND cu2.is_active = 1) student_count,
             (SELECT email FROM client_users cu
              JOIN client_user_roles cur ON cur.user_id = cu.id
              JOIN client_roles cr ON cr.id = cur.role_id
              WHERE cu.org_id = o.id AND cr.slug = 'admin' LIMIT 1) admin_email,
             (SELECT CONCAT(first_name, ' ', last_name) FROM client_users cu
              JOIN client_user_roles cur ON cur.user_id = cu.id
              JOIN client_roles cr ON cr.id = cur.role_id
              WHERE cu.org_id = o.id AND cr.slug = 'admin' LIMIT 1) admin_name
      FROM client_organizations o
      LEFT JOIN client_subscriptions s ON s.org_id = o.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);

    const [[{ total }]] = await db.pool.execute(
      `SELECT COUNT(*) as total FROM client_organizations o LEFT JOIN client_subscriptions s ON s.org_id = o.id ${where}`,
      params
    );

    return res.json({ success: true, orgs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('[owner.tenants]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/tenants/:id ────────────────────────────────────────────────
exports.tenantDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [[org]] = await db.pool.execute(`
      SELECT o.*, s.status sub_status, s.start_date, s.end_date,
             (SELECT COUNT(*) FROM client_users WHERE org_id = o.id) user_count,
             (SELECT COUNT(*) FROM client_students st JOIN client_users cu2 ON cu2.id = st.user_id
              WHERE st.org_id = o.id AND cu2.is_active = 1) student_count,
             (SELECT COUNT(*) FROM client_staff WHERE org_id = o.id) staff_count
      FROM client_organizations o
      LEFT JOIN client_subscriptions s ON s.org_id = o.id
      WHERE o.id = ? AND o.id != 1
    `, [id]);
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });

    const [users] = await db.pool.execute(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
             cr.name role_name, cr.slug role_slug
      FROM client_users u
      LEFT JOIN client_user_roles cur ON cur.user_id = u.id
      LEFT JOIN client_roles cr ON cr.id = cur.role_id
      WHERE u.org_id = ?
      ORDER BY cr.level ASC, u.created_at ASC
      LIMIT 50
    `, [id]);

    return res.json({ success: true, org, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/owner/tenants/:id ─────────────────────────────────────────────
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, name, city, state, phone } = req.body;
    if (id == 1) return res.status(403).json({ success: false, message: 'The platform organization cannot be modified' });

    if (action === 'activate') {
      await db.pool.execute('UPDATE client_organizations SET is_active = 1 WHERE id = ?', [id]);
      await orgHalt.resumeOrg(id);
      return res.json({ success: true, message: 'Organization activated' });
    }
    if (action === 'suspend') {
      await db.pool.execute('UPDATE client_organizations SET is_active = 0 WHERE id = ?', [id]);
      // Suspension takes effect on the suspended school's NEXT request, not when
      // their access token happens to expire (utils/orgHalt.js).
      await orgHalt.haltOrg(id);
      return res.json({ success: true, message: 'Organization suspended' });
    }
    if (action === 'edit') {
      await db.pool.execute(
        'UPDATE client_organizations SET name = ?, city = ?, state = ?, phone = ? WHERE id = ?',
        [name, city, state, phone, id]
      );
      return res.json({ success: true, message: 'Organization updated' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/owner/tenants/:id ────────────────────────────────────────────
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    if (id == 1) return res.status(403).json({ success: false, message: 'Cannot delete platform org' });

    // Full cascade in ONE transaction — a half-delete used to orphan students/
    // staff/fees/attendance rows under a dead org_id. Delete every org_id-scoped
    // table, children before parents, so nothing is left behind and a mid-way
    // failure rolls the whole thing back.
    let conn;
    try {
      conn = await db.pool.getConnection();
      await conn.beginTransaction();
      const del = async (sql) => { try { await conn.execute(sql, [id]); } catch (e) { if (e.code !== 'ER_NO_SUCH_TABLE') throw e; } };

      // membership / branch
      await del('DELETE FROM client_user_schools WHERE org_id = ?');
      await del('DELETE FROM client_schools WHERE org_id = ?');
      // academics + operations (leaf tables first)
      await del('DELETE FROM client_attendance_records WHERE org_id = ?');
      await del('DELETE FROM client_attendance_sessions WHERE org_id = ?');
      await del('DELETE FROM client_fee_payments WHERE org_id = ?');
      await del('DELETE FROM client_fee_assignments WHERE org_id = ?');
      await del('DELETE FROM client_fee_structures WHERE org_id = ?');
      await del('DELETE FROM client_enrollments WHERE org_id = ?');
      await del('DELETE FROM client_students WHERE org_id = ?');
      await del('DELETE FROM client_staff WHERE org_id = ?');
      await del('DELETE FROM client_sections WHERE org_id = ?');
      await del('DELETE FROM client_classes WHERE org_id = ?');
      await del('DELETE FROM academic_years WHERE org_id = ?');
      await del('DELETE FROM client_feature_flags WHERE org_id = ?');
      await del('DELETE FROM client_audit_logs WHERE org_id = ?');
      // identity + subscription (parents last)
      await conn.execute('DELETE FROM client_user_roles WHERE org_id = ?', [id]);
      await conn.execute('DELETE FROM client_users WHERE org_id = ?', [id]);
      await conn.execute('DELETE FROM client_roles WHERE org_id = ?', [id]);
      await conn.execute('DELETE FROM client_subscriptions WHERE org_id = ?', [id]);
      await conn.execute('DELETE FROM client_organizations WHERE id = ?', [id]);

      await conn.commit();
      return res.json({ success: true, message: 'Organization deleted permanently' });
    } catch (e) {
      if (conn) { try { await conn.rollback(); } catch (_) {} }
      throw e;
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('[owner.deleteTenant]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/leads — pre-launch registrations awaiting activation ──────
// Every inactive org (except platform #1) with its first registered contact.
// Junk can be deleted from the same screen via deleteTenant.
exports.leads = async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT o.id, o.name, o.type, o.city, o.state, o.org_code, o.created_at,
             u.email  AS admin_email,
             CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS admin_name,
             u.phone  AS admin_phone,
             (SELECT COUNT(*) FROM client_users cu WHERE cu.org_id=o.id) AS user_count
        FROM client_organizations o
        LEFT JOIN client_users u
          ON u.org_id=o.id
         AND u.id=(SELECT MIN(id) FROM client_users x WHERE x.org_id=o.id)
       WHERE o.is_active=0 AND o.id != 1
       ORDER BY o.created_at DESC`);
    return res.json({ success: true, leads: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/owner/leads/:id/activate ────────────────────────────────────────
// Sales flow: one click turns a parked registration into a live school —
// org active, all its users active, and (optionally) a fresh temp password for
// the admin so AK Sir can hand working credentials to the customer on the spot.
exports.activateLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id == 1) return res.status(403).json({ success: false, message: 'Cannot touch platform org' });
    const { reset_password } = req.body || {};

    const [[org]] = await db.pool.execute(
      'SELECT id, name, org_code FROM client_organizations WHERE id=?', [id]);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    await db.pool.execute('UPDATE client_organizations SET is_active=1 WHERE id=?', [id]);
    await db.pool.execute('UPDATE client_users SET is_active=1 WHERE org_id=?', [id]);
    await orgHalt.resumeOrg(id);

    const [[admin]] = await db.pool.execute(
      `SELECT u.id, u.email FROM client_users u WHERE u.org_id=? ORDER BY u.id ASC LIMIT 1`, [id]);

    let temp_password = null;
    if (reset_password && admin) {
      temp_password = 'WW-' + crypto.randomInt(100000, 999999) + '@' + org.org_code.slice(0, 4);
      await db.pool.execute('UPDATE client_users SET password_hash=? WHERE id=?',
        [await bcrypt.hash(temp_password, 12), admin.id]);
      // One of us just overwrote a customer's password. That has to be on the
      // record against THEIR org — audit() would stamp org 1 (ours), so the org
      // is passed explicitly. `by_platform` is the whole point of the row.
      // Built by hand rather than spread from req: `ip` is a getter on Express's
      // prototype, so {...req} silently drops it and the row loses the address.
      await audit(
        { user: { org_id: Number(id), user_id: req.user.user_id }, headers: req.headers, ip: req.ip },
        'PASSWORD_RESET', 'user', admin.id,
        { new_data: { by_platform: true, by_user_id: req.user.user_id, email: admin.email } });
    }

    await db.pool.execute(
      `INSERT INTO client_audit_logs (org_id, user_id, action, entity_type, ip_address)
       VALUES (?,?,?,?,?)`,
      [id, req.user.user_id, 'ORG_ACTIVATED', 'organization', req.ip]).catch(() => {});

    return res.json({
      success: true,
      message: `${org.name} is live — admin can log in now`,
      admin_email: admin?.email || null,
      temp_password,
      login_url: 'https://app.wiswits.com/login',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/owner/onboard — onboard a school at the sales desk ─────────────
// Same conventions as self-registration (onboarding.controller) but created
// ACTIVE immediately, with generated credentials returned ONCE for handover.
exports.onboardOrg = async (req, res) => {
  const { org_type = 'school', org_name, city = '', state = '', first_name, last_name = '', email, phone = '',
          designation = '', roles_needed = [], modules_disable = [] } = req.body || {};
  if (!org_name || !org_name.trim()) return res.status(422).json({ success: false, message: 'Institution name required' });
  if (!first_name || !first_name.trim()) return res.status(422).json({ success: false, message: 'Admin first name required' });
  if (!email || !EMAIL_RE.test(email)) return res.status(422).json({ success: false, message: 'Valid admin email required' });

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = org_name.trim();
  let conn;
  try {
    conn = await db.pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.execute('SELECT id FROM client_users WHERE email=? LIMIT 1', [cleanEmail]);
    if (existing.length) { await conn.rollback(); return res.status(409).json({ success: false, message: 'This email is already registered' }); }

    const slug = await onboardingHelpers.buildUniqueSlug(cleanName, conn);
    const org_code = onboardingHelpers.generateOrgCode(cleanName);

    const [orgResult] = await conn.execute(
      'INSERT INTO client_organizations (name, slug, org_code, type, city, state, logo_url, custom_domain, phone, country, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 1, NOW())',
      [cleanName, slug, org_code, org_type, city.trim(), state.trim(), phone.trim(), 'India']);
    const orgId = orgResult.insertId;

    // Institution Blueprint dispatch (Sprint A1) — same as self-onboarding:
    // org_type drives role names + labels + feature bundle; fail-soft to legacy.
    const blueprintSvc = require('../blueprints/blueprint.service');
    const blueprint = await blueprintSvc.getBlueprint(org_type);
    const roleDefs = blueprintSvc.roleDefsFor(blueprint);
    const roleIds = {};
    for (const role of roleDefs) {
      const [r] = await conn.execute(
        'INSERT INTO client_roles (org_id, name, slug, base_role, is_system, level, permissions, menu_config, dashboard_config, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [orgId, role.name, role.slug, role.base_role, role.is_system, role.level, role.permissions, '[]', '[]']);
      roleIds[role.slug] = r.insertId;
    }
    // WW-60: seed the academic year FIRST — the blueprint's starter classes read
    // it to set academic_year_id. It used to run at the very end of this function,
    // so every class this path created was born "not linked to a year".
    await onboardingHelpers.seedCurrentAcademicYear(conn, orgId);
    await blueprintSvc.seedOrgFromBlueprint(conn, orgId, blueprint);

    // Requirement-form extras (Onboarding Wizard v2):
    // (a) extra roles the school asked for (beyond the blueprint's standard 5)
    const EXTRA_ROLES = {
      principal:      { name: 'Principal',            level: 15, base: 'principal' },
      vice_principal: { name: 'Vice Principal',       level: 16, base: 'principal' },
      hod:            { name: 'HOD',                  level: 18, base: 'admin' },
      coordinator:    { name: 'Academic Coordinator', level: 20, base: 'admin' },
      accountant:     { name: 'Accountant',           level: 22, base: 'admin' },
      reception:      { name: 'Reception',            level: 24, base: 'admin' },
      librarian:      { name: 'Librarian',            level: 26, base: 'admin' },
    };
    for (const slug of (Array.isArray(roles_needed) ? roles_needed : [])) {
      const def = EXTRA_ROLES[slug];
      if (!def || roleIds[slug]) continue;
      try {
        const [r] = await conn.execute(
          'INSERT INTO client_roles (org_id, name, slug, base_role, level, permissions, menu_config, dashboard_config, is_custom) VALUES (?,?,?,?,?,?,?,?,0)',
          [orgId, def.name, slug, def.base, def.level, '["*"]', '[]', '[]']);
        roleIds[slug] = r.insertId;
      } catch {
        const [r] = await conn.execute(
          'INSERT INTO client_roles (org_id, name, slug, level, permissions, menu_config, dashboard_config, is_custom) VALUES (?,?,?,?,?,?,?,0)',
          [orgId, def.name, slug, def.level, '["*"]', '[]', '[]']);
        roleIds[slug] = r.insertId;
      }
    }
    // (b) modules the school did NOT take → disable via feature flags (patterns)
    for (const p of (Array.isArray(modules_disable) ? modules_disable : []).filter(Boolean)) {
      const [feats] = await conn.execute('SELECT feature_key FROM platform_features WHERE feature_key LIKE ?', [`%${p}%`]);
      for (const f of feats) {
        await conn.execute('INSERT IGNORE INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,0)', [orgId, f.feature_key]);
      }
    }

    const temp_password = 'WW-' + crypto.randomInt(100000, 999999) + '@' + org_code.slice(0, 4);
    const [userResult] = await conn.execute(
      'INSERT INTO client_users (org_id, email, password_hash, first_name, last_name, phone, designation, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())',
      [orgId, cleanEmail, await bcrypt.hash(temp_password, 12), first_name.trim(), last_name.trim(), phone.trim(), designation ? String(designation).trim() : null]);
    if (roleIds.admin) {
      // client_user_roles.org_id is NOT NULL — omitting it + INSERT IGNORE
      // silently drops the row, leaving the onboarded admin with NO role
      // ("awaiting activation" on login). Include org_id.
      await conn.execute('INSERT IGNORE INTO client_user_roles (org_id, user_id, role_id) VALUES (?, ?, ?)', [orgId, userResult.insertId, roleIds.admin]);
    }

    // ── TWO ONBOARDING DOORS MUST NOT GIVE TWO ANSWERS (KI-163) ──────────────
    // This used to be `let planId = 1` with a hunt for the slugs starter/trial/free.
    // Migration 031 retired `starter` — is_active = 0, price_floor NULL — so the hunt
    // still FOUND it and every school onboarded through this door landed on a plan
    // that prices at ₹0. Razorpay's minimum is ₹1, so their first mandate could never
    // be created: a school onboarded by us, unable to pay us, and nothing anywhere
    // said so. It was invisible because the flaw is a ZERO, not an error.
    //
    // `entryPlanFor` is what the self-serve /register door already calls. It reads the
    // ladder for THIS institution type, so a coaching centre gets the coaching entry
    // plan instead of a school one — the difference this door could not express at all
    // while the plan id was a constant.
    //
    // Read outside `conn` on purpose: it reads `client_subscription_plans`, which this
    // transaction never writes, so there is nothing to see-or-miss. It cannot return
    // null (it falls back to the cheapest active plan of any ladder — the KI-112 rule
    // that a failed signup is worse than a wrong-but-fixable plan), but if a database
    // with no active plan at all ever made it to, this refuses rather than writing a
    // plan_id that does not exist.
    const pricing = require('../../services/pricing');
    const entryPlan = await pricing.entryPlanFor(org_type).catch(() => null);
    if (!entryPlan) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'No subscription plan is available to start this school on. Set up the plans first.',
      });
    }
    const planId = entryPlan.id;
    const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14);
    await conn.execute(
      'INSERT INTO client_subscriptions (org_id, plan_id, status, start_date, end_date) VALUES (?, ?, ?, CURDATE(), ?)',
      [orgId, planId, 'trial', trialEnd.toISOString().split('T')[0]]);
    // (the academic year is seeded above, before the starter classes — WW-60)

    await conn.commit();
    await db.pool.execute(
      `INSERT INTO client_audit_logs (org_id, user_id, action, entity_type, ip_address)
       VALUES (?,?,?,?,?)`,
      [orgId, req.user.user_id, 'ORG_ONBOARDED', 'organization', req.ip]).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `${cleanName} onboarded — hand these credentials to the admin`,
      org: { id: orgId, name: cleanName, org_code, slug },
      admin_email: cleanEmail,
      temp_password,
      login_url: 'https://app.wiswits.com/login',
    });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('[owner.onboardOrg]', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// ── POST /api/owner/impersonate/:org_id ──────────────────────────────────────
// ── POST /api/owner/master-login — Secure org access via master password ────
exports.masterLogin = async (req, res) => {
  try {
    // SECURITY: master-login disabled until 2FA is built. Re-enable by setting MASTER_LOGIN_DISABLED=false
    if (process.env.MASTER_LOGIN_DISABLED === 'true') {
      return res.status(503).json({
        success: false,
        message: 'Master login temporarily disabled pending 2FA implementation',
        code: 'MASTER_LOGIN_DISABLED'
      });
    }

    const { org_id, master_password } = req.body;

    if (!org_id || !master_password) {
      return res.status(400).json({ success: false, message: 'org_id and master_password required' });
    }

    const expectedKey = process.env.MASTER_LOGIN_KEY;
    if (!expectedKey) {
      return res.status(500).json({ success: false, message: 'Master login not configured' });
    }
    if (master_password !== expectedKey) {
      return res.status(401).json({ success: false, message: 'Invalid master password' });
    }

    const [[org]] = await db.pool.execute(
      'SELECT * FROM client_organizations WHERE id = ? AND id != 1', [org_id]
    );
    if (!org) return res.status(404).json({ success: false, message: 'Org not found' });

    const [[adminUser]] = await db.pool.execute(`
      SELECT u.* FROM client_users u
      JOIN client_user_roles cur ON cur.user_id = u.id
      JOIN client_roles cr ON cr.id = cur.role_id
      WHERE u.org_id = ? AND cr.slug = 'admin'
      ORDER BY u.created_at ASC LIMIT 1
    `, [org_id]);

    if (!adminUser) return res.status(404).json({ success: false, message: 'No admin user found for this org' });
    if (adminUser.org_id !== parseInt(org_id)) return res.status(403).json({ success: false, message: 'Org ID mismatch' });

    // masterLogin is disabled at the guard above (MASTER_LOGIN_DISABLED). Reaching
    // here means the guard was bypassed — refuse to issue any token. Do NOT restore
    // token issuance without 2FA (the removed block minted an admin access_token).
    throw new Error('master-login token issuance is disabled — implement 2FA before re-enabling');
  } catch (err) {
    console.error('[owner.masterLogin]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ── POST /api/owner/end-impersonation ────────────────────────────────────────
exports.endImpersonation = async (req, res) => {
  try {
    // Explicit close. Sessions are also closed implicitly by inactivity (see
    // recordImpersonationActivity in middleware/tenant.js) — this just makes
    // "Exit impersonation" end the row exactly when it was clicked. Scoped to
    // the caller's own session so one admin can't close another's.
    const { log_id } = req.body;
    const actorId = req.user.user_id || req.user.id;
    if (log_id) {
      await db.pool.execute(`
        UPDATE impersonation_logs
        SET ended_at = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE id = ? AND impersonator_user_id = ?
      `, [log_id, actorId]);
    }
    return res.json({ success: true, message: 'Impersonation ended' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/impersonation-logs ────────────────────────────────────────
exports.impersonationLogs = async (req, res) => {
  try {
    const [logs] = await db.pool.execute(`
      SELECT il.*, o.name org_name, o.type org_type, o.city, o.state
      FROM impersonation_logs il
      LEFT JOIN client_organizations o ON o.id = il.target_org_id
      ORDER BY il.started_at DESC
      LIMIT 100
    `);
    // Status is derived, never stored. resolveTenant (middleware/tenant.js)
    // stamps ended_at on EVERY impersonated request, so ended_at is really
    // "last activity": a session touched within the idle window is still live,
    // anything older genuinely ended there. Rows that never got an ended_at at
    // all are pre-fix orphans (nothing used to close a session) — mark them
    // 'stale' rather than pretending they are active or zero-length.
    const IDLE_MS = 15 * 60 * 1000;
    const STALE_AFTER_MS = 4 * 3600 * 1000;
    const withStatus = logs.map(l => {
      if (l.ended_at) {
        const idleMs = Date.now() - new Date(l.ended_at).getTime();
        return { ...l, status: idleMs <= IDLE_MS ? 'active' : 'ended' };
      }
      const ageMs = Date.now() - new Date(l.started_at).getTime();
      return { ...l, status: ageMs > STALE_AFTER_MS ? 'stale' : 'active' };
    });
    return res.json({ success: true, logs: withStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/platform-users ────────────────────────────────────────────
exports.platformUsers = async (req, res) => {
  try {
    const { search, role, org_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE u.org_id != 1';
    const params = [];
    if (search) { where += ' AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (org_id) { where += ' AND u.org_id = ?'; params.push(org_id); }
    if (role) { where += ' AND EXISTS (SELECT 1 FROM client_user_roles cur2 JOIN client_roles cr2 ON cr2.id = cur2.role_id WHERE cur2.user_id = u.id AND cr2.slug = ?)'; params.push(role); }

    // One row per user — a multi-role user must NOT duplicate (rows then mismatch
    // the count). Roles are aggregated; the primary (lowest-level) role is shown.
    const [users] = await db.pool.execute(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at, u.org_id,
             o.name org_name, o.type org_type, o.city,
             SUBSTRING_INDEX(GROUP_CONCAT(cr.name ORDER BY cr.level ASC SEPARATOR '||'), '||', 1) role_name,
             SUBSTRING_INDEX(GROUP_CONCAT(cr.slug ORDER BY cr.level ASC SEPARATOR '||'), '||', 1) role_slug
      FROM client_users u
      LEFT JOIN client_organizations o ON o.id = u.org_id
      LEFT JOIN client_user_roles cur ON cur.user_id = u.id
      LEFT JOIN client_roles cr ON cr.id = cur.role_id
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `, params);

    const [[{ total }]] = await db.pool.execute(`SELECT COUNT(*) total FROM client_users u ${where}`, params);
    return res.json({ success: true, users, total });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/owner/revenue ───────────────────────────────────────────────────
exports.revenue = async (req, res) => {
  try {
    // Platform revenue = WisWits' subscription income. NOTE: client_payment_orders
    // is TENANT fee-collection (parent → school money), NOT ours — never sum it as
    // platform revenue. Org billing isn't charged yet (all orgs on trial), so MRR
    // is computed honestly from active subscriptions × their plan's monthly price
    // where a price exists (0 while everyone is on trial). No fabricated numbers.
    const [[rev]] = await db.pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM client_subscriptions WHERE status='active') active_subs,
        (SELECT COUNT(*) FROM client_subscriptions WHERE status='trial') trial_subs,
        (SELECT COUNT(*) FROM client_subscriptions WHERE status='active' AND start_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) new_paid_30d
    `);

    // ── MRR COMES FROM WHAT WE ACTUALLY BILL ────────────────────────────────
    // This used to be one SQL statement that INNER JOINed `pricing_plans` on the
    // plan slug. After the two ladders shipped, every real slug became
    // `school_core` / `coaching_pro` / … and NONE of them exist in that display
    // catalog — so the join matched no rows and MRR was a permanent ₹0. Not an
    // error, not caught by the try/catch: silently zero revenue forever, on the
    // one screen whose entire job is to say how much money is coming in.
    //
    // It was also reading the WRONG NUMBER even when slugs happened to match:
    // `pricing_plans.price_monthly` is marketing copy, and a per-student plan has
    // no single monthly price until you know the headcount.
    //
    // So it now walks the ACTIVE subscriptions and prices each one through
    // `services/pricing` — the same function, with the same student count, that
    // produces the invoice. If MRR and the invoice ever disagree again, it will
    // be because pricing itself changed, not because a second copy drifted.
    let mrr = 0;
    try {
      const pricing = require('../../services/pricing');
      const [subs] = await db.pool.execute(
        "SELECT org_id FROM client_subscriptions WHERE status='active'");
      for (const s of subs) {
        // ── THE FULL CHAIN, NOT JUST THE PLAN PRICE ─────────────────────────
        // This used to call `priceFor` directly, which knows only the plan's ladder.
        // The moment a customer had a negotiated price it would have reported the LIST
        // price as revenue — JD PUBLIC SCHOOL's pilot is ₹51,000 for the session, and
        // priceFor would have cheerfully reported their Complete list price instead.
        // Reporting revenue we are not collecting is the same class of wrong as
        // KI-120's ₹0, just in the flattering direction, which is worse: nobody
        // investigates a number that looks good.
        //
        // resolveForOrg is the one answer to "what does this org pay?" — override,
        // add-ons and coupon included.
        const r = await pricing.resolveForOrg(s.org_id);
        if (!r || r.custom) continue;

        // MONTHLY recurring, always. An annual payer still contributes monthly
        // revenue, so an annual total is divided back down rather than counted whole —
        // otherwise one annual customer inflates MRR by 10-12×.
        const months = r.cycle === 'annual'
          ? Number(r.plan.annualMonthsCharged || 10) || 10
          : 1;
        mrr += Number(r.payablePaise || 0) / 100 / months;
      }
    } catch (e) {
      // Falls back to 0 so the page still renders a number, but says so loudly in
      // the log — the failure mode this replaced was a zero nobody could tell
      // apart from "no revenue yet", and that must not come back.
      require('../../utils/logger').error(`owner: MRR calculation failed — ${e.message}`);
      mrr = 0;
    }

    // "Recent activity" = real subscription changes, not a fake payments feed.
    let recent = [];
    try {
      // WW-75: end_date is selected so this screen can describe a subscription the
      // same way Organizations and Renewal Pressure do. Without it the shared
      // describer can only say "Trial" where the others say "Trial · 245d left" —
      // a smaller disagreement than the one reported, and exactly the same kind.
      const [rows] = await db.pool.execute(`
        SELECT cs.id, o.name org_name, cs.status, cs.end_date,
               COALESCE(csp.name, cs.status) plan_name, cs.start_date
        FROM client_subscriptions cs
        JOIN client_organizations o ON o.id = cs.org_id AND o.id != 1
        LEFT JOIN client_subscription_plans csp ON csp.id = cs.plan_id
        ORDER BY cs.start_date DESC, cs.id DESC LIMIT 20`);
      recent = rows;
    } catch (_) {}

    return res.json({
      success: true,
      stats: {
        active_subs: rev.active_subs || 0,
        trial_subs: rev.trial_subs || 0,
        new_paid_30d: rev.new_paid_30d || 0,
        mrr,
      },
      billing_live: mrr > 0,
      recent,
    });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/owner/analytics ─────────────────────────────────────────────────
exports.analyticsData = async (req, res) => {
  try {
    const [growth] = await db.pool.execute(`
      SELECT DATE(created_at) day, COUNT(*) count
      FROM client_organizations
      WHERE id != 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY day ASC
    `);

    const [byType] = await db.pool.execute(`
      SELECT type, COUNT(*) count FROM client_organizations WHERE id != 1 GROUP BY type
    `);

    const [byState] = await db.pool.execute(`
      SELECT state, COUNT(*) count FROM client_organizations WHERE id != 1 GROUP BY state ORDER BY count DESC LIMIT 10
    `);

    return res.json({ success: true, growth, by_type: byType, by_state: byState });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/owner/renewal-pressure ──────────────────────────────────────────
/*
 * WHO IS KNOCKING ON A LOCKED DOOR (AK Sir, 28-Jul-2026).
 *
 * Every blocked sign-in has been writing LOGIN_BLOCKED_ORG_SUSPENDED to
 * client_audit_logs since KI-157 — org, user and IP. Nothing has ever READ it,
 * so the single most useful renewal signal we own has been accumulating unseen:
 * a school where forty people tried to sign in today is a school that wants its
 * account back, and that is a phone call worth making this afternoon.
 *
 * Deliberately built from the audit trail rather than a new table. The data is
 * already there, already tenant-stamped, already retained with everything else —
 * a second store would only be a second thing to keep correct.
 *
 * Read-only and cross-tenant, which is why it sits behind superAdminOnly
 * (platform ORG membership, not just a role name) like every other route here.
 */
exports.renewalPressure = async (req, res) => {
  try {
    // Bounded window, because the audit table is large and only recent knocking
    // means anything — a school that gave up in April is not today's call.
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
    const orgId = parseInt(req.query.org_id, 10) || null;

    const ACTION = 'LOGIN_BLOCKED_ORG_SUSPENDED';

    // Per school: how hard, how many different people, and how recently. This is
    // the list that gets worked top-down.
    //
    // Every aggregate is spelled out again in ORDER BY rather than referenced by
    // its alias — MariaDB rejects an aggregate alias there even though local
    // MySQL accepts it, and that divergence has bitten this repo before.
    const [orgs] = await db.pool.execute(`
      SELECT o.id                       org_id,
             o.name                     org_name,
             o.city, o.state, o.type,
             o.is_active,
             COUNT(*)                   attempts,
             COUNT(DISTINCT a.user_id)  people,
             MIN(a.created_at)          first_at,
             MAX(a.created_at)          last_at,
             s.status                   plan_status,
             s.end_date                 plan_end_date
        FROM client_audit_logs a
        JOIN client_organizations o ON o.id = a.org_id
        LEFT JOIN client_subscriptions s ON s.org_id = o.id
       WHERE a.action = ?
         AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY o.id, o.name, o.city, o.state, o.type, o.is_active, s.status, s.end_date
       ORDER BY MAX(a.created_at) DESC, COUNT(*) DESC
       LIMIT 200
    `, [ACTION, days]);

    // Per person, so a call can open with a name instead of a number. The role
    // matters most: a principal hammering the login screen is a decision-maker
    // asking to pay us; forty students is pressure ON that decision-maker.
    const params = [ACTION, days];
    let scope = '';
    if (orgId) { scope = ' AND a.org_id = ?'; params.push(orgId); }

    const [people] = await db.pool.execute(`
      SELECT a.org_id,
             o.name                     org_name,
             a.user_id,
             NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))), '') AS name,
             u.email, u.phone,
             r.slug                     role_slug,
             COUNT(*)                   attempts,
             MAX(a.created_at)          last_at,
             MAX(a.ip_address)          last_ip
        FROM client_audit_logs a
        JOIN client_organizations o ON o.id = a.org_id
        LEFT JOIN client_users u ON u.id = a.user_id
        LEFT JOIN client_user_roles ur ON ur.user_id = u.id
        LEFT JOIN client_roles r ON r.id = ur.role_id
       WHERE a.action = ?
         AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)${scope}
       GROUP BY a.org_id, o.name, a.user_id, u.first_name, u.last_name, u.email, u.phone, r.slug
       ORDER BY MAX(a.created_at) DESC, COUNT(*) DESC
       LIMIT 300
    `, params);

    const totals = {
      days,
      schools: orgs.length,
      attempts: orgs.reduce((n, o) => n + Number(o.attempts || 0), 0),
      people: people.length,
    };

    return res.json({ success: true, totals, orgs, people });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/owner/activity ──────────────────────────────────────────────────
/*
 * THE AUDIT TRAIL, FINALLY READABLE (AK Sir, 28-Jul-2026).
 *
 * client_audit_logs has been filling up for months with nothing that reads it.
 * Two questions get asked of it, so this answers both in one call:
 *   · "what is happening across the platform" — the feed, newest first
 *   · "which actions actually happen, and how often" — the rollup, which is what
 *     tells us a feature is never used, or that one school does ten times the
 *     volume of everyone else
 *
 * Filters are deliberately few. A search box over an audit table invites
 * free-text WHERE clauses and slow scans; org, action and a bounded day window
 * answer nearly every real question and all three hit indexed columns or a small
 * enum-like set.
 *
 * Cross-tenant, so superAdminOnly (platform ORG membership) applies as it does to
 * every other route in this file. Read-only — nothing here can change a record.
 */
exports.activity = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const orgId = parseInt(req.query.org_id, 10) || null;
    const action = String(req.query.action || '').trim().toUpperCase().slice(0, 100) || null;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);

    const where = ['a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)'];
    const params = [days];
    if (orgId) { where.push('a.org_id = ?'); params.push(orgId); }
    // Exact match, never LIKE: action is a controlled vocabulary written by our own
    // code, so a prefix search would only ever return surprises.
    if (action) { where.push('a.action = ?'); params.push(action); }
    const clause = where.join(' AND ');

    // The feed. `old_data`/`new_data` are deliberately NOT selected — they can be
    // 60KB each and hold student names and fee amounts. A list does not need them;
    // if a detail view is ever built it can fetch one row on demand.
    const [events] = await db.pool.execute(`
      SELECT a.id, a.org_id, o.name org_name, a.user_id,
             NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))), '') AS user_name,
             u.email user_email, r.slug role_slug,
             a.action, a.entity_type, a.entity_id, a.ip_address, a.created_at
        FROM client_audit_logs a
        LEFT JOIN client_organizations o ON o.id = a.org_id
        LEFT JOIN client_users u ON u.id = a.user_id
        LEFT JOIN client_user_roles ur ON ur.user_id = u.id
        LEFT JOIN client_roles r ON r.id = ur.role_id
       WHERE ${clause}
       ORDER BY a.id DESC
       LIMIT ${limit}
    `, params);

    // What happens, how much, and when it last happened. Ordered by volume with
    // the aggregate written out again — MariaDB will not take the alias here.
    const [byAction] = await db.pool.execute(`
      SELECT a.action, COUNT(*) total, COUNT(DISTINCT a.org_id) orgs, MAX(a.created_at) last_at
        FROM client_audit_logs a
       WHERE ${clause}
       GROUP BY a.action
       ORDER BY COUNT(*) DESC
       LIMIT 100
    `, params);

    // Busiest schools in the window — the "who is actually using the product"
    // number, which is the one that tells us where to look next.
    const [byOrg] = await db.pool.execute(`
      SELECT a.org_id, o.name org_name, COUNT(*) total,
             COUNT(DISTINCT a.user_id) users, MAX(a.created_at) last_at
        FROM client_audit_logs a
        LEFT JOIN client_organizations o ON o.id = a.org_id
       WHERE ${clause}
       GROUP BY a.org_id, o.name
       ORDER BY COUNT(*) DESC
       LIMIT 50
    `, params);

    return res.json({
      success: true,
      window: { days, org_id: orgId, action },
      totals: { events: events.length, actions: byAction.length, orgs: byOrg.length },
      events, by_action: byAction, by_org: byOrg,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
