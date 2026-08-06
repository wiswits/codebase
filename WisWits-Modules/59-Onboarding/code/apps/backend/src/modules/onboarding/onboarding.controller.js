'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateTokenPair } = require('../../core/auth/jwt');
const db = require('../../config/db');
const { EMAIL_RE } = require('../../utils/validate');
const nodemailer = require('nodemailer');
const blueprintSvc = require('../blueprints/blueprint.service');

function generateOrgCode(name) {
  const year = new Date().getFullYear();
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'ORG';
  return letters + year;
}

async function buildUniqueSlug(name, conn) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const [rows] = await conn.execute('SELECT slug FROM client_organizations WHERE slug LIKE ? LIMIT 20', [base + '%']);
  const taken = new Set(rows.map(r => r.slug));
  if (!taken.has(base)) return base;
  let c;
  do { c = base + '-' + Math.random().toString(16).slice(2, 6); } while (taken.has(c));
  return c;
}

function currentAcademicYear() {
  const now = new Date();
  const yr = now.getFullYear();
  const start = (now.getMonth() + 1) >= 4 ? yr : yr - 1;
  return start + '-' + String(start + 1).slice(-2);
}

/* Seed the org's first academic year and mark it current.
 *
 * ROOT-CAUSE FIX (QA r3: "No active year set" / class cards showing "No year"):
 * this INSERT used to name a column that does not exist (`is_active` — the table's
 * flag is `is_current`) and omitted `start_date`/`end_date`, which are NOT NULL with
 * no default. It therefore threw on EVERY signup, and the surrounding `catch (_) {}`
 * swallowed it silently — so every new org started with ZERO academic years, and
 * every class created afterwards fell back to academic_year_id = NULL.
 * Failure is now logged instead of vanishing; onboarding still must not hard-fail
 * on it, so it stays non-fatal.
 */
async function seedCurrentAcademicYear(conn, orgId) {
  const now = new Date();
  const startYr = (now.getMonth() + 1) >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  try {
    await conn.execute(
      'INSERT INTO academic_years (org_id, name, start_date, end_date, is_current, status, created_at) VALUES (?, ?, ?, ?, 1, ?, NOW())',
      [orgId, currentAcademicYear(), `${startYr}-04-01`, `${startYr + 1}-03-31`, 'active']
    );
  } catch (e) {
    console.error('[ONBOARDING] academic year seed failed for org ' + orgId + ':', e.message);
  }
}

// Shared with owner onboarding (owner.controller.onboardOrg) — same org-code/
// slug/academic-year conventions everywhere.
exports._helpers = { generateOrgCode, buildUniqueSlug, currentAcademicYear, seedCurrentAcademicYear };

