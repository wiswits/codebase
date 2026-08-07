'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { istToday } = require('../../utils/schoolDay');
const { safePct } = require('../../utils/pct');

/*
 * CIE Assignments — a teacher points resolved content at a section.
 * Decision: ADR-013 + ADR-014. Table: cie_assignments (migration 056).
 * Mounted at /api/cie/assignments.
 *
 * ── WHAT THIS IS, AND WHAT IT IS NOT ───────────────────────────────────────
 * `my-curriculum` answers "what content exists for this class and subject". It
 * assigns nothing — every school sees its whole curriculum whether or not a
 * teacher has done anything. This file is the other half: the teacher SELECTS
 * from that curriculum and says "these four, this section, by Friday".
 *
 * It is deliberately NOT homework. `client_assignments` is homework (max_marks,
 * require_submission), `client_cms_assignments` is an authoring brief for the
 * content team and `client_worksheet_assignments` is worksheet-specific. None of
 * them can express "watch this video by Friday" — 056's header explains why a
 * fourth table is the honest answer rather than a fifth column on one of them.
 *
 * ── ONE ROW PER CONTENT OBJECT, NEVER A BATCH ROW ──────────────────────────
 * A POST here carries a LIST of items and writes one row each. It does not write
 * a single "assignment" row holding a JSON array. 056 spells out why: the
 * student's path ticks items off one at a time, so a JSON blob would be read and
 * rewritten on every interaction, and "how many students finished this video"
 * would become a JSON scan instead of a join. GET /progress below is exactly that
 * join, and it only exists cheaply because of this shape.
 *
 * ── THE THREE THINGS THAT WOULD BREAK QUIETLY ──────────────────────────────
 *   1. A cross-tenant section_id. That does not leak data — it CREATES work in
 *      another school's section. This platform has already shipped one
 *      cross-tenant write (the fees assign door), so the section check below is
 *      explicit, is the first thing POST does, and is not delegated to a join.
 *   2. The source vocabulary. The API says 'school', the column says
 *      'org_private'. See toDbSource() — getting that backwards files content
 *      under a source that resolves to nothing, silently.
 *   3. A duplicate row. The UNIQUE key makes a re-assign an UPDATE. Without it a
 *      teacher pressing "assign" twice would give every student the same video
 *      twice on their path, with two different due dates.
 */

router.use(authenticate);

// ── NO ROLE ALLOWLIST, DELIBERATELY ─────────────────────────────────────────
// Same rule as myCurriculum.routes.js, and for the same reason: an allowlist of
// staff slugs is the bug this platform has already shipped once (`useCan` gated
// on `role_slug`, so every school-BUILT custom role was denied on every module).
// Schools invent roles — coordinator, HOD, senior teacher — and those slugs
// cannot be enumerated here. `base_role`, which would answer this properly, is
// not in the JWT.
//
// So the rule is inverted: assigning is a STAFF action, and only `student` and
// `parent` are named. Everything else — including a role invented after this
// code shipped — can assign on day one. Who sees the BUTTON is a navConfig and
// permission-catalogue question; this is not the place to re-implement RBAC.
//
// The boundary that actually matters is org_id + section ownership, enforced on
// every query below. A teacher assigning to a section they do not teach is a
// school's internal problem; a teacher assigning into another school is not, and
// that is the one this file refuses.
const staffOnly = (req, res, next) => {
  const role = req.user.role_slug || '';
  if (role === 'student' || role === 'parent') {
    return error(res, 'Only staff can send content to a class', 403);
  }
  return next();
};
router.use(staffOnly);

// ── THE TWO VOCABULARIES ────────────────────────────────────────────────────
// The API (and the UI) says 'master' / 'school'. The column says
// 'master' / 'org_private' — cie_assignments.content_source mirrors
// cie_content_concepts.content_source exactly so the two can be joined, and that
// enum was named before the UI existed.
//
// They differ ON PURPOSE and the mapping lives here, in one place, in both
// directions. Mixing them up does not throw: 'school' is simply not a valid enum
// value, so MariaDB coerces it (or, in strict mode, rejects the whole insert) and
// the content is filed under a source that resolve.service.js will never find.
// That is an invisible failure — content assigned, nothing on the student's path.
const toDbSource = (apiSource) => ({ master: 'master', school: 'org_private' })[apiSource] || null;
const toApiSource = (dbSource) => (dbSource === 'org_private' ? 'school' : 'master');

