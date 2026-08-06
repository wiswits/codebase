'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { resolveForSubject, classNoFromName } = require('./resolve.service');
const { resolveSubjectKey } = require('./subjectKey');
const { groupByPurpose } = require('./purpose');

/*
 * Learn — the student's own screen, and the parent's window into it.
 *
 *   GET  /api/cie/learn/path                what should I do next, per subject
 *   GET  /api/cie/learn/topic/:nodeCode      one topic as the four-step path
 *   POST /api/cie/learn/progress             I watched / read / finished this
 *   GET  /api/cie/learn/children             my children
 *   GET  /api/cie/learn/children/:studentId  one child's summary
 *
 * ── THE ONE RULE THIS FILE EXISTS TO ENFORCE ───────────────────────────────
 * Everything here is PERSONAL data — what one child has and has not done. That
 * makes it the exact opposite of my-curriculum.routes.js, which returns a
 * curriculum and can afford a loose staff scope because there is no student data
 * in its payload. There is nothing loose here.
 *
 * The identity is ALWAYS derived from the authenticated user:
 *   - a student id comes from `client_students WHERE user_id=? AND org_id=?`,
 *     never from the request. A `student_id` in a student's body or query string
 *     is ignored, because accepting it is the whole vulnerability.
 *   - a parent may only name a child that `client_parent_students` says is theirs.
 *
 * Those two checks are marked SECURITY CHECK 1 and SECURITY CHECK 2 below and
 * they are the most important lines in the file. This platform's standing blind
 * spot is that every routine check gets run as an admin — an admin passes both of
 * these trivially, so neither is exercised by the way we normally test. Anyone
 * changing them must re-verify as a real student and a real parent.
 *
 * ── NO ROLE ALLOWLIST, DELIBERATELY ───────────────────────────────────────
 * Same rule as my-curriculum: no list of role slugs anywhere. Schools invent
 * roles and `base_role` is not in the JWT, so a slug allowlist silently denies
 * every school-built role — a bug this codebase has already shipped once
 * (`useCan` gating on `role_slug`). Instead the gate is DATA: is there a student
 * record for this user? is there a parent link to this child? A person's records
 * answer who they are far more reliably than the name of their role, which is
 * also how the bus-driver screen was eventually fixed.
 *
 * ── CONTENT ONLY EVER COMES FROM THE RESOLVER ─────────────────────────────
 * No content table is queried for "what belongs here" — resolveForSubject is the
 * single answer, and it is what computes step order, locks and progress. The two
 * places this file does touch content tables (a title for a list, an existence
 * check on write) are lookups by primary key, never selection.
 */

router.use(authenticate);

// Interpolated, never bound. `LIMIT ?` is the one place mysql2's prepared
// statements diverge between a dev machine's MySQL and the server's MariaDB, and
// this codebase already has endpoints that cannot run locally for that reason.
// These are integer constants in source, so interpolation is safe.
const MAX_ATTENTION = 20;
const MAX_RECENT = 8;

// How far ahead a due date has to be before it stops being urgent. Anything
// already overdue is included by the same comparison.
const ATTENTION_DAYS = 10;

const PROGRESS_STATUSES = ['not_started', 'in_progress', 'done'];

// A single write may not claim more than four hours. A player that reports its
// whole buffer, or a tab left open all weekend, would otherwise turn a parent's
// "minutes studied" into fiction — and that number is the one thing on the parent
// screen they cannot check for themselves.
const MAX_SECONDS_PER_WRITE = 4 * 60 * 60;

/*
 * PERFORMANCE CEILING — read before adding anything to /path.
 *
 * /path calls the resolver once per subject, and the resolver costs roughly nine
 * round trips (profile, board, alias, session, nodes, content, progress,
 * assignments). A school running twelve subjects is therefore ~110 queries on the
 * screen a student lands on, which has a 2-second budget (CLAUDE.md §12).
 *
 * Two things keep that inside the budget, and neither is a cache:
 *   1. four resolves run at a time (below), so twelve subjects are three waves,
 *      not twelve; and four of the pool's twenty connections is a share one
 *      student may fairly hold.
 *   2. nothing else in this handler queries anything.
 *
 * The real waste is inside the resolver: the school's profile, board and session
 * are re-read for every subject even though they are identical across all of
 * them. Fixing that belongs in resolve.service.js (a per-request context passed
 * in), not here, and it is the first thing to do if this screen ever gets slow.
 */