exports.registerOrg = async (req, res) => {
  const { org_type, org_name, city, state, website, first_name, last_name, email, phone, designation, password, confirm_password, agree_terms } = req.body;

  const errors = {};
  // Single + group variants: school/multi_branch, coaching/group_inst,
  // college/group_college, university/group_university — the full education range.
  const VALID = ['school','coaching','multi_branch','group_inst','college','group_college','university','group_university','tuition'];
  if (!org_type || !VALID.includes(org_type)) errors.org_type = 'Please select a valid institution type.';
  if (!org_name || org_name.trim().length < 2) errors.org_name = 'Institution name is required.';
  if (!city || !city.trim()) errors.city = 'City is required.';
  if (!state || !state.trim()) errors.state = 'State is required.';
  if (!first_name || !first_name.trim()) errors.first_name = 'First name is required.';
  if (!last_name || !last_name.trim()) errors.last_name = 'Last name is required.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Valid email is required.';
  if (!phone || phone.trim().length < 7) errors.phone = 'Valid phone number is required.';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password !== confirm_password) errors.confirm_password = 'Passwords do not match.';
  if (!agree_terms) errors.agree_terms = 'You must accept the terms.';
  if (Object.keys(errors).length) return res.status(422).json({ success: false, errors });

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = org_name.trim();
  let conn;
  try {
    conn = await db.pool.getConnection();
    await conn.beginTransaction();

    const [existing] = await conn.execute('SELECT id FROM client_users WHERE email = ? LIMIT 1', [cleanEmail]);
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ success: false, errors: { email: 'This email is already registered.' } });
    }

    const slug = await buildUniqueSlug(cleanName, conn);
    const org_code = generateOrgCode(cleanName);

    const [orgResult] = await conn.execute(
      'INSERT INTO client_organizations (name, slug, org_code, type, city, state, logo_url, custom_domain, phone, country, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 1, NOW())',
      [cleanName, slug, org_code, org_type, city.trim(), state.trim(), website ? website.trim() : null, phone.trim(), 'India']
    );
    const orgId = orgResult.insertId;

    // ── INSTITUTION BLUEPRINT DISPATCH (Sprint A1, SUG-0074 P0) ─────────────
    // org_type drives seeded role names, terminology labels and the feature
    // bundle. Fail-soft: no blueprint → identical legacy school defaults.
    const blueprint = await blueprintSvc.getBlueprint(org_type);
    const roleDefs = blueprintSvc.roleDefsFor(blueprint);
    const roleIds = {};
    for (const role of roleDefs) {
      const [r] = await conn.execute(
        'INSERT INTO client_roles (org_id, name, slug, base_role, is_system, level, permissions, menu_config, dashboard_config, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [orgId, role.name, role.slug, role.base_role, role.is_system, role.level, role.permissions, '[]', '[]']
      );
      roleIds[role.slug] = r.insertId;
    }
    // WW-60: the academic year MUST exist before the blueprint seeds the starter
    // classes — seedStarterStructure reads it to stamp academic_year_id on each
    // one. It used to run ~70 lines further down, after the classes were already
    // written, so every seeded class started life linked to no year at all.
    await seedCurrentAcademicYear(conn, orgId);
    await blueprintSvc.seedOrgFromBlueprint(conn, orgId, blueprint);

    // PRE-LAUNCH MODE: until WISWITS_LAUNCHED=true is set in the server env,
    // self-registrations are captured as leads — org + admin are created but
    // INACTIVE (can't log in), and the client shows a "Launching soon" screen.
    // Flip the env var at launch; every reserved org can then be activated.
    const PRELAUNCH = process.env.WISWITS_LAUNCHED !== 'true';

    const password_hash = await bcrypt.hash(password, 12);
    const [userResult] = await conn.execute(
      `INSERT INTO client_users (org_id, email, password_hash, first_name, last_name, phone, designation, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ${PRELAUNCH ? 0 : 1}, NOW())`,
      [orgId, cleanEmail, password_hash, first_name.trim(), last_name.trim(), phone.trim(), designation ? designation.trim() : null]
    );
    const userId = userResult.insertId;

    if (roleIds.admin) {
      // client_user_roles.org_id is NOT NULL — omitting it + INSERT IGNORE
      // silently drops the row, leaving the admin with NO role ("awaiting
      // activation" on login). Include org_id.
      await conn.execute('INSERT IGNORE INTO client_user_roles (org_id, user_id, role_id) VALUES (?, ?, ?)', [orgId, userId, roleIds.admin]);
    }

    // Trial subscription. plan_id used to default to a hardcoded 1, which is a
    // magic id that happens to be right on production and is wrong everywhere
    // else: on staging the plans table is empty, so the FK on client_subscriptions
    // failed and the ENTIRE registration was rolled back — every prospect got
    // "Registration failed. Please try again or contact support." Resolve a real
    // plan instead, preferring an entry-level slug and otherwise taking the
    // cheapest/lowest plan that exists.
    // SESSION 3: the plan must come from the RIGHT LADDER. There are two pricing
    // models, not two price points — schools/colleges/universities bill per student,
    // coaching/tuition bill flat by cap. Landing a 1,200-student school on the ₹499
    // coaching plan (or a 30-student tuition centre on a per-student plan with a
    // ₹999 floor) is not a rounding error, it is the wrong product. `institution_types`
    // on each plan row decides, so the wizard's answer picks the ladder.
    let planId = null;
    try {
      const [laddered] = await conn.execute(
        `SELECT id FROM client_subscription_plans
          WHERE is_active = 1 AND is_custom = 0
            AND JSON_CONTAINS(institution_types, JSON_QUOTE(?))
          ORDER BY sort_order, id LIMIT 1`, [org_type]);
      if (laddered.length) planId = laddered[0].id;
    } catch (_) { /* pre-031 schema (no institution_types column) → fall through */ }

    if (planId === null) {
      // Fallbacks, in order, because a signup must NEVER fail for want of a plan —
      // that was KI-112, which returned "Registration failed" to 100% of prospects.
      try {
        const [preferred] = await conn.execute(
          'SELECT id FROM client_subscription_plans WHERE slug IN (?, ?, ?) ORDER BY id LIMIT 1',
          ['starter', 'trial', 'free']);
        if (preferred.length) planId = preferred[0].id;
        else {
          const [any] = await conn.execute('SELECT id FROM client_subscription_plans ORDER BY id LIMIT 1');
          if (any.length) planId = any[0].id;
        }
      } catch (_) { /* table variant — treated as "no plans" below */ }
    }

    // No plans configured at all: skip the row rather than fail the signup. An
    // org without a subscription record is a one-line fix later; a customer who
    // could not register is gone.
    if (planId !== null) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      await conn.execute(
        'INSERT INTO client_subscriptions (org_id, plan_id, status, start_date, end_date) VALUES (?, ?, ?, CURDATE(), ?)',
        [orgId, planId, 'trial', trialEnd.toISOString().split('T')[0]]
      );
    } else {
      console.warn('[ONBOARDING] no subscription plans configured — org ' + orgId + ' registered without a trial row');
    }

    // (the academic year is seeded above, before the starter classes — WW-60)

    // Pre-launch: park the org too (nothing about it is reachable until launch)
    if (PRELAUNCH) {
      await conn.execute('UPDATE client_organizations SET is_active=0 WHERE id=?', [orgId]);
    }

    await conn.commit();

    if (PRELAUNCH) {
      console.log('[ONBOARDING] PRE-LAUNCH lead captured: org ' + org_code + ' / ' + cleanEmail);
      return res.status(201).json({
        success: true,
        prelaunch: true,
        message: 'Registration saved — WisWits is launching soon.',
      });
    }

    const { accessToken: access_token } = generateTokenPair({
      id: userId,
      org_id: orgId,
      email: cleanEmail,
      role_slug: 'admin'
    });

    console.log('[ONBOARDING] Created org ' + org_code + ' for ' + cleanEmail);
