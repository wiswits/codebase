'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { activeEnrolment } = require('../../utils/headcount');
const { resolveForSubject } = require('./resolve.service');

/*
 * School setup for the curriculum engine — where a school SAYS what it is.
 * Tables: 056 (cie_org_academic_profile, cie_org_subjects). Mounted at
 * /api/cie/school.
 *
 * ── WHY THIS FILE EXISTS AT ALL ─────────────────────────────────────────────
 * 055 matched a school to a curriculum by DERIVING its board from free text
 * typed at onboarding, and 056 backfilled that derivation into a profile row for
 * every org. The derivation works and it is live, but it is a guess: nobody
 * could correct it from inside the product, and a school whose board column said
 * "Cbse Board" or nothing at all got whatever the string-folding produced.
 *
 * These five endpoints are the correction. Two writes (declare the board and
 * medium; switch a subject off) and three reads that the setup screen and the
 * teacher's assign screen are built from.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT DO ────────────────────────────────
 * It does not count content. Every count returned here comes from
 * resolve.service, which is the single answer to "what content belongs here".
 * A second counting query written locally would be faster and would drift the
 * first time the mapping plane changed — and it would drift SILENTLY, showing a
 * school a number no screen could reproduce. That is the WW-88 family of bugs
 * (see utils/headcount.js) reintroduced in a new module.
 */

router.use(authenticate);

// Medium is a FILTER on content, not a level of the curriculum tree — 056 spends
// twenty lines on why, and the short version is that putting the language inside
// a node's identity forks the tree and doubles every mapping. So the list of
// mediums is a small fixed set here, and it exists in ONE place because the PUT
// validates against the same array the GET offers. Two lists would let the UI
// offer a medium the API rejects.
const MEDIUMS = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'Hindi' },
];
const mediumLabel = (key) => MEDIUMS.find((m) => m.key === key)?.label || key;

// Interpolated, never bound. `LIMIT ?` is the one place mysql2's prepared
// statements diverge between a local MySQL and the server's MariaDB, and this
// codebase already has endpoints that cannot run on a dev machine for exactly
// that reason. These are integer constants in source, so interpolation is safe.
const MAX_SESSIONS = 50;
const MAX_SECTIONS = 200;

// ── NO ROLE ALLOWLIST, DELIBERATELY ─────────────────────────────────────────
// Same inverted rule as myCurriculum.routes.js, for the same reason: an
// allowlist of staff slugs is the bug this platform has already shipped once —
// `useCan` gated on `role_slug`, so every school-BUILT custom role was denied on
// every module. Schools invent roles (coordinator, HOD, academic head) and those
// slugs cannot be enumerated in this file. `base_role`, which would answer this
// properly, is not in the JWT.
//
// So the two writes below EXCLUDE the three roles that are definitionally not
// leadership instead of listing the ones that are. A school's "coordinator"
// works on day one; a teacher cannot switch a subject off for the whole school.
//
// The residual risk is named honestly: a school that invents a leadership-ish
// role gets write access to a settings screen. That is the fail-open direction,
// and it is the correct trade here — the fail-closed version locks a real
// academic coordinator out of the one screen that decides what her school
// teaches, which is a support ticket on day one and an invisible one, because a
// 403 on a settings save reads as "the platform is broken". Who sees the MENU is
// a navConfig question; this is not the place to re-implement RBAC.
const NOT_LEADERSHIP = ['student', 'parent', 'teacher'];

const leadershipOnly = (req, res, next) =>
  NOT_LEADERSHIP.includes(String(req.user.role_slug || '').toLowerCase())
    ? error(res, 'Only the school office can change these settings', 403)
    : next();