const NOTIFY = ['none', 'app', 'app_sms'];

// Caps are interpolated integer CONSTANTS, never bound. `LIMIT ?` is a confirmed
// mysql2 divergence on this platform — it runs on local MySQL and fails on the
// server's MariaDB, so a bound LIMIT is a bug that only appears in production.
const MAX_ITEMS_PER_POST = 200;
const MAX_ROWS = 500;
const MAX_SECTION_ROWS = 1000;
const MAX_PROGRESS_ROWS = 20000;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

// A DATE column carries no time and no timezone, and mysql2 hands it back as a
// plain 'YYYY-MM-DD' string (see config/db.js `dateStrings`). So a due date is
// compared as a string against the school's IST calendar day — never against
// CURDATE() or new Date(), which are the server's timezone, not the school's.
function validDueDate(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  const s = String(raw).slice(0, 10);
  if (!YMD.test(s)) return { ok: false, why: 'Enter the due date as year-month-day, for example 2026-08-10' };
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    return { ok: false, why: `${s} is not a real date` };
  }
  if (s < istToday()) return { ok: false, why: `${prettyDate(s)} has already passed — pick today or a later date` };
  return { ok: true, value: s };
}

// "10 Aug" — what goes in the message a teacher reads. Built from the string, not
// from a Date rendered in the server's locale, so it cannot drift a day.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function prettyDate(ymd) {
  const [, m, d] = String(ymd).split('-');
  const month = MONTHS[parseInt(m, 10) - 1];
  return month ? `${parseInt(d, 10)} ${month}` : String(ymd);
}

// The one place a section is turned into something a teacher recognises, so
// "Class 10 — A" reads the same in every message and every row of every table.
const sectionLabel = (row) => [row.class_name, row.section_name].filter(Boolean).join(' — ');

// ── THE TENANT BOUNDARY ─────────────────────────────────────────────────────
// Returns null when the section is not this org's, which the callers turn into a
// plain 404. Both org_id conditions are present deliberately: a section could in
// principle be re-parented to a class of another org, and matching only
// `s.org_id` would then hand back that class's name.
async function ownSection(orgId, sectionId) {
  return queryOne(
    `SELECT s.id, s.name AS section_name, c.name AS class_name
       FROM client_sections s
       JOIN client_classes c ON c.id = s.class_id AND c.org_id = s.org_id
      WHERE s.id = ? AND s.org_id = ?`, [sectionId, orgId]);
}