const RESOLVE_CONCURRENCY = 4;

async function mapLimited(list, fn) {
  const out = [];
  for (let i = 0; i < list.length; i += RESOLVE_CONCURRENCY) {
    const wave = await Promise.all(list.slice(i, i + RESOLVE_CONCURRENCY).map(fn));
    out.push(...wave);
  }
  return out;
}

// ── source: one word in the API, another in the database ───────────────────
// The API says 'school' because that is what it is to the person using it. The
// column says 'org_private' because it mirrors cie_content_concepts exactly, and
// 056 is explicit that those two enums must not drift. Translating in one place
// means a caller never has to know the storage word, and a stray 'org_private'
// from a client is rejected rather than quietly accepted.
const dbSource = (apiWord) => (apiWord === 'school' ? 'org_private' : 'master');
const apiSource = (dbWord) => (dbWord === 'master' ? 'master' : 'school');

/**
 * SECURITY CHECK 1 — who is this, really.
 *
 * The student id is looked up FROM THE TOKEN's user id, scoped to the token's
 * org. Nothing the caller sends influences it. Every student-facing handler in
 * this file starts here, and none of them accept a student_id parameter at all —
 * there is deliberately no code path where one could be honoured.
 *
 * Returns null when the caller has no student record (staff, a parent, an
 * orphaned login). `classRow` is null when the student has no active enrollment,
 * which is a real state — a child between sections — and never an error.
 */