// Send welcome email (async, don't block response)
    try {
      const { sendWelcomeEmail } = require('../../utils/email');
      const trialEndDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      sendWelcomeEmail({
        to: cleanEmail,
        first_name: first_name.trim(),
        org_name: cleanName,
        org_code,
        email: cleanEmail,
        trial_end: trialEndDate,
      }).catch(e => console.error('[welcome email]', e.message));
    } catch (e) { console.error('[welcome email init]', e.message); }

    return res.status(201).json({
      success: true,
      access_token,
      user: { id: userId, email: cleanEmail, first_name: first_name.trim(), last_name: last_name.trim(), role: 'admin' },
      org: { id: orgId, name: cleanName, slug, org_code, type: org_type },
      redirect_url: '/admin'
    });

  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('[registerOrg]', err);
    // Never leak raw SQL/internal errors to the client in production.
    const payload = { success: false, message: 'Registration failed. Please try again or contact support.' };
    if (process.env.NODE_ENV !== 'production') payload.debug = err.message;
    return res.status(500).json(payload);
  } finally {
    if (conn) conn.release();
  }
};

exports.checkEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ available: false });
  try {
    const [rows] = await db.pool.execute('SELECT id FROM client_users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    return res.json({ available: rows.length === 0 });
  } catch (err) {
    return res.status(500).json({ available: false });
  }
};