// ── The school's academic identity, plus the choices available ───────────────
// Reads are open to every signed-in person: a board name and a medium are not
// sensitive, and the teacher's screens need the same profile the setup screen
// shows. There is no student data, no marks and no fees anywhere in this reply.
router.get('/profile', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    const profile = await queryOne(
      `SELECT board_key, medium, session, confirmed_at
         FROM cie_org_academic_profile WHERE org_id=?`, [orgId]);

    const boards = await query(
      `SELECT board_key, name, kind FROM cie_boards
        WHERE is_active=1 ORDER BY sort_order ASC, name ASC`);

    // Only sessions that actually have a published curriculum are offered.
    // Offering a session with nothing in it would let a school pin itself to an
    // empty year and see a blank curriculum with no explanation.
    const sessionRows = await query(
      `SELECT DISTINCT session FROM cie_curriculum_nodes
        WHERE status='published' AND is_active=1
        ORDER BY session DESC
        LIMIT ${MAX_SESSIONS}`);

    return success(res, {
      profile: profile || null,
      boards,
      mediums: MEDIUMS,
      sessions: sessionRows.map((r) => r.session),
      // TRUE means "we guessed this". 056 backfilled a derived board for every
      // org and deliberately left confirmed_at NULL, so a guess is never shown
      // as a declaration. The setup screen hangs its "please confirm" prompt on
      // this flag alone — if it were computed any other way (say, from whether
      // the board is CBSE) a school that genuinely chose CBSE would be nagged
      // forever and a school we guessed wrong about would never be asked.
      needs_confirmation: !!profile && !profile.confirmed_at,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Declare the board and the medium ────────────────────────────────────────
// THIS IS THE MOST CONSEQUENTIAL SETTING A SCHOOL HAS. The board written here is
// the first link in the resolve chain, and resolve.service treats a declared
// profile as the answer, full stop — it will not second-guess it by folding the
// school's name. So a wrong board here serves an ENTIRE school the wrong
// curriculum, in every class and every subject, silently: the chapters look
// plausible, they are just somebody else's. That is why the board must exist and
// be active before it is accepted, why confirmed_by/confirmed_at record who
// said so, and why the success message reads the saved values back in words
// instead of a bare "Saved".
router.put('/profile', leadershipOnly, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rawBoard = req.body?.board_key;
    const rawMedium = req.body?.medium;

    if (!rawBoard) return error(res, 'Choose the board this school follows', 400);

    // Folded the same way the builder folds a new board key, so "cbse" and
    // "CBSE" are the same answer and a school is not told its own board does not
    // exist over a capital letter.
    const boardKey = String(rawBoard).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
    const board = boardKey
      ? await queryOne('SELECT board_key, name FROM cie_boards WHERE board_key=? AND is_active=1', [boardKey])
      : null;
    if (!board) {
      return error(res, `We do not have a curriculum for "${String(rawBoard).slice(0, 40)}" yet. Pick one from the list.`, 400);
    }

    const medium = String(rawMedium || 'en').toLowerCase();
    if (!MEDIUMS.some((m) => m.key === medium)) {
      return error(res, `Teaching language must be ${MEDIUMS.map((m) => m.label).join(' or ')}`, 400);
    }

    // NULL session means "always follow the newest published curriculum", which
    // is what almost every school wants. A pinned session is a school saying
    // "keep us on this year even when next year is authored".
    const rawSession = req.body?.session;
    const session = rawSession == null || String(rawSession).trim() === ''
      ? null : String(rawSession).trim().slice(0, 12);

    // A pinned session with nothing published in it is ACCEPTED, not rejected.
    // A school pinning next year before it is authored is a legitimate, ordinary
    // thing to do, and refusing it would be the platform arguing with a school
    // about its own calendar. But it must be SAID, because until that year is
    // authored the resolver falls back to the latest published session — so the
    // school would otherwise see this year's chapters and have no idea why.
    let sessionHasContent = true;
    if (session) {
      const hit = await queryOne(
        `SELECT session FROM cie_curriculum_nodes
          WHERE session=? AND status='published' AND is_active=1 LIMIT 1`, [session]);
      sessionHasContent = !!hit;
    }

    await query(
      `INSERT INTO cie_org_academic_profile
         (org_id, board_key, medium, session, confirmed_by, confirmed_at)
       VALUES (?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE
         board_key=VALUES(board_key), medium=VALUES(medium), session=VALUES(session),
         confirmed_by=VALUES(confirmed_by), confirmed_at=NOW()`,
      [orgId, board.board_key, medium, session, req.user.user_id]);

    await audit(req, 'CURRICULUM_PROFILE_SAVE', 'cie_org_academic_profile', String(orgId),
      { new_data: { board_key: board.board_key, medium, session } });

    let message = `Saved — ${board.name}, ${mediumLabel(medium)} medium`;
    if (session) message += `, ${session}`;
    if (session && !sessionHasContent) {
      message += `. Nothing has been published for ${session} yet, so classes will keep using the newest available curriculum until it is.`;
    }

    return success(res, {
      board_key: board.board_key, medium, session,
      session_has_content: sessionHasContent,
    }, message);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Which subjects this class runs, and how much is in each ─────────────────
router.get('/subjects', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classId = parseInt(req.query.class_id, 10);
    if (!Number.isFinite(classId)) return error(res, 'Pick a class first', 400);

    // Scoped by org_id, so a class id from another school is simply not found.
    // academic_year and standard are selected because the resolver reads both:
    // standard when it is set, the name when it is not, and academic_year as the
    // session it prefers.
    const classRow = await queryOne(
      `SELECT id, name, standard, academic_year FROM client_classes
        WHERE id=? AND org_id=? AND COALESCE(status,'active')='active'`, [classId, orgId]);
    if (!classRow) return error(res, 'That class is not in this school', 404);

    // ── ABSENCE OF A ROW MEANS ENABLED ──────────────────────────────────────
    // 056 makes this load-bearing and says so: a row in cie_org_subjects exists
    // ONLY to record a decision, and is_enabled=0 is the only interesting one.
    // A school that never opens this screen has no rows at all and must still
    // see its whole curriculum, and a subject added to the master tree later
    // must appear without every school opting in.
    //
    // So this is a LEFT JOIN with COALESCE(...,1) and not an INNER JOIN. Getting
    // it the other way round — treating "no row" as off — would blank the
    // curriculum for every school on the platform at once, and it would look
    // like an empty library rather than a bug.
    const rows = await query(
      `SELECT s.id, s.name, s.code, s.color, COALESCE(os.is_enabled, 1) AS is_enabled
         FROM client_subjects s
         LEFT JOIN cie_org_subjects os
              ON os.org_id = s.org_id AND os.subject_id = s.id AND os.class_id = ?
        WHERE s.org_id=? AND COALESCE(s.status,'active')='active'
        ORDER BY s.name ASC`, [classId, orgId]);

    // ── ONE RESOLVE PER SUBJECT, AND THE CEILING THAT COMES WITH IT ─────────
    // The resolver answers for one class+subject pair, so a per-class view has
    // to call it once per subject. Each call is roughly 4-6 queries, so a school
    // with 15 subjects costs ~75-90 round trips.
    //
    // Acceptable HERE and only here: this is a settings screen an administrator
    // opens occasionally, not a dashboard on the 2-second budget (CLAUDE.md
    // §12). The ceiling is the org's subject count — fine at tens, wrong at
    // hundreds. If a school ever runs more than ~30 subjects, or if this shape
    // is copied onto a hot path, the fix is a batched count inside
    // resolve.service (one query across all subjects), NOT a count written here:
    // a second implementation of "what content belongs here" would drift from
    // the resolver and no screen would agree with any other.
    const subjects = [];
    for (const r of rows) {
      const subjectRow = { id: r.id, name: r.name };
      const out = await resolveForSubject({ orgId, classRow, subjectRow });
      const ok = out?.match?.ok === true;
      // `totals` is absent whenever the match failed — resolveForSubject returns
      // only { match, chapters } on the failure paths. Reading out.totals.chapters
      // straight would throw on exactly the case this endpoint exists to explain.
      const totals = out?.totals || {};

      subjects.push({
        id: r.id,
        name: r.name,
        code: r.code,
        color: r.color,
        is_enabled: Number(r.is_enabled) === 1,
        chapters: ok ? (totals.chapters || 0) : 0,
        topics: ok ? (totals.topics || 0) : 0,
        // The resolver calls it `content`; the school-facing word is "items",
        // because "content objects" is our vocabulary, not a teacher's.
        items: ok ? (totals.content || 0) : 0,
        // A zero with no explanation reads to a teacher as "the platform has
        // nothing" instead of "nobody has mapped this yet", so the resolver's
        // own sentence is carried through verbatim — it already names which link
        // in the chain broke and what to do about it. Always present (null when
        // there is nothing to say) so the UI never reads an undefined field.
        note: ok ? null : (out?.match?.message || null),
      });
    }

    return success(res, {
      class: { id: classRow.id, name: classRow.name, standard: classRow.standard },
      subjects,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Switch a subject on or off for one class ─────────────────────────────────
router.post('/subjects', leadershipOnly, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classId = parseInt(req.body?.class_id, 10);
    const subjectId = parseInt(req.body?.subject_id, 10);
    if (!Number.isFinite(classId) || !Number.isFinite(subjectId)) {
      return error(res, 'Pick a class and a subject', 400);
    }

    const raw = req.body?.is_enabled;
    const enabled = [true, 1, '1', 'true'].includes(typeof raw === 'string' ? raw.toLowerCase() : raw) ? 1
      : ([false, 0, '0', 'false'].includes(typeof raw === 'string' ? raw.toLowerCase() : raw) ? 0 : null);
    if (enabled === null) return error(res, 'Say whether this subject is on or off', 400);

    // ── BOTH IDS ARE CHECKED AGAINST THIS ORG, SEPARATELY AND BEFORE THE WRITE ─
    // cie_org_subjects.org_id comes from the token, so the ROW that lands is
    // always this school's — which makes it tempting to skip these two lookups.
    // Skipping them is the bug: the UNIQUE key is (org_id, class_id, subject_id),
    // so an id belonging to another school inserts happily under OUR org_id and
    // creates a decision row about a class and a subject this school does not
    // have. Worse in the other direction — a school that later acquires those
    // ids inherits a switch nobody set.
    //
    // This platform has already shipped a cross-tenant write once (the fees
    // assign door), and it shipped because the org_id on the written row looked
    // like proof of scoping. It is not: every id in the body has to be proved to
    // belong here before it is written anywhere.
    const classRow = await queryOne(
      `SELECT id, name FROM client_classes
        WHERE id=? AND org_id=? AND COALESCE(status,'active')='active'`, [classId, orgId]);
    if (!classRow) return error(res, 'That class is not in this school', 404);

    const subjectRow = await queryOne(
      `SELECT id, name FROM client_subjects
        WHERE id=? AND org_id=? AND COALESCE(status,'active')='active'`, [subjectId, orgId]);
    if (!subjectRow) return error(res, 'That subject is not in this school', 404);

    await query(
      `INSERT INTO cie_org_subjects (org_id, class_id, subject_id, is_enabled, changed_by)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled), changed_by=VALUES(changed_by)`,
      [orgId, classId, subjectId, enabled, req.user.user_id]);

    await audit(req, 'CURRICULUM_SUBJECT_TOGGLE', 'cie_org_subjects', `${orgId}:${classId}:${subjectId}`,
      { new_data: { class_id: classId, class_name: classRow.name,
                    subject_id: subjectId, subject_name: subjectRow.name, is_enabled: enabled } });

    // The message names the consequence, because turning a subject off is not a
    // private preference — it removes the subject from every teacher's and every
    // student's screen in the school, and the person clicking it should know that
    // before they read it on a support call.
    const message = enabled
      ? `${subjectRow.name} is on for ${classRow.name}. Teachers and students can see it again.`
      : `${subjectRow.name} is off for ${classRow.name}. It is now hidden from every teacher and student in the school.`;

    return success(res, {
      class_id: classId, subject_id: subjectId, is_enabled: enabled === 1,
    }, message);
  } catch (e) { return error(res, e.message, 500); }
});

// ── The sections of one class, with how many children are in each ────────────
// The teacher's assign screen renders "Class 10 — A (42 students)" from this, so
// the headcount has to be the SAME number the Students list and the Classes
// screen show.
router.get('/sections', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classId = parseInt(req.query.class_id, 10);
    if (!Number.isFinite(classId)) return error(res, 'Pick a class first', 400);

    // activeEnrolment() rather than a plain `status='active'`: an active
    // enrolment row can still belong to a child the school archived, because
    // archiving writes client_users.is_active=0 and never touches the enrolment.
    // Counting the rows alone is the WW-88/90/95/96/99/100/101 defect — seven
    // tickets for one school seeing three different headcounts on three screens.
    // The predicate lives in utils/headcount.js so there is exactly one answer;
    // writing `status='active'` here would quietly make a fourth.
    //
    // No separate ownership check on class_id is needed: org_id is on
    // client_sections itself, so another school's class id matches nothing.
    const sections = await query(
      `SELECT s.id, s.name,
              (SELECT COUNT(*) FROM client_enrollments e
                WHERE e.section_id = s.id AND e.org_id = s.org_id
                  AND ${activeEnrolment('e')}) AS students
         FROM client_sections s
        WHERE s.org_id=? AND s.class_id=? AND COALESCE(s.status,'active')='active'
        ORDER BY s.name ASC
        LIMIT ${MAX_SECTIONS}`, [orgId, classId]);

    return success(res, { sections });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