// ── LISTING: two branches, merged in JS ─────────────────────────────────────
// content_id points at platform_content.id when the source is master and at
// client_cms_assets.id when it is the school's own. One column cannot FK to two
// tables (056 says so), so there is no join that covers both — resolve.service.js
// has the same shape for the same reason.
//
// Two queries merged in JS rather than one UNION ALL: the required order is
// due_date with NULLs LAST, then created_at DESC, and ordering a UNION means
// ordering by output aliases — an area where this codebase has already hit
// MySQL-vs-MariaDB divergence. A JS sort over at most a few hundred rows cannot
// diverge between engines, and the merge is where the two source vocabularies get
// normalised anyway.
async function listAssignments({ orgId, sectionId, nodeCode }) {
  const where = ["a.status = 'active'", 'a.org_id = ?'];
  const params = [orgId];
  if (sectionId) { where.push('a.section_id = ?'); params.push(sectionId); }
  if (nodeCode) { where.push('a.node_code = ?'); params.push(nodeCode); }
  const cond = where.join(' AND ');

  // A node's parent_code IS its chapter (052) — chapter → topic is the only
  // parent relation the delivery surfaces care about, so one LEFT JOIN is enough.
  // LEFT, not JOIN: a topic authored directly under a subject has no parent, and
  // an inner join would silently drop its assignments from the table.
  const common = `
       FROM cie_assignments a
       JOIN client_sections s ON s.id = a.section_id AND s.org_id = a.org_id
       JOIN client_classes  c ON c.id = s.class_id   AND c.org_id = a.org_id
       JOIN cie_curriculum_nodes n  ON n.node_code = a.node_code
       LEFT JOIN cie_curriculum_nodes p ON p.node_code = n.parent_code`;

  const master = await query(
    `SELECT a.id, a.section_id, s.name AS section_name, c.name AS class_name,
            a.node_code, n.display_name AS topic_name, p.display_name AS chapter_name,
            a.content_source, a.content_id, pc.title, pc.type,
            a.due_date, a.notify, a.note, a.created_at
       ${common}
       JOIN platform_content pc ON pc.id = a.content_id
      WHERE ${cond} AND a.content_source = 'master'
      LIMIT ${MAX_ROWS}`, params);

  // The school branch is scoped by org_id THREE times — on the assignment, on the
  // asset and on the type. The asset scope is the load-bearing one: content_id is
  // just a number, so without `ca.org_id = a.org_id` a stale row could pull
  // another school's asset title into this school's table. That is a read leak,
  // and it costs one condition to make impossible.
  const school = await query(
    `SELECT a.id, a.section_id, s.name AS section_name, c.name AS class_name,
            a.node_code, n.display_name AS topic_name, p.display_name AS chapter_name,
            a.content_source, a.content_id, ca.title, t.type_key AS type,
            a.due_date, a.notify, a.note, a.created_at
       ${common}
       JOIN client_cms_assets ca ON ca.id = a.content_id AND ca.org_id = a.org_id AND ca.org_id = ?
       JOIN client_cms_types  t  ON t.id = ca.content_type_id AND t.org_id = ca.org_id
      WHERE ${cond} AND a.content_source = 'org_private'
      LIMIT ${MAX_ROWS}`, [orgId, ...params]);

  const rows = [...master, ...school].map((r) => ({
    id: r.id,
    section_id: r.section_id,
    section_name: r.section_name,
    class_name: r.class_name,
    node_code: r.node_code,
    topic_name: r.topic_name,
    chapter_name: r.chapter_name,
    source: toApiSource(r.content_source),
    content_id: r.content_id,
    title: r.title,
    type: r.type,
    due_date: r.due_date,
    notify: r.notify,
    note: r.note,
    created_at: r.created_at,
  }));

  // NULLs last: a dated item is a commitment and belongs at the top; "whenever
  // you like" belongs underneath. Sorting NULL first would bury Friday's video
  // under a term's worth of optional reading.
  rows.sort((x, y) => {
    if (x.due_date !== y.due_date) {
      if (!x.due_date) return 1;
      if (!y.due_date) return -1;
      return x.due_date < y.due_date ? -1 : 1;
    }
    return new Date(y.created_at).getTime() - new Date(x.created_at).getTime();
  });

  // Each branch was capped independently, so the merge can hold up to 2×MAX_ROWS.
  // Trim after sorting, so what survives is the most urgent — trimming before the
  // sort would drop rows arbitrarily.
  return rows.slice(0, MAX_ROWS);
}

