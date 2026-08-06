'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { resolveForSubject } = require('./resolve.service');

/*
 * My Curriculum — the school-facing read surface.
 *
 * This is the endpoint that makes centrally-authored content appear inside a
 * school's own subject without anybody assigning anything. Two calls:
 *
 *   GET /api/cie/my-curriculum/subjects   what can I open?
 *   GET /api/cie/my-curriculum            the chapters, topics and content
 *
 * ── WHY THE SCOPE IS DELIBERATELY LOOSE FOR STAFF ──────────────────────────
 * A student sees only their own class. A parent sees only their children's.
 * Staff (admin / principal / teacher) see every active class in the school.
 *
 * That last one is a deliberate call, not an oversight. What this endpoint
 * returns is a CURRICULUM and the learning content mapped to it — master content
 * that is already shared across every tenant by design (PRD §15), plus the
 * school's own published assets, which are org-scoped in the query. There is no
 * student data, no marks, no attendance and no fee information anywhere in the
 * response. Narrowing a teacher to "only the classes I teach" would mean
 * reproducing the teacher↔class assignment rule, which lives in THREE places on
 * this platform and has already blanked a real school's timetable once when read
 * from only one of them. Getting that wrong here would hide the curriculum from
 * teachers who need it, to protect data that is not in the payload.
 *
 * When a teacher-scoped view is genuinely wanted it belongs in the UI as a
 * filter, not here as a security boundary.
 *
 * ── WHAT A STUDENT MUST NEVER SEE ──────────────────────────────────────────
 * `includeDrafts` is never taken from the request. Draft trees are org-1's
 * workspace; a half-built chapter appearing to a student is exactly the
 * "half-finished feature" CLAUDE.md §21 exists to prevent.
 */

router.use(authenticate);

// ── NO ROLE ALLOWLIST, DELIBERATELY (AK, 2026-08-03: "koi new role ka chakkar
// nahi") ────────────────────────────────────────────────────────────────────
// An allowlist of staff slugs was the first version of this, and it is the exact
// bug this platform has already shipped once: `useCan` gated on `role_slug`, so
// every school-BUILT custom role was denied on every module. Schools invent roles
// (accountant, HOD, coordinator, librarian) and those slugs cannot be enumerated
// here. `base_role` — which would answer this properly — is not in the JWT.
//
// So the rule is inverted: only `student` and `parent` are special-cased, because
// only they must be narrowed to their own class. Everything else is staff. A
// custom role therefore works on day one instead of silently seeing nothing.
//
// Safe because of what this endpoint returns: a curriculum and the learning
// content mapped to it. Master content is shared across every tenant by design,
// the school's own content is org_id-scoped in the query, and there is no student
// data, no marks, no attendance and no fees anywhere in the payload. Who sees the
// MENU is a navConfig question; this is not the place to re-implement RBAC.
// (No constant to hold: the two narrowed roles are branched on by name below,
// and a Set of two would only add a place for the two to disagree.)

// Which classes this caller may open. Returns [] rather than throwing when a
// student has no active enrollment — a student between sections is a real state,
// and the caller renders it as "no class yet", not as an error.
async function classesFor(req) {
  const orgId = req.user.org_id;
  const uid = req.user.user_id;
  const role = req.user.role_slug || '';

  if (role === 'student') {
    const student = await queryOne(
      'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [uid, orgId]);
    if (!student) return [];
    return query(
      `SELECT DISTINCT c.id, c.name, c.standard, c.academic_year
         FROM client_enrollments e
         JOIN client_sections s ON s.id = e.section_id
         JOIN client_classes c ON c.id = s.class_id
        WHERE e.student_id=? AND e.org_id=? AND e.status='active'
          AND COALESCE(c.status,'active')='active'
        ORDER BY c.standard ASC`, [student.id, orgId]);
  }

  if (role === 'parent') {
    const parent = await queryOne(
      'SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, orgId]);
    if (!parent) return [];
    return query(
      `SELECT DISTINCT c.id, c.name, c.standard, c.academic_year
         FROM client_parent_students ps
         JOIN client_enrollments e ON e.student_id = ps.student_id AND e.status='active'
         JOIN client_sections s ON s.id = e.section_id
         JOIN client_classes c ON c.id = s.class_id
        WHERE ps.parent_id=? AND ps.org_id=? AND COALESCE(ps.status,'active')='active'
          AND COALESCE(c.status,'active')='active'
        ORDER BY c.standard ASC`, [parent.id, orgId]);
  }

  // Everyone who is not a student or a parent is staff — including a role the
  // school invented after this code shipped.
  return query(
    `SELECT id, name, standard, academic_year FROM client_classes
      WHERE org_id=? AND COALESCE(status,'active')='active'
      ORDER BY standard ASC, name ASC`, [orgId]);
}

// ── What can I open? ────────────────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classes = await classesFor(req);

    // client_subjects is a FLAT org-level list with no link to a class (F5 in the
    // implementation plan). So every subject is offered for every class the
    // caller can open, and the resolver decides which combinations actually have
    // a curriculum. When Adoption lands (LOOP 7) this becomes the adopted set.
    const subjects = await query(
      `SELECT id, name, code, color FROM client_subjects
        WHERE org_id=? AND COALESCE(status,'active')='active'
        ORDER BY name ASC`, [orgId]);

    return success(res, { classes, subjects });
  } catch (e) { return error(res, e.message, 500); }
});