// Public, pre-signup preview of what an institution TYPE gets — the "it already
// knows my institution" moment for the onboarding wizard (T2.6 Phase D). Read-only,
// no writes, no auth: terminology + starter custom fields + grading, straight from
// the blueprint. Fail-soft to a neutral school-ish default so the wizard never breaks.
const GRADING_LABELS = {
  percentage_band: 'Percentage bands (A+/A/B…)',
  gpa_10: 'GPA (10-point)',
  gpa_4: 'GPA (4.0 scale)',
  pass_fail: 'Pass / Fail',
  credits: 'Credit-based',
};
exports.blueprintPreview = async (req, res) => {
  try {
    const type = String(req.query.type || 'school').toLowerCase().trim();
    const bp = await blueprintSvc.getBlueprint(type);
    if (!bp) return res.json({ type, name: null, terminology: {}, fields: { student: [], staff: [] }, grading_mode: null, grading_label: null });
    const fs = bp.field_sets || {};
    const shape = (arr) => (Array.isArray(arr) ? arr : []).map((d) => ({ label: d.label || d.field_key, data_type: d.data_type || 'text' }));
    return res.json({
      type: bp.type,
      name: bp.name,
      terminology: bp.labels || {},
      fields: { student: shape(fs.student), staff: shape(fs.staff) },
      grading_mode: bp.grading_mode || null,
      grading_label: GRADING_LABELS[bp.grading_mode] || bp.grading_mode || null,
    });
  } catch (err) {
    return res.status(200).json({ type: req.query.type || null, terminology: {}, fields: { student: [], staff: [] }, grading_mode: null, grading_label: null });
  }
};

exports.trialStatus = async (req, res) => {
  // Use the authenticated user's org — never a client-supplied org_id (was IDOR
  // exposing any tenant's subscription).
  const org_id = req.user?.org_id;
  if (!org_id) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const [rows] = await db.pool.execute('SELECT * FROM client_subscriptions WHERE org_id = ? ORDER BY created_at DESC LIMIT 1', [org_id]);
    return res.json(rows[0] || { status: 'none' });
  } catch (err) {
    return res.status(500).json({ message: 'Error' });
  }
};

exports.onboardingProgress = async (req, res) => res.json({ step: 1, total: 3 });

/**
 * Pincode → city + state, for the first field of the signup wizard.
 *
 * The register page used to fetch api.postalpincode.in straight from the
 * browser. That works locally and is blocked on production, because the CSP
 * `connect-src` only allows *.wiswits.com and Razorpay — so the fetch threw,
 * the catch marked the pincode invalid, and a brand-new customer's very first
 * field showed a red ✗ "Invalid pincode" on a perfectly valid pincode, with no
 * auto-fill. Verified on app.wiswits.com with 301404 (WisWits' own pincode).
 *
 * Wrapping it here is also what §12's integration policy requires: an external
 * service is never consumed directly by the frontend. Doing it server-side
 * fixes the CSP problem without widening the CSP.
 *
 * Public and read-only — it is needed before an account exists. Fails soft:
 * if the upstream is down or slow, the wizard just asks the user to type the
 * city and state themselves rather than blocking signup on a third party.
 */
exports.lookupPincode = async (req, res) => {
  const pincode = String(req.query.pincode || '').trim();
  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ found: false, message: 'A 6-digit pincode is required' });
  }
  try {
    // Signup must never hang on a third party — give up quickly and let the
    // user type it in.
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: ctl.signal })
      .finally(() => clearTimeout(timer));
    if (!r.ok) return res.json({ found: false });

    const body = await r.json();
    const first = Array.isArray(body) ? body[0] : null;
    const po = first && first.Status === 'Success' && Array.isArray(first.PostOffice) ? first.PostOffice[0] : null;
    if (!po) return res.json({ found: false });

    // District is the city a school would actually write on a letterhead;
    // the post-office Name is often a village inside it.
    return res.json({ found: true, city: po.District || po.Name || '', state: po.State || '' });
  } catch (err) {
    return res.json({ found: false });
  }
};
