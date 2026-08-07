/*
 * Institution Blueprint service (Sprint A1). org_type is a DISPATCH KEY:
 * onboarding calls getBlueprint(type) then seedOrgFromBlueprint(conn, orgId, bp)
 * inside its transaction. Fail-soft everywhere — if the blueprint table is
 * missing or a row is absent, onboarding proceeds exactly as before (school
 * defaults), so the platform stays sellable during rollout.
 */
'use strict';
const db = require('../../config/db');
const customFields = require('../custom-fields/customFields.service');

// `events.view` is on Teacher, Student and Parent because Events is in all three
// sidebars with no `soon` flag — a role that can see the menu item and gets 403
// on opening it is worse than not having the menu item.
//
// It was missing from all three, and that is the point worth remembering:
// migration 025 granted `events.view` to student/parent as a DATA patch and
// never touched this template. So every org created after 025 was born with the
// bug the migration had just fixed, and the migration could not be re-run to
// catch them. Found on 2026-08-03 in a production log line — JD Public School's
// 19 teachers had been getting `RBAC deny: user 322 lacks 'events.view'` on
// every Events page load, silently, since the school went live.
//
// The rule: a permission granted by migration must also be added HERE, or the
// fix only covers the orgs that already existed. Patch the data AND the mould.
const DEFAULT_ROLES = [
  { name: 'Owner',   slug: 'owner',   level: 1,  permissions: ['*'] },
  { name: 'Admin',   slug: 'admin',   level: 10, permissions: ['*'] },
  { name: 'Teacher', slug: 'teacher', level: 30, permissions: ['students.view','attendance.*','fees.view','classes.view','quizzes.*','assignments.*','worksheets.*','content.view','timetable.view','reports.view','events.view'] },
  { name: 'Student', slug: 'student', level: 50, permissions: ['lessons.view','fees.view','attendance.view','events.view'] },
  { name: 'Parent',  slug: 'parent',  level: 60, permissions: ['students.view','fees.view','attendance.view','events.view'] },
];

// Every institution needs leave types on day one, else the Leave form is empty.
const DEFAULT_LEAVE_TYPES = [
  ['sick',      'Sick Leave',         'both',    10, 1, '#EF4444', 'Thermometer'],
  ['casual',    'Casual Leave',       'both',    10, 0, '#3B82F6', 'Coffee'],
  ['family',    'Family Emergency',   'both',     0, 0, '#F59E0B', 'Heart'],
  ['medical',   'Medical Leave',      'student',  0, 1, '#EC4899', 'Cross'],
  ['festival',  'Festival/Religious', 'both',     0, 0, '#8B5CF6', 'Sparkles'],
  ['exam_prep', 'Exam Preparation',   'student',  0, 0, '#10B981', 'BookOpen'],
  ['earned',    'Earned Leave (EL)',  'staff',   15, 0, '#06B6D4', 'Star'],
  ['other',     'Other',              'both',     0, 0, '#6B7280', 'Calendar'],
];
async function seedLeaveTypes(conn, orgId) {
  try {
    const [ex] = await conn.execute('SELECT COUNT(*) AS n FROM client_leave_types WHERE org_id=?', [orgId]);
    if (ex[0] && ex[0].n > 0) return;
    let i = 0;
    for (const [slug, name, applies, quota, doc, color, icon] of DEFAULT_LEAVE_TYPES) {
      await conn.execute(
        `INSERT INTO client_leave_types (org_id, slug, name, applies_to, annual_quota, requires_document, color, icon, is_active, sort_order)
         VALUES (?,?,?,?,?,?,?,?,1,?)`, [orgId, slug, name, applies, quota, doc, color, icon, ++i]);
    }
  } catch { /* table variant — skip */ }
}