// ── Send content to a section ───────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { section_id, node_code, items, due_date, notify, note } = req.body || {};

    const sectionId = parseInt(section_id, 10);
    if (!Number.isFinite(sectionId)) return error(res, 'Pick the class and section to send this to', 400);

    const nodeCode = String(node_code || '').trim();
    if (!nodeCode) return error(res, 'Pick the chapter or topic this content comes from', 400);

    if (!Array.isArray(items) || items.length === 0) {
      return error(res, 'Select at least one item to send', 400);
    }
    if (items.length > MAX_ITEMS_PER_POST) {
      return error(res, `Send up to ${MAX_ITEMS_PER_POST} items at a time`, 400);
    }

    const notifyMode = notify === undefined || notify === null || notify === '' ? 'app' : String(notify);
    if (!NOTIFY.includes(notifyMode)) {
      return error(res, 'Choose whether to notify in the app, by app and SMS, or not at all', 400);
    }

    const due = validDueDate(due_date);
    if (!due.ok) return error(res, due.why, 400);

    // ── 1. The section must be THIS school's ────────────────────────────────
    // First check in the handler, before anything is read or written, and never
    // taken from the body's org_id (there isn't one, and there must never be).
    // A wrong section_id here does not leak data — it CREATES homework in another
    // school's class, visible to their students and their parents. That is the
    // failure this platform has already shipped once, so the check is a named
    // step rather than a condition tucked inside the insert's join.
    const section = await ownSection(orgId, sectionId);
    if (!section) return error(res, 'That class section is not available', 404);

    // ── 2. The node must exist and be live ──────────────────────────────────
    // There IS a real FK on node_code (fk_cie_assign_node). Without this check an
    // unknown code reaches MariaDB and comes back as a raw constraint error —
    // "Cannot add or update a child row" is not a sentence to show a teacher.
    const node = await queryOne(
      `SELECT node_code, display_name FROM cie_curriculum_nodes
        WHERE node_code = ? AND is_active = 1`, [nodeCode]);
    if (!node) return error(res, 'That chapter or topic is no longer available', 400);

    // ── 3. Normalise and de-duplicate the items ─────────────────────────────
    // The same object listed twice in one request would be one row either way
    // (the UNIQUE key collapses it), but it would also be counted twice in the
    // response — so the teacher would be told "5 items" for 4. Dedupe here so the
    // number reported is the number that exists.
    const seen = new Set();
    const wanted = [];
    for (const raw of items) {
      const dbSource = toDbSource(raw && raw.source);
      const contentId = parseInt(raw && raw.id, 10);
      if (!dbSource || !Number.isFinite(contentId) || contentId <= 0) {
        return error(res, 'One of the selected items could not be read — refresh the page and try again', 400);
      }
      const key = `${dbSource}:${contentId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      wanted.push({ dbSource, contentId });
    }

    const noteText = note == null || note === '' ? null : String(note).slice(0, 500);

    const counted = await transaction(async (conn) => {
      // What is already on this section, read INSIDE the transaction so the
      // counts reported cannot be a snapshot from before a concurrent assign.
      const [existing] = await conn.execute(
        `SELECT content_source, content_id, status FROM cie_assignments
          WHERE org_id = ? AND section_id = ? LIMIT ${MAX_SECTION_ROWS}`, [orgId, sectionId]);
      const alreadyActive = new Set(
        existing.filter((r) => r.status === 'active').map((r) => `${r.content_source}:${r.content_id}`));

      let assigned = 0;
      let updated = 0;
      for (const it of wanted) {
        // ── WHY ON DUPLICATE KEY UPDATE, NOT AN INSERT ────────────────────
        // uq_cie_assign is (org_id, section_id, content_source, content_id). A
        // teacher re-sending the same object to the same section must MOVE the
        // due date, never create a second row — two rows would appear as the
        // same video twice on every student's path, with two different
        // deadlines, and no screen could explain which one counts.
        //
        // status='active' is set on the update too, so re-assigning something
        // previously withdrawn brings it back rather than leaving a withdrawn
        // row that swallows the new assignment.
        //
        // node_code is deliberately NOT rewritten on the update path (it is not
        // in the SET list). Re-sending the same object from a DIFFERENT topic
        // therefore keeps the topic it was first sent from. That is the
        // conservative choice — the node_code is what reports group by, and
        // silently re-filing history under a new chapter is worse than the row
        // staying where it was first filed.
        await conn.execute(
          `INSERT INTO cie_assignments
             (org_id, section_id, node_code, content_source, content_id,
              assigned_by, due_date, notify, note, status)
           VALUES (?,?,?,?,?,?,?,?,?,'active')
           ON DUPLICATE KEY UPDATE
             due_date = VALUES(due_date), notify = VALUES(notify),
             note = VALUES(note), status = 'active'`,
          [orgId, sectionId, nodeCode, it.dbSource, it.contentId,
            req.user.user_id, due.value, notifyMode, noteText]);

        // Counted from the pre-read rather than from affectedRows. mysql2 reports
        // 1 for an insert, 2 for a changed update and 0 when the update changed
        // nothing — so an unchanged re-assign would report as neither assigned
        // nor updated and the teacher would be told "0 items". The set lookup
        // says what the teacher actually cares about: new to the class, or a
        // change to something already there.
        if (alreadyActive.has(`${it.dbSource}:${it.contentId}`)) updated += 1;
        else assigned += 1;
      }
      return { assigned, updated };
    });

    // ONE transaction for the whole list: a failure on item three rolls back items
    // one and two. A half-assigned batch is the worst outcome here — the teacher
    // sees an error, assumes nothing was sent, re-sends, and the students who
    // already had items get a second notification for them.
    await audit(req, 'CONTENT_ASSIGN', 'cie_assignment', `section:${sectionId}`, {
      new_data: {
        section_id: sectionId,
        section: sectionLabel(section),
        node_code: nodeCode,
        items: wanted.length,
        assigned: counted.assigned,
        updated: counted.updated,
        due_date: due.value,
        notify: notifyMode,
      },
    });

    const n = counted.assigned + counted.updated;
    const msg = `${n === 1 ? 'Sent 1 item' : `Sent ${n} items`} to ${sectionLabel(section)}`
      + (due.value ? `, due ${prettyDate(due.value)}` : '');
    return success(res, { assigned: counted.assigned, updated: counted.updated }, msg);
  } catch (e) { return error(res, e.message, 500); }
});

// ── What has been sent ──────────────────────────────────────────────────────
// Both filters optional: with no filter this is "everything currently assigned in
// the school", which is the report a coordinator asks for. Always org-scoped.
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    let sectionId = null;
    if (req.query.section_id) {
      sectionId = parseInt(req.query.section_id, 10);
      if (!Number.isFinite(sectionId)) return error(res, 'That class section could not be read', 400);
      // Checked even on a read: without it the caller learns which section ids
      // exist elsewhere from whether the list comes back empty or not. The query
      // is org-scoped regardless, so this is about the answer being honest.
      const section = await ownSection(orgId, sectionId);
      if (!section) return error(res, 'That class section is not available', 404);
    }
    const nodeCode = req.query.node_code ? String(req.query.node_code).trim() : null;

    const assignments = await listAssignments({ orgId, sectionId, nodeCode });
    return success(res, { assignments });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Withdraw ────────────────────────────────────────────────────────────────
// SOFT only, and this one is not just CLAUDE.md §15 habit. 056 keeps cie_progress
// deliberately NOT keyed on the assignment: a student who has already watched the
// video has watched it, and that fact belongs to the CONTENT, not to the teacher's
// decision to hand it out. A hard delete would leave progress rows whose
// assignment no longer exists — the row is real, the reason it was ever shown is
// gone, and "why did 14 students complete something nobody assigned" becomes
// unanswerable. A withdrawn row keeps the history explainable.
router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return error(res, 'That item could not be found', 400);

    // Read first so the audit entry can name what was withdrawn, and so the
    // "not this org's" case is a plain 404 instead of a silent 0-row UPDATE that
    // would report success for another school's row.
    const row = await queryOne(
      `SELECT a.id, a.section_id, a.node_code, a.content_source, a.content_id, a.status,
              s.name AS section_name, c.name AS class_name
         FROM cie_assignments a
         JOIN client_sections s ON s.id = a.section_id AND s.org_id = a.org_id
         JOIN client_classes  c ON c.id = s.class_id   AND c.org_id = a.org_id
        WHERE a.id = ? AND a.org_id = ?`, [id, orgId]);
    if (!row) return error(res, 'That item is no longer in this class', 404);

    await query(
      "UPDATE cie_assignments SET status='withdrawn' WHERE id=? AND org_id=?", [id, orgId]);

    await audit(req, 'CONTENT_ASSIGN_WITHDRAW', 'cie_assignment', String(id), {
      old_data: {
        section_id: row.section_id,
        section: sectionLabel(row),
        node_code: row.node_code,
        source: toApiSource(row.content_source),
        content_id: row.content_id,
        status: row.status,
      },
    });
    return success(res, {}, `Removed from ${sectionLabel(row)}`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── The completion bars ─────────────────────────────────────────────────────
// For every object assigned to this section: how many students finished it.
//
// Aggregated in JS, not with GROUP BY. This codebase has confirmed
// MySQL-vs-MariaDB divergences on ONLY_FULL_GROUP_BY and on aggregate aliases in
// ORDER BY, and resolve.service.js already made the same call for the same
// reason: a query that runs on a laptop and fails on the server is worse than a
// slightly longer function. The volume is one section's students × one section's
// assignments, which is hundreds of rows, not millions.
router.get('/progress', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const sectionId = parseInt(req.query.section_id, 10);
    if (!Number.isFinite(sectionId)) return error(res, 'Pick a class and section to see progress', 400);

    const section = await ownSection(orgId, sectionId);
    if (!section) return error(res, 'That class section is not available', 404);

    const nodeCode = req.query.node_code ? String(req.query.node_code).trim() : null;

    // ── THE DENOMINATOR ─────────────────────────────────────────────────────
    // Active enrollments in the section. COUNT(DISTINCT student_id), not
    // COUNT(*): client_enrollments has no unique key on (student_id, section_id),
    // so a student re-enrolled into the same section would otherwise be counted
    // twice and every bar would read low for the whole class.
    const head = await queryOne(
      `SELECT COUNT(DISTINCT student_id) AS n FROM client_enrollments
        WHERE org_id = ? AND section_id = ? AND status = 'active'`, [orgId, sectionId]);
    const assignedTo = Number(head?.n || 0);

    const assignments = await listAssignments({ orgId, sectionId, nodeCode });

    // Progress for the students currently in this section, matched on
    // (content_source, content_id) — the same pair cie_assignments uses, which is
    // what makes a master video and a school upload distinguishable at all (056:
    // client_content_progress has no source column, which is why cie_progress
    // exists beside it).
    //
    // DISTINCT on the student as well as the content: the join to enrollments can
    // multiply a progress row if a student has more than one active enrollment
    // row for the section, and that would count one finished student as two —
    // which is how a bar reaches 130%.
    const progress = await query(
      `SELECT DISTINCT pr.student_id, pr.content_source, pr.content_id, pr.status
         FROM cie_progress pr
         JOIN client_enrollments e
              ON e.student_id = pr.student_id AND e.org_id = pr.org_id
             AND e.section_id = ? AND e.status = 'active'
        WHERE pr.org_id = ?
        LIMIT ${MAX_PROGRESS_ROWS}`, [sectionId, orgId]);

    const tally = new Map();
    for (const p of progress) {
      const key = `${p.content_source}:${p.content_id}`;
      let t = tally.get(key);
      if (!t) { t = { done: 0, in_progress: 0 }; tally.set(key, t); }
      // 'not_started' rows exist (a student opened the path and nothing else) and
      // are counted in NEITHER bucket — they fall out as part of the residual
      // below, which is where a student with no row at all also lands. Two ways
      // of not having started must produce the same number.
      if (p.status === 'done') t.done += 1;
      else if (p.status === 'in_progress') t.in_progress += 1;
    }

    const rows = assignments.map((a) => {
      const t = tally.get(`${toDbSource(a.source)}:${a.content_id}`) || { done: 0, in_progress: 0 };

      // Clamped at 0, and this is not defensive noise. cie_progress is keyed on
      // the STUDENT, not on the enrollment, and progress deliberately survives a
      // student leaving. So the counts above can legitimately exceed the current
      // headcount: a student who finished the video in July and moved to another
      // section in August still has a done row, and done can be 25 while the
      // section holds 24. Without the clamp not_started goes negative and the UI
      // renders a bar longer than the row it sits in.
      const notStarted = Math.max(0, assignedTo - t.done - t.in_progress);

      // safePct() is the platform's one division rule and returns null on an
      // empty denominator (utils/pct.js). A completion bar has to be a number to
      // have a width, so an empty section is reported as 0 here rather than as
      // null — the honest reading of "0 of 0 students finished". The distinction
      // is not lost: assigned_to is 0 alongside it, so the UI can still choose to
      // say "no students in this section yet" instead of drawing an empty bar.
      const pct = safePct(t.done, assignedTo) ?? 0;

      return {
        source: a.source,
        content_id: a.content_id,
        title: a.title,
        type: a.type,
        assigned_to: assignedTo,
        done: t.done,
        in_progress: t.in_progress,
        not_started: notStarted,
        pct: Math.round(pct),
      };
    });

    return success(res, {
      section: { id: section.id, name: sectionLabel(section), students: assignedTo },
      rows,
    });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