// ── The resolved curriculum ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classId = parseInt(req.query.class_id, 10);
    const subjectId = parseInt(req.query.subject_id, 10);
    if (!Number.isFinite(classId) || !Number.isFinite(subjectId)) {
      return error(res, 'Pick a class and a subject', 400);
    }

    // The caller may only resolve a class they are allowed to open. This is the
    // real boundary — a student must not read another class's curriculum by
    // editing the query string.
    const allowed = await classesFor(req);
    const classRow = allowed.find((c) => Number(c.id) === classId);
    if (!classRow) return error(res, 'That class is not available to you', 403);

    const subjectRow = await queryOne(
      `SELECT id, name FROM client_subjects
        WHERE id=? AND org_id=? AND COALESCE(status,'active')='active'`, [subjectId, orgId]);
    if (!subjectRow) return error(res, 'That subject no longer exists', 404);

    const purpose = ['teach', 'practice', 'assess'].includes(req.query.purpose)
      ? req.query.purpose : null;

    const out = await resolveForSubject({
      orgId, classRow, subjectRow, purpose,
      includeDrafts: false,   // never from the request — see the header note
    });

    return success(res, {
      ...out,
      class: { id: classRow.id, name: classRow.name, standard: classRow.standard },
      subject: { id: subjectRow.id, name: subjectRow.name },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Read one lesson ────────────────────────────────────────────────────────
// Serves an authored lesson's HTML to whoever may see it, with the body class set
// from the viewer's role and the school's medium.
//
// ── WHY THE BODY CLASS IS THE WHOLE FEATURE ────────────────────────────────
// Each lesson contains BOTH languages and BOTH audiences, selected by classes the
// authors put on <body>: `lang-en`/`lang-hi` and `view-teacher`/`view-student`,
// with `.lang { display:none }` and `teacher-only` / `student-only` blocks. The
// buttons that switched them needed JavaScript, which the importer strips (the
// maths is pre-rendered, so no script survives and the reader can be fully
// sandboxed).
//
// So the choice moves here, which is better than a button: a student gets the
// student version in their school's medium without deciding anything, and a
// teacher gets the teaching notes for the same topic from the same row. One
// authored file, four audiences, no duplication.
//
// ── WHY IT RETURNS JSON AND NOT text/html ──────────────────────────────────
// The browser must fetch this with the session cookie, and a cross-origin
// <iframe src> to api.wiswits.com would not send it. So the app fetches JSON
// through the normal authenticated client and renders the string into a
// `srcdoc` iframe with a fully locked `sandbox` — no allow-scripts, nothing to
// load off-origin, and therefore no CSP question to get wrong.
router.get('/lesson/:source/:id', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const role = String(req.user.role_slug || '').toLowerCase();
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return error(res, 'Bad lesson id', 400);

    const source = req.params.source === 'school' ? 'org_private' : 'master';

    let row;
    if (source === 'master') {
      // Master content is shared across every tenant BY DESIGN (PRD §15) — it is
      // the only cross-tenant surface, and it is read-only to a school. Published
      // is the boundary: a draft is org-1's workspace and must never leak.
      row = await queryOne(
        `SELECT id, title, type, language, body_html, asset_url
           FROM platform_content WHERE id=? AND status='published'`, [id]);
    } else {
      // A school's own content is org-scoped. This is the tenant boundary and it
      // is the reason the two branches are not one clever query.
      row = await queryOne(
        `SELECT a.id, a.title, t.type_key AS type, a.language, NULL AS body_html, NULL AS asset_url
           FROM client_cms_assets a
           JOIN client_cms_types t ON t.id = a.content_type_id AND t.org_id = a.org_id
          WHERE a.id=? AND a.org_id=? AND a.status='published'`, [id, orgId]);
    }
    if (!row) return error(res, 'That lesson is not available', 404);
    if (!row.body_html) {
      return error(res, 'This lesson has no written content to open', 409);
    }

    // The school's medium decides the language; a school with no profile row falls
    // back to English, which is what every lesson has.
    const profile = await queryOne(
      'SELECT medium FROM cie_org_academic_profile WHERE org_id=?', [orgId]);
    const medium = String(profile?.medium || 'en').toLowerCase() === 'hi' ? 'hi' : 'en';

    // A student and a parent read the student version. Everyone else is staff and
    // reads the teaching notes — same inverted rule as the rest of this file, so a
    // role a school invents tomorrow gets the teacher view rather than nothing.
    const view = (role === 'student' || role === 'parent') ? 'student' : 'teacher';

    // Replace the authored classes rather than appending: `view-teacher lang-en`
    // is baked into every file, and adding `view-student` beside it would leave
    // BOTH sets visible, which is worse than either.
    const html = row.body_html.replace(
      /<body\b[^>]*>/i,
      `<body class="view-${view} lang-${medium}">`);

    return success(res, {
      id: row.id,
      source: req.params.source === 'school' ? 'school' : 'master',
      title: row.title,
      type: row.type,
      view,
      medium,
      html,
    });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