/*
 * KI-137. `helpdesk_widget` is OFF unless a client_feature_flags row says
 * otherwise (helpdesk.service.widgetEnabled: "Absent flag row = off"), and
 * nothing at signup ever created that row. JD PUBLIC SCHOOL — our first real
 * customer — only filed 9 tickets because the flag was switched on BY HAND
 * after they registered. Every school onboarded before that had no way to tell
 * us anything was wrong, and we had no way to find out.
 *
 * So: every new tenant gets the support channel on, from the first minute.
 *
 * Deliberately seeded BEFORE the `!blueprint` early return and BEFORE the
 * blueprint's features.disable pass, for two reasons:
 *   - an org whose type has no blueprint row still gets a voice;
 *   - no blueprint pattern (and no owner.onboard `modules_disable` pattern,
 *     which runs later and also uses INSERT IGNORE) can accidentally turn the
 *     support channel off. "This institution cannot report bugs" must never be
 *     something a packaging decision does by accident.
 * Turning it off stays possible on purpose, via the explicit per-org control:
 * POST /api/helpdesk/admin/orgs/:orgId/widget.
 *
 * INSERT IGNORE against UNIQUE(org_id, feature_key): idempotent, and never
 * overwrites a deliberate later choice. Fail-soft like its neighbours — a
 * missing flags table must not cost us a registration.
 */
async function seedSupportChannel(conn, orgId) {
  try {
    await conn.execute(
      'INSERT IGNORE INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,1)',
      [orgId, 'helpdesk_widget']);
  } catch { /* flags table variant — onboarding proceeds */ }
}

const parse = (v, fb) => {
  if (v == null) return fb;
  if (typeof v === 'object') return v;           // mysql2 may return parsed JSON
  try { const p = JSON.parse(v); return p == null ? fb : p; } catch { return fb; }
};

// Blueprint for an org_type — null if none (caller falls back to defaults).
async function getBlueprint(orgType) {
  try {
    const [rows] = await db.pool.execute(
      'SELECT * FROM platform_institution_blueprints WHERE type=? AND is_active=1 LIMIT 1', [orgType]);
    if (!rows.length) return null;
    const bp = rows[0];
    return {
      type: bp.type,
      name: bp.name,
      labels: parse(bp.labels, {}),
      roles: parse(bp.roles, null) || DEFAULT_ROLES,
      features: parse(bp.features, {}),
      grading_mode: bp.grading_mode || 'percentage_band',
      // T2.6: per-entity starter custom-field sets, seeded at onboard
      field_sets: parse(bp.field_sets_json, {}),
      // 028: first branch + classes + sections + subjects, so day one is not empty
      starter_structure: parse(bp.starter_structure_json, null),
    };
  } catch { return null; } // table absent → legacy behavior
}

// Role defs to seed for this type (always includes the 5 standard slugs).
function roleDefsFor(blueprint) {
  const roles = (blueprint && Array.isArray(blueprint.roles) && blueprint.roles.length)
    ? blueprint.roles : DEFAULT_ROLES;
  // Safety: slugs are the RBAC contract — ensure the 5 standard ones exist.
  const bySlug = Object.fromEntries(roles.map(r => [r.slug, r]));
  for (const d of DEFAULT_ROLES) if (!bySlug[d.slug]) roles.push(d);
  // base_role + is_system are REQUIRED downstream: the whole product looks up
  // roles by base_role (teacher/student/parent creation, counts, CRM) and
  // teacher-create needs a system role. Any custom slug falls back to 'admin'
  // so the insert never truncates. teacher/student/parent MUST map to their own
  // slug so the product's base_role lookups (teacher/parent creation) work.
  //
  // ⚠️ NOTE (2026-07-22): this list is DELIBERATELY still the narrow set, even
  // though migration 016_widen_role_base_role_enum.js has widened the
  // client_roles.base_role ENUM to also accept principal/coordinator/accountant/
  // staff. Widening it HERE is a behavior change, not a bug fix: 'coordinator',
  // 'accountant' and 'staff' are NOT in rbac.js DEFAULT_ELEVATED, so seeded roles
  // that currently auto-pass every permission check (via base_role='admin') would
  // suddenly become permission-gated and could lose access mid-session.
  // → Needs AK Sir's explicit decision + a staged rollout. Do not "tidy" this.
  const VALID_BASE = new Set(['admin', 'teacher', 'student', 'parent']);
  const baseFor = (r) => VALID_BASE.has(r.base_role) ? r.base_role : (VALID_BASE.has(r.slug) ? r.slug : 'admin');
  return roles.map(r => ({
    name: r.name, slug: r.slug, level: r.level ?? 40,
    base_role: baseFor(r), is_system: 1,
    permissions: JSON.stringify(Array.isArray(r.permissions) ? r.permissions : parse(r.permissions, ['*'])),
  }));
}