async function studentSelf(orgId, userId) {
  const student = await queryOne(
    'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [userId, orgId]);
  if (!student) return null;

  // Same joins as classesFor() in my-curriculum: enrollment → section → class.
  // One row: a student sits in one section at a time, and if bad data gives them
  // two, the lower class number is the safer guess for a learning screen.
  const row = await queryOne(
    `SELECT e.section_id, sec.name AS section_name,
            c.id AS class_id, c.name AS class_name, c.standard, c.academic_year
       FROM client_enrollments e
       JOIN client_sections sec ON sec.id = e.section_id AND sec.org_id = e.org_id
       JOIN client_classes c ON c.id = sec.class_id AND c.org_id = e.org_id
      WHERE e.student_id=? AND e.org_id=? AND e.status='active'
        AND COALESCE(c.status,'active')='active'
      ORDER BY c.standard ASC, c.id ASC
      LIMIT 1`, [student.id, orgId]);

  return {
    studentId: student.id,
    sectionId: row ? row.section_id : null,
    sectionName: row ? row.section_name : null,
    classRow: row
      ? { id: row.class_id, name: row.class_name, standard: row.standard, academic_year: row.academic_year }
      : null,
  };
}

/**
 * The subjects a school actually runs for one class.
 *
 * ABSENCE MEANS ENABLED (056's load-bearing default): a row in cie_org_subjects
 * exists only to record a decision, and is_enabled=0 is the only interesting one.
 * Reading this backwards — treating "no row" as off — would blank every student's
 * screen in every school that has never opened the subjects setting, which is all
 * of them today. Hence COALESCE(os.is_enabled, 1).
 */
async function enabledSubjects(orgId, classId) {
  return query(
    `SELECT s.id, s.name, s.code, s.color
       FROM client_subjects s
       LEFT JOIN cie_org_subjects os
              ON os.org_id = s.org_id AND os.subject_id = s.id AND os.class_id = ?
      WHERE s.org_id=? AND COALESCE(s.status,'active')='active'
        AND COALESCE(os.is_enabled, 1) = 1
      ORDER BY s.name ASC`, [classId, orgId]);
}

/**
 * Flatten a resolved subject into the order a student meets it in.
 *
 * Chapters already arrive in authored sequence, and each node's `steps` array is
 * already in Watch → Read → Practise → Test order with `locked` decided by the
 * server. So walking chapter → its own steps → its children, in that order, IS
 * the learning path. Nothing is re-sorted here, because re-sorting would be a
 * second opinion about sequence and the tree is the first one.
 */
function walkItems(nodes, chapterName = null) {
  const out = [];
  for (const n of nodes) {
    const chapter = chapterName ?? n.name;
    for (const step of n.steps || []) {
      for (const item of step.items || []) out.push({ item, step, node: n, chapter });
    }
    out.push(...walkItems(n.children || [], chapter));
  }
  return out;
}

function pctOf(done, total) {
  // Every percentage in this file goes through here. A parent screen reading
  // "NaN%" is worse than one reading nothing, and a subject with no content yet
  // is the normal case while a library is being filled.
  return total > 0 ? Math.round((done * 100) / total) : 0;
}

const isDone = (entry) => entry.item.progress?.status === 'done';
const dueOf = (entry) => entry.item.assigned?.due_date ?? null;

// The shape the UI opens. Built from resolver rows only, so a field this file
// never invents cannot drift from what the resolver actually served.
function shapeNext(entry) {
  if (!entry) return null;
  return {
    node_code: entry.node.node_code,
    topic_name: entry.node.name,
    chapter_name: entry.chapter,
    step: entry.step.key,
    title: entry.item.title,
    source: entry.item.source,
    content_id: entry.item.content_id,
    type: entry.item.type,
    duration_secs: entry.item.duration_secs ?? null,
    asset_url: entry.item.asset_url ?? null,
    // Carried so the hero can say "Resume" instead of "Start" on a lesson the
    // student is part-way through. Without it a half-watched video reads as
    // untouched, and the one button on the student's screen tells them to start
    // over — the resolver already knows better, this was simply dropped.
    status: entry.item.progress?.status || 'not_started',
    pct: Number(entry.item.progress?.pct || 0),
    // Written content with no URL cannot be opened directly; the hero needs to
    // know so it can send the student to the topic instead of offering a dead link.
    has_body: !!entry.item.has_body,
    due_date: dueOf(entry),
  };
}

// ── 1. The student's home ───────────────────────────────────────────────────
router.get('/path', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const me = await studentSelf(orgId, req.user.user_id);   // SECURITY CHECK 1
    if (!me) return error(res, 'This screen shows a student their own lessons.', 403);

    // No active enrollment is a real state, not a failure. An empty, explained
    // screen beats an error a child cannot act on.
    if (!me.classRow) return success(res, { class: null, subjects: [] });

    const subjects = await enabledSubjects(orgId, me.classRow.id);

    const shaped = await mapLimited(subjects, async (subjectRow) => {
      const out = await resolveForSubject({
        orgId,
        classRow: me.classRow,
        subjectRow,
        // The student's OWN section, so a teacher's due dates arrive with the
        // content instead of the path being a flat list with no urgency.
        studentId: me.studentId,
        sectionId: me.sectionId,
        includeDrafts: false,   // never from the request: a half-built chapter is not a lesson
      });

      const base = { id: subjectRow.id, name: subjectRow.name, color: subjectRow.color };

      // A miss in the match chain is explained in words, never rendered as an
      // empty subject. "Nothing here" reads as "the platform is broken"; the
      // resolver's message says which link is missing and who can fix it.
      if (!out.match.ok) {
        return { ...base, next: null, progress: { done: 0, total: 0, pct: 0 }, message: out.match.message };
      }

      const flat = walkItems(out.chapters);
      const total = flat.length;
      const done = flat.filter(isDone).length;

      // Candidates: not finished, and not sitting behind a step the server has
      // locked. `locked` is the resolver's decision — recomputing it here would
      // let this screen offer something the topic screen would refuse.
      const open = flat.filter((e) => !isDone(e) && !e.step.locked);

      // Curriculum order is the default answer. A due date overrides it, because
      // "due Friday" is a promise to a teacher and sequence is only a suggestion.
      let pick = open[0] || null;
      const dated = open.filter((e) => dueOf(e) != null);
      if (dated.length) {
        dated.sort((a, b) => new Date(dueOf(a)) - new Date(dueOf(b)));
        pick = dated[0];
      }

      let message = null;
      if (total === 0) {
        message = `No lessons have been added to ${subjectRow.name} yet.`;
      } else if (!pick && done === total) {
        message = `You're all caught up in ${subjectRow.name}.`;
      } else if (!pick) {
        // Should not happen — the first outstanding step in a topic is never
        // locked — but a student staring at a blank card deserves a sentence
        // rather than our confidence that this branch is unreachable.
        message = `The next step in ${subjectRow.name} opens once the earlier ones are finished.`;
      }

      return { ...base, next: shapeNext(pick), progress: { done, total, pct: pctOf(done, total) }, message };
    });

    return success(res, {
      class: { id: me.classRow.id, name: me.classRow.name, standard: me.classRow.standard },
      subjects: shaped,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// Find a node anywhere in a resolved tree, carrying the chapter it lives under.
function findNode(nodes, code, chapterName = null) {
  for (const n of nodes) {
    const chapter = chapterName ?? n.name;
    if (n.node_code === code) return { node: n, chapter };
    const hit = findNode(n.children || [], code, chapter);
    if (hit) return hit;
  }
  return null;
}

// A topic's content plus everything filed under it. A topic that was broken into
// subtopics must not show an empty path just because the content hangs one level
// down — that would read as "nothing here" for a topic that is fully covered.
function contentUnder(node) {
  return [...(node.content || []), ...(node.children || []).flatMap(contentUnder)];
}

// ── 2. One topic, as the four-step path ────────────────────────────────────
router.get('/topic/:nodeCode', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const code = String(req.params.nodeCode || '').trim();
    if (!code) return error(res, 'Which topic?', 400);

    const me = await studentSelf(orgId, req.user.user_id);   // SECURITY CHECK 1
    if (!me) return error(res, 'This screen shows a student their own lessons.', 403);
    if (!me.classRow) return error(res, 'You are not in a class yet, so there are no lessons to open.', 403);

    const target = await queryOne(
      `SELECT node_code, display_name, class_no, subject_key
         FROM cie_curriculum_nodes
        WHERE node_code=? AND is_active=1 AND status='published'`, [code]);
    if (!target) return error(res, 'That topic is not available.', 404);

    // ── The URL-editing guard ────────────────────────────────────────────
    // A student changing the code in the address bar must not read another
    // class's topic. The class number is checked first because it is the cheap
    // half of the answer; the definitive half is presence in the student's own
    // resolved tree, below. Both must agree.
    const myClassNo = me.classRow.standard ?? classNoFromName(me.classRow.name);
    if (myClassNo == null || Number(myClassNo) !== Number(target.class_no)) {
      return error(res, 'This topic belongs to a different class.', 403);
    }

    // Which of the student's subjects is this topic's subject? Matched through
    // the same folding the resolver uses, so a school that writes "Maths" and a
    // tree authored as 'mathematics' agree here exactly as they do there.
    const subjects = await enabledSubjects(orgId, me.classRow.id);
    let subjectRow = null;
    for (const s of subjects) {
      const key = await resolveSubjectKey(query, s.name);
      if (key.key === target.subject_key) { subjectRow = s; break; }
    }
    if (!subjectRow) return error(res, 'This topic is not one of your subjects.', 403);

    const out = await resolveForSubject({
      orgId, classRow: me.classRow, subjectRow,
      studentId: me.studentId, sectionId: me.sectionId, includeDrafts: false,
    });
    if (!out.match.ok) return error(res, out.match.message, 404);

    const hit = findNode(out.chapters, code);
    // The definitive check: the topic is only readable because it is genuinely
    // in this student's own curriculum, not because its class number matched.
    if (!hit) return error(res, 'This topic is not part of your class.', 403);

    const items = contentUnder(hit.node);
    // The same grouping function the resolver used, so the lock rule on this
    // screen cannot disagree with the one on the home screen. A locked step still
    // returns its items — the UI greys them and says why, which teaches the
    // sequence. Hiding them would just look like missing content.
    const steps = groupByPurpose(items);
    const done = items.filter((i) => i.progress?.status === 'done').length;

    return success(res, {
      topic: {
        node_code: hit.node.node_code,
        name: hit.node.name,
        chapter_name: hit.chapter,
        subject_name: subjectRow.name,
      },
      steps,
      totals: { done, total: items.length, pct: pctOf(done, items.length) },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── 3. I watched / read / finished this ────────────────────────────────────
router.post('/progress', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const me = await studentSelf(orgId, req.user.user_id);   // SECURITY CHECK 1
    // Progress belongs to the person who did the work. There is no student_id in
    // this body and there never will be: a teacher marking a child's lesson
    // complete is a different feature with a different table.
    if (!me) return error(res, 'Only a student can save their own progress.', 403);

    const body = req.body || {};

    const src = String(body.source || 'master').toLowerCase();
    if (src !== 'master' && src !== 'school') {
      return error(res, 'We could not tell which library this lesson is from.', 400);
    }
    const contentId = Number.parseInt(body.content_id, 10);
    if (!Number.isInteger(contentId) || contentId <= 0) {
      return error(res, 'Tell us which lesson this is.', 400);
    }

    const status = body.status == null ? 'in_progress' : String(body.status);
    if (!PROGRESS_STATUSES.includes(status)) {
      return error(res, 'Progress can only be not started, in progress, or done.', 400);
    }

    // A player that says "done" without a number means 100. Storing 0 alongside
    // done would make every progress bar argue with its own tick.
    let pct = body.pct == null ? (status === 'done' ? 100 : 0) : Number(body.pct);
    if (!Number.isFinite(pct)) return error(res, 'Progress must be a number between 0 and 100.', 400);
    pct = Math.min(100, Math.max(0, pct));

    let seconds = body.seconds == null ? 0 : Number.parseInt(body.seconds, 10);
    if (!Number.isInteger(seconds) || seconds < 0) {
      return error(res, 'Time spent cannot be a negative number.', 400);
    }
    seconds = Math.min(seconds, MAX_SECONDS_PER_WRITE);

    let score = null;
    if (body.score != null && body.score !== '') {
      score = Number(body.score);
      if (!Number.isFinite(score)) return error(res, 'A score must be a number.', 400);
    }

    const nodeCode = typeof body.node_code === 'string' && body.node_code.trim()
      ? body.node_code.trim().slice(0, 64) : null;

    const dbSrc = dbSource(src);

    // Existence check, and for a school's own asset it is also the tenant
    // boundary: one org's student must not be able to record progress against
    // another org's material by guessing an id. Cheap — both are primary-key
    // lookups — and it keeps invented ids out of the parent's activity list,
    // where they would surface as rows with no title.
    const exists = dbSrc === 'master'
      ? await queryOne("SELECT id FROM platform_content WHERE id=? AND status='published'", [contentId])
      : await queryOne(
        "SELECT id FROM client_cms_assets WHERE id=? AND org_id=? AND status='published'",
        [contentId, orgId]);
    if (!exists) return error(res, 'That lesson is no longer available.', 404);

    /*
     * ── PROGRESS NEVER GOES BACKWARDS BY ACCIDENT ─────────────────────────
     * A video player reports pct as it plays. Reopen a finished lesson and it
     * says 10 again. Written literally, that un-completes work the child already
     * did — and a progress bar that loses ticks is a progress bar parents stop
     * believing, at which point the whole screen is worthless.
     *
     * So: pct keeps the HIGHER of stored and incoming, and 'done' is a one-way
     * door — once done, always done. Only an explicit 'done' can re-affirm it,
     * and nothing can revoke it. Undoing completion is an act for a teacher, not
     * a side effect of a media event.
     *
     * seconds_spent ADDS rather than overwrites: it is time spent, not a
     * snapshot of one session.
     *
     * `completed_at` deliberately tests VALUES(status) and NOT the `status`
     * column. In ON DUPLICATE KEY UPDATE the assignments run left to right and a
     * later one reads values EARLIER ones already wrote (verified against this
     * DB, not assumed) — so a clause that reads a column another clause in the
     * same statement is rewriting gets a different answer depending on where it
     * sits in the list. Written this way the completion stamp means one thing
     * only, "this is the write that finished it", whatever order these lines end
     * up in. Reordering them cannot change behaviour, which is the point.
     *
     * VALUES() rather than the newer row-alias syntax: the alias form needs
     * MySQL 8.0.19+ and is not available on the MariaDB this runs on in
     * production. VALUES() works on both.
     */
    await query(
      `INSERT INTO cie_progress
         (org_id, student_id, content_source, content_id, node_code,
          status, pct, seconds_spent, score, first_opened_at, last_seen_at, completed_at)
       VALUES (?,?,?,?,?,?,?,?,?, NOW(), NOW(), ?)
       ON DUPLICATE KEY UPDATE
         node_code       = COALESCE(VALUES(node_code), node_code),
         pct             = GREATEST(pct, VALUES(pct)),
         completed_at    = CASE WHEN completed_at IS NOT NULL THEN completed_at
                                WHEN VALUES(status)='done' THEN NOW()
                                ELSE NULL END,
         status          = CASE WHEN status='done' OR VALUES(status)='done' THEN 'done'
                                ELSE VALUES(status) END,
         seconds_spent   = seconds_spent + VALUES(seconds_spent),
         score           = COALESCE(VALUES(score), score),
         first_opened_at = COALESCE(first_opened_at, VALUES(first_opened_at)),
         last_seen_at    = NOW()`,
      [orgId, me.studentId, dbSrc, contentId, nodeCode,
        status, pct, seconds, score, status === 'done' ? new Date() : null]);

    // Read the row back and return it. The client's optimistic guess does not
    // know about the max-pct rule or the one-way door, so the server's version is
    // the only one worth drawing.
    const row = await queryOne(
      `SELECT id, student_id, content_source, content_id, node_code, status, pct,
              seconds_spent, score, first_opened_at, last_seen_at, completed_at
         FROM cie_progress
        WHERE org_id=? AND student_id=? AND content_source=? AND content_id=?`,
      [orgId, me.studentId, dbSrc, contentId]);

    const stored = row ? {
      id: row.id,
      source: apiSource(row.content_source),
      content_id: row.content_id,
      node_code: row.node_code,
      status: row.status,
      pct: Number(row.pct),
      seconds_spent: row.seconds_spent,
      score: row.score == null ? null : Number(row.score),
      first_opened_at: row.first_opened_at,
      last_seen_at: row.last_seen_at,
      completed_at: row.completed_at,
    } : null;

    // High volume — one row per lesson interaction, all day, every student. The
    // payload stays four short fields; the row itself holds the detail.
    await audit(req, 'LEARNING_PROGRESS', 'cie_progress', row ? row.id : null, {
      new_data: { source: src, content_id: contentId, status: stored ? stored.status : status, pct: stored ? stored.pct : pct },
    });

    return success(res, stored, 'Progress saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── 4. My children ─────────────────────────────────────────────────────────
router.get('/children', async (req, res) => {
  try {
    const orgId = req.user.org_id;

    // Derived from the token, exactly like the student id: the parent record is
    // found BY user_id, so the set of children is not something a caller can
    // widen. Someone with no parent record simply has no children to show —
    // an empty list, not an error, because that is the honest answer.
    const rows = await query(
      `SELECT s.id AS student_id,
              TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS name,
              c.name AS class_name, sec.name AS section_name
         FROM client_parents p
         JOIN client_parent_students ps
              ON ps.parent_id = p.id AND ps.org_id = p.org_id
             AND COALESCE(ps.status,'active')='active'
         JOIN client_students s ON s.id = ps.student_id AND s.org_id = ps.org_id
         JOIN client_users u ON u.id = s.user_id AND u.org_id = s.org_id
         LEFT JOIN client_enrollments e
              ON e.student_id = s.id AND e.org_id = s.org_id AND e.status='active'
         LEFT JOIN client_sections sec ON sec.id = e.section_id AND sec.org_id = s.org_id
         LEFT JOIN client_classes c ON c.id = sec.class_id AND c.org_id = s.org_id
        WHERE p.user_id=? AND p.org_id=?
        ORDER BY ps.is_primary DESC, u.first_name ASC`, [req.user.user_id, orgId]);

    // A child with two active enrollment rows would otherwise appear twice.
    // Deduped here rather than with DISTINCT/GROUP BY on purpose: this codebase
    // has confirmed MySQL-vs-MariaDB divergences around grouping, and a list that
    // works locally but not on the server is worse than four lines of JS.
    const seen = new Set();
    const children = [];
    for (const r of rows) {
      if (seen.has(r.student_id)) continue;
      seen.add(r.student_id);
      children.push({
        student_id: r.student_id,
        name: r.name,
        class_name: r.class_name || null,
        section_name: r.section_name || null,
      });
    }

    return success(res, children);
  } catch (e) { return error(res, e.message, 500); }
});

// ── 5. One child's summary ─────────────────────────────────────────────────
router.get('/children/:studentId', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const studentId = Number.parseInt(req.params.studentId, 10);
    if (!Number.isInteger(studentId) || studentId <= 0) return error(res, 'Which child?', 400);

    /*
     * SECURITY CHECK 2 — is this actually your child.
     *
     * The only thing standing between a parent login and every child in the
     * school is this query. It joins client_parents BY user_id (never a
     * parent_id from the request), scopes to the token's org, and requires a
     * live link row. Without it, /children/:studentId is an id-iteration hole
     * onto other families' children — the same shape of bug that was already
     * found and fixed once on the parents list.
     *
     * `can_view_academics` is honoured because it exists and means exactly this:
     * a school can link a parent for fees or attendance without opening their
     * child's schoolwork. Defaults to allowed when unset.
     */
    const link = await queryOne(
      `SELECT 1 AS ok
         FROM client_parents p
         JOIN client_parent_students ps ON ps.parent_id = p.id AND ps.org_id = p.org_id
        WHERE p.user_id=? AND p.org_id=? AND ps.student_id=?
          AND COALESCE(ps.status,'active')='active'
          AND COALESCE(ps.can_view_academics, 1) = 1`,
      [req.user.user_id, orgId, studentId]);
    if (!link) return error(res, 'You can only see your own children here.', 403);

    const child = await queryOne(
      `SELECT s.id AS student_id,
              TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS name,
              e.section_id, c.id AS class_id, c.name AS class_name, c.standard, c.academic_year
         FROM client_students s
         JOIN client_users u ON u.id = s.user_id AND u.org_id = s.org_id
         LEFT JOIN client_enrollments e
              ON e.student_id = s.id AND e.org_id = s.org_id AND e.status='active'
         LEFT JOIN client_sections sec ON sec.id = e.section_id AND sec.org_id = s.org_id
         LEFT JOIN client_classes c ON c.id = sec.class_id AND c.org_id = s.org_id
        WHERE s.id=? AND s.org_id=?
        ORDER BY e.id DESC
        LIMIT 1`, [studentId, orgId]);
    if (!child) return error(res, 'We could not find that child.', 404);

    // Same per-subject resolver cost as /path — see the PERFORMANCE CEILING note.
    // This screen is not the 2-second landing screen, but it is not free either,
    // so it does the same bounded fan-out and nothing more.
    const subjects = [];
    let doneAll = 0;
    let totalAll = 0;
    // subject_key → the school's own word for it, collected as a by-product of
    // resolving. It is how the lists below can say "Science" instead of a code:
    // nothing else in the database maps a curriculum subject back to a school's
    // subject name, and re-deriving it per row would be a query per row.
    const subjectNameByKey = new Map();

    if (child.class_id) {
      const classRow = {
        id: child.class_id, name: child.class_name,
        standard: child.standard, academic_year: child.academic_year,
      };
      const list = await enabledSubjects(orgId, child.class_id);
      const resolved = await mapLimited(list, async (subjectRow) => {
        const out = await resolveForSubject({
          orgId, classRow, subjectRow,
          studentId, sectionId: child.section_id, includeDrafts: false,
        });
        return { subjectRow, out };
      });

      for (const { subjectRow, out } of resolved) {
        if (out.match.subject_key) subjectNameByKey.set(out.match.subject_key, subjectRow.name);
        if (!out.match.ok) { subjects.push({ id: subjectRow.id, name: subjectRow.name, pct: 0 }); continue; }
        const flat = walkItems(out.chapters);
        const done = flat.filter(isDone).length;
        doneAll += done;
        totalAll += flat.length;
        subjects.push({ id: subjectRow.id, name: subjectRow.name, pct: pctOf(done, flat.length) });
      }
    }

    // Time and marks. COUNT(score) counts only non-NULL scores, which is how
    // "has this child been scored at all" is answered without a second query.
    const agg = await queryOne(
      `SELECT COUNT(score) AS scored, AVG(score) AS avg_score, SUM(seconds_spent) AS secs
         FROM cie_progress WHERE org_id=? AND student_id=?`, [orgId, studentId]);

    let pending = 0;
    if (child.section_id) {
      const p = await queryOne(
        `SELECT COUNT(*) AS n
           FROM cie_assignments a
           LEFT JOIN cie_progress pr
                  ON pr.org_id = a.org_id AND pr.student_id = ?
                 AND pr.content_source = a.content_source AND pr.content_id = a.content_id
          WHERE a.org_id=? AND a.section_id=? AND a.status='active'
            AND COALESCE(pr.status,'not_started') <> 'done'`,
        [studentId, orgId, child.section_id]);
      pending = Number(p?.n || 0);
    }

    // ── Needs attention ─────────────────────────────────────────────────
    // Assigned, not finished, and due inside the next ten days — which the same
    // comparison also makes true for anything already overdue. A title is joined
    // from whichever library the item came from; one column cannot point at two
    // tables, so both are LEFT JOINed and the source picks the winner.
    let attention = [];
    if (child.section_id) {
      const rows = await query(
        `SELECT a.node_code, n.display_name AS topic_name, n.subject_key,
                a.content_source, a.content_id, a.due_date,
                COALESCE(p.title, ca.title) AS title,
                COALESCE(p.type, t.type_key) AS type
           FROM cie_assignments a
           JOIN cie_curriculum_nodes n ON n.node_code = a.node_code
           LEFT JOIN cie_progress pr
                  ON pr.org_id = a.org_id AND pr.student_id = ?
                 AND pr.content_source = a.content_source AND pr.content_id = a.content_id
           LEFT JOIN platform_content p
                  ON a.content_source = 'master' AND p.id = a.content_id
           LEFT JOIN client_cms_assets ca
                  ON a.content_source = 'org_private' AND ca.id = a.content_id AND ca.org_id = a.org_id
           LEFT JOIN client_cms_types t ON t.id = ca.content_type_id AND t.org_id = ca.org_id
          WHERE a.org_id=? AND a.section_id=? AND a.status='active'
            AND a.due_date IS NOT NULL
            AND a.due_date <= DATE_ADD(CURDATE(), INTERVAL ${ATTENTION_DAYS} DAY)
            AND COALESCE(pr.status,'not_started') <> 'done'
          ORDER BY a.due_date ASC
          LIMIT ${MAX_ATTENTION}`,
        [studentId, orgId, child.section_id]);

      attention = rows.map((r) => ({
        node_code: r.node_code,
        topic_name: r.topic_name,
        subject_name: subjectNameByKey.get(r.subject_key) || null,
        title: r.title,
        type: r.type,
        source: apiSource(r.content_source),
        content_id: r.content_id,
        due_date: r.due_date,
      }));
    }

    // ── Recently ────────────────────────────────────────────────────────
    // What the child actually opened, newest first. node_code is nullable on
    // cie_progress (progress is about the content, not the assignment), so the
    // subject may be unknown for a row — shown as nothing rather than guessed.
    const recentRows = await query(
      `SELECT pr.content_source, pr.content_id, pr.status, pr.last_seen_at,
              n.subject_key,
              COALESCE(p.title, ca.title) AS title,
              COALESCE(p.type, t.type_key) AS type
         FROM cie_progress pr
         LEFT JOIN cie_curriculum_nodes n ON n.node_code = pr.node_code
         LEFT JOIN platform_content p
                ON pr.content_source = 'master' AND p.id = pr.content_id
         LEFT JOIN client_cms_assets ca
                ON pr.content_source = 'org_private' AND ca.id = pr.content_id AND ca.org_id = pr.org_id
         LEFT JOIN client_cms_types t ON t.id = ca.content_type_id AND t.org_id = ca.org_id
        WHERE pr.org_id=? AND pr.student_id=?
        ORDER BY pr.last_seen_at DESC
        LIMIT ${MAX_RECENT}`, [orgId, studentId]);

    const recent = recentRows.map((r) => ({
      title: r.title,
      subject_name: subjectNameByKey.get(r.subject_key) || null,
      type: r.type,
      status: r.status,
      at: r.last_seen_at,
    }));

    const scored = Number(agg?.scored || 0);

    return success(res, {
      child: { student_id: child.student_id, name: child.name, class_name: child.class_name || null },
      totals: {
        // null when there is NOTHING to complete, not 0. pctOf() returns 0 for a
        // zero denominator, which makes "no work has been set for this class" and
        // "your child has finished none of it" arrive as the same number. On a
        // parent's screen that difference is the whole message, so it is decided
        // here rather than guessed in the UI.
        completed_pct: totalAll > 0 ? pctOf(doneAll, totalAll) : null,
        // null, never 0. "0" on a parent's screen reads as "my child scored
        // zero"; null means "not scored yet", which is what an empty column is.
        avg_score: scored > 0 && agg.avg_score != null ? Math.round(Number(agg.avg_score) * 10) / 10 : null,
        minutes: Math.round(Number(agg?.secs || 0) / 60),
        pending,
      },
      subjects,
      attention,
      recent,
    });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