// After the org row exists (same transaction): seed labels + feature bundle +
// default leave types (leave types are institution-agnostic, seeded for ALL).
async function seedOrgFromBlueprint(conn, orgId, blueprint) {
  await seedLeaveTypes(conn, orgId);
  await seedSupportChannel(conn, orgId);
  if (!blueprint) return;
  // (a) Terminology labels
  try {
    for (const [canonical, display] of Object.entries(blueprint.labels || {})) {
      if (!canonical || !display) continue;
      await conn.execute(
        'INSERT IGNORE INTO client_labels (org_id, canonical, display) VALUES (?,?,?)',
        [orgId, String(canonical).slice(0, 64), String(display).slice(0, 64)]);
    }
  } catch { /* labels table absent — skip */ }
  // (b) Feature bundle: disable features whose key matches any pattern
  try {
    const patterns = (blueprint.features && Array.isArray(blueprint.features.disable))
      ? blueprint.features.disable.filter(Boolean) : [];
    for (const p of patterns) {
      const [feats] = await conn.execute(
        'SELECT feature_key FROM platform_features WHERE feature_key LIKE ?', [`%${p}%`]);
      for (const f of feats) {
        await conn.execute(
          'INSERT IGNORE INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,0)',
          [orgId, f.feature_key]);
      }
    }
  } catch { /* flags table variant — skip */ }
  // (c) T2.6: seed this institution type's starter custom fields (is_system).
  // Fail-soft + same transaction. One call wires BOTH onboard paths (register-org
  // + owner.onboard) because both go through seedOrgFromBlueprint.
  try {
    await customFields.seedFromBlueprint(conn, orgId, blueprint.field_sets || {});
  } catch { /* field engine absent / bad set — onboarding proceeds */ }
  // (d) Starter academic structure — see seedStarterStructure.
  await seedStarterStructure(conn, orgId, blueprint);
}

/**
 * Give a brand-new tenant a first branch, classes, sections and subjects.
 *
 * Without this a signup scored 1/45 on demo_coverage — "SPINE GAPS — most pages
 * will look broken". An empty product and a broken product look identical to
 * someone opening it for the first time, and they will not give us a second
 * look to tell them apart.
 *
 * What it seeds comes from the blueprint (`starter_structure_json`, migration
 * 028), so "what a coaching institute starts with" is configuration, not code —
 * same as labels, roles and field sets above.
 *
 * Idempotent: skips entirely if the org already has any class, so re-running
 * onboarding logic can never double up. Fail-soft: a missing column or table
 * leaves the org exactly as before rather than failing the signup — a tenant
 * with no starter classes is recoverable, a tenant that could not register is
 * a lost customer.
 */
async function seedStarterStructure(conn, orgId, blueprint) {
  try {
    const s = blueprint && blueprint.starter_structure;
    if (!s || !Array.isArray(s.classes) || !s.classes.length) return;

    const [existing] = await conn.execute('SELECT COUNT(*) AS n FROM client_classes WHERE org_id=?', [orgId]);
    if (existing[0] && existing[0].n > 0) return;

    const [org] = await conn.execute('SELECT name FROM client_organizations WHERE id=?', [orgId]);
    const orgName = (org[0] && org[0].name) || 'Main';

    // The first branch. Everything downstream (multi-branch dispatch, per-branch
    // terminology, branch-scoped lists) assumes one exists; a tenant with zero
    // branches is the state nothing was written to handle.
    let schoolId = null;
    try {
      const [b] = await conn.execute('SELECT id FROM client_schools WHERE org_id=? ORDER BY id LIMIT 1', [orgId]);
      if (b.length) schoolId = b[0].id;
      else {
        const [r] = await conn.execute(
          "INSERT INTO client_schools (org_id, name, type, is_primary, status) VALUES (?,?,?,1,'active')",
          [orgId, `${orgName} — ${s.branch_suffix || 'Main Campus'}`.slice(0, 190), blueprint.type || 'school']);
        schoolId = r.insertId;
      }
    } catch { /* schools table variant — classes still seed, just unbranched */ }

    // Hang classes off the academic year onboarding just created, so they show
    // up in the current session rather than in no session at all.
    // WW-60: the table is `academic_years` — it is one of the few that carries no
    // `client_` prefix, and this SELECT used to add one. No such table exists, so
    // it threw on every signup, the catch swallowed it, and EVERY class seeded for
    // EVERY tenant landed with academic_year_id = NULL —
    // which is the "not linked to a year" the school is looking at. (JD PUBLIC: the
    // 12 seeded classes are NULL, the 3 they typed themselves via POST /classes —
    // which names the table correctly — carry the year.) Failure is now logged
    // rather than vanishing; it stays non-fatal, because a class with no year is
    // recoverable and a signup that dies is not.
    let yearId = null;
    try {
      const [y] = await conn.execute(
        'SELECT id FROM academic_years WHERE org_id=? ORDER BY is_current DESC, id DESC LIMIT 1', [orgId]);
      if (y.length) yearId = y[0].id;
      else console.warn('[BLUEPRINT] org ' + orgId + ' has no academic year yet — classes will seed unlinked');
    } catch (e) {
      console.error('[BLUEPRINT] academic-year lookup failed for org ' + orgId + ':', e.message);
    }

    for (const c of s.classes) {
      if (!c || !c.name) continue;
      const [cr] = await conn.execute(
        "INSERT INTO client_classes (org_id, name, standard, academic_year_id, school_id, status) VALUES (?,?,?,?,?,'active')",
        [orgId, String(c.name).slice(0, 100), c.standard != null ? String(c.standard).slice(0, 20) : null, yearId, schoolId]);
      for (const sec of (Array.isArray(c.sections) && c.sections.length ? c.sections : ['A'])) {
        await conn.execute(
          "INSERT INTO client_sections (org_id, class_id, name, school_id, status) VALUES (?,?,?,?,'active')",
          [orgId, cr.insertId, String(sec).slice(0, 50), schoolId]);
      }
    }

    for (const sub of (Array.isArray(s.subjects) ? s.subjects : [])) {
      if (!sub || !sub.name) continue;
      await conn.execute(
        "INSERT INTO client_subjects (org_id, name, code, color, status) VALUES (?,?,?,?,'active')",
        [orgId, String(sub.name).slice(0, 100), sub.code ? String(sub.code).slice(0, 20) : null, sub.color || null]);
    }
  } catch { /* any variant — the org is still usable, just emptier */ }
}

// P2 (multi-branch, mixed groups): seed ONE branch's terminology from its own
// type's blueprint into client_labels with school_id=<branch>. This is what makes
// `client_schools.type` a real dispatch key — a coaching branch inside a school
// group reads "Batch/Faculty" while the school branches read "Class/Teacher".
// INSERT IGNORE: never clobbers a label an admin has already customised for the
// branch. Fail-soft (missing table/blueprint → no-op, group still works).
async function seedBranchLabels(orgId, schoolId, type) {
  try {
    const bp = await getBlueprint(type);
    if (!bp) return 0;
    let n = 0;
    for (const [canonical, display] of Object.entries(bp.labels || {})) {
      if (!canonical || !display) continue;
      await db.pool.execute(
        'INSERT IGNORE INTO client_labels (org_id, school_id, canonical, display) VALUES (?,?,?,?)',
        [orgId, schoolId, String(canonical).slice(0, 64), String(display).slice(0, 64)]);
      n++;
    }
    return n;
  } catch { return 0; }
}

module.exports = { getBlueprint, roleDefsFor, seedOrgFromBlueprint, seedBranchLabels, DEFAULT_ROLES };
