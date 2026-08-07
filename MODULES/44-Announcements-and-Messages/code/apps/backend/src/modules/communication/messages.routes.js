const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
// ONE definition of who teaches what, read in both directions —
// middleware/teacherScope.
const { teacherSectionsSql, sectionTeachersSql } = require('../../middleware/teacherScope');

router.use(authenticate);

// Internal messaging (teacher ↔ parent/student, staff ↔ anyone).
// Threads/messages live in client_message_threads / client_messages —
// the same tables the legacy /api/parents/messages* endpoints use, so
// both surfaces stay in sync.

// teacher/student/parent are relationship-gated; every other slug
// (owner/admin/principal/hod/accountant/…) is staff and may message
// anyone in the org.
const GATED_ROLES = ['teacher', 'student', 'parent'];

// Sections a teacher actually teaches.
//
// This used to be "timetable slots ∪ assignments they authored" — so at a
// school that had assigned its teachers but not yet drawn a timetable, a
// teacher could message nobody. It now resolves through the ONE teacher scope
// (timetable ∪ subject assignments ∪ class-teacher duty), keeping the authored-
// assignment branch on top. — JDPS P-0, 2026-07-29
function teacherSections(orgId, uid) {
  const scope = teacherSectionsSql(orgId, uid);
  return {
    sql: `${scope.sql}
          UNION
          SELECT section_id FROM client_assignments WHERE org_id=? AND teacher_id=? AND section_id IS NOT NULL`,
    params: [...scope.params, orgId, uid],
  };
}

/*
 * ── WHY EVERY FILTER BELOW IS IN SQL, AND NOT IN THE BROWSER ────────────────
 *
 * Each branch ends in LIMIT 200, and the compose modal used to fetch this list
 * ONCE with no query at all and then filter it in JavaScript. At a school with
 * more than 200 messageable people that is a silent truncation: choose
 * "Class 8 · B" and the picker answers "no match" for a section that is full of
 * children, because the 200 rows it happened to receive did not include them.
 *
 * A filter that can lie is worse than no filter. So category / class / section /
 * subject are applied HERE, and the limit bounds the FILTERED set. The endpoint
 * has always accepted `q` and the frontend never sent it; it does now.
 *
 * Nothing here widens who a person may message. Every filter is an AND on top of
 * the relationship gate that was already there, and `canMessage` re-checks the
 * recipient on send — a filter is a convenience, never a permission.
 */

// class / section narrowing, written once. `alias` is the client_sections row.
function sectionScopeClause(f, alias = 'sec') {
  const sql = [];
  const params = [];
  if (f.section_id) { sql.push(` AND ${alias}.id = ?`); params.push(f.section_id); }
  if (f.class_id)   { sql.push(` AND ${alias}.class_id = ?`); params.push(f.class_id); }
  return { sql: sql.join(''), params };
}

// Every subject this teacher is on the hook for, as one readable label.
// GROUP_CONCAT keeps it a single row per teacher — no fan-out, no GROUP BY on
// the outer query (see the staff branch for why that matters on MariaDB).
const SUBJECT_LABEL = `(SELECT GROUP_CONCAT(DISTINCT sub.name ORDER BY sub.name SEPARATOR ', ')
    FROM client_teacher_subjects tsub
    JOIN client_subjects sub ON sub.id = tsub.subject_id AND sub.org_id = tsub.org_id
   WHERE tsub.org_id = ? AND tsub.teacher_id = %TEACHER%)`;

const subjectLabelFor = (alias) => SUBJECT_LABEL.replace('%TEACHER%', `${alias}.id`);

// "…and is it THIS person?" — used by the permission gate, which must ask about
// one recipient rather than list the first 200 and look for them in it.
const idClause = (f, alias) =>
  f.recipient_id
    ? { sql: ` AND ${alias}.id = ?`, params: [f.recipient_id] }
    : { sql: '', params: [] };

// "…and they must teach THIS subject." EXISTS, not a join, so a teacher who
// teaches it in three sections is still one row.
function subjectFilter(f, orgId, alias) {
  if (!f.subject_id) return { sql: '', params: [] };
  return {
    sql: ` AND EXISTS (SELECT 1 FROM client_teacher_subjects tf
                        WHERE tf.org_id = ? AND tf.teacher_id = ${alias}.id AND tf.subject_id = ?)`,
    params: [orgId, f.subject_id],
  };
}

async function recipientsFor(user, orgId, q, filters = {}) {
  const role = user.role_slug;
  const uid = user.user_id;
  const like = `%${q || ''}%`;
  const f = filters || {};
  // Which KIND of person is being looked for. Same four buckets the message
  // list filters by, so the tab strip and this picker can never disagree.
  const cat = ['student', 'parent', 'teacher', 'staff'].includes(f.category) ? f.category : null;

  if (role === 'teacher') {
    const ts = teacherSections(orgId, uid);
    const scope = sectionScopeClause(f);
    const only = idClause(f, 'u');
    const onlyP = idClause(f, 'pu');
    // A teacher converses with the children they teach and those children's
    // parents — asking for teachers or staff here is not a narrower question,
    // it is a different one, and the answer is honestly empty.
    if (cat === 'teacher' || cat === 'staff') return [];

    const blocks = [];
    const params = [];
    if (cat !== 'parent') {
      blocks.push(
        `SELECT DISTINCT u.id AS user_id,
           CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
           'student' AS role, NULL AS student_name,
           sec.class_id AS class_id, c.name AS class_name,
           sec.id AS section_id, sec.name AS section_name, NULL AS subjects
         FROM client_enrollments e
         JOIN client_students s ON s.id=e.student_id
         JOIN client_users u ON u.id=s.user_id AND u.is_active=1
         JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         WHERE e.org_id=? AND e.status='active'
           AND e.section_id IN (${ts.sql})
           AND CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ?${scope.sql}${only.sql}`
      );
      params.push(orgId, ...ts.params, like, ...scope.params, ...only.params);
    }
    if (cat !== 'student') {
      blocks.push(
        `SELECT DISTINCT pu.id AS user_id,
           CONCAT(pu.first_name,' ',COALESCE(pu.last_name,'')) AS name,
           'parent' AS role,
           CONCAT(su.first_name,' ',COALESCE(su.last_name,'')) AS student_name,
           sec.class_id AS class_id, c.name AS class_name,
           sec.id AS section_id, sec.name AS section_name, NULL AS subjects
         FROM client_enrollments e
         JOIN client_parent_students ps ON ps.student_id=e.student_id
         JOIN client_parents p ON p.id=ps.parent_id
         JOIN client_users pu ON pu.id=p.user_id AND pu.is_active=1
         JOIN client_students s2 ON s2.id=e.student_id
         JOIN client_users su ON su.id=s2.user_id
         JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         WHERE e.org_id=? AND e.status='active'
           AND e.section_id IN (${ts.sql})
           AND CONCAT(pu.first_name,' ',COALESCE(pu.last_name,'')) LIKE ?${scope.sql}${onlyP.sql}`
      );
      params.push(orgId, ...ts.params, like, ...scope.params, ...onlyP.params);
    }
    return query(`${blocks.join(' UNION ')} ORDER BY role, name LIMIT 200`, params);
  }

  // The reverse direction. These joined client_timetable_slots directly, so a
  // parent or student at a school with no timetable could not reach a single
  // teacher — not even their own class teacher. Both now read the same relation
  // the teacher side does. — JDPS P-0, 2026-07-29
  // A parent and a student both converse with TEACHERS, so class/section is not
  // a question they can ask — they have exactly one. The filter that means
  // something to them is the subject.
  if (role === 'parent') {
    if (cat && cat !== 'teacher') return [];
    const st = sectionTeachersSql(orgId);
    const sub = subjectFilter(f, orgId, 'tu');
    const only = idClause(f, 'tu');
    return query(
      `SELECT DISTINCT tu.id AS user_id,
         CONCAT(tu.first_name,' ',COALESCE(tu.last_name,'')) AS name,
         'teacher' AS role,
         CONCAT(su.first_name,' ',COALESCE(su.last_name,'')) AS student_name,
         sec.class_id AS class_id, c.name AS class_name,
         sec.id AS section_id, sec.name AS section_name,
         ${subjectLabelFor('tu')} AS subjects
       FROM client_parents p
       JOIN client_parent_students ps ON ps.parent_id=p.id
       JOIN client_enrollments e ON e.student_id=ps.student_id AND e.status='active'
       JOIN (${st.sql}) sect ON sect.section_id=e.section_id
       JOIN client_users tu ON tu.id=sect.teacher_id AND tu.is_active=1 AND tu.org_id=p.org_id
       JOIN client_students s ON s.id=ps.student_id
       JOIN client_users su ON su.id=s.user_id
       JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes c ON c.id=sec.class_id
       WHERE p.org_id=? AND p.user_id=?
         AND CONCAT(tu.first_name,' ',COALESCE(tu.last_name,'')) LIKE ?${sub.sql}${only.sql}
       ORDER BY name LIMIT 200`,
      [orgId, ...st.params, orgId, uid, like, ...sub.params, ...only.params]
    );
  }

  if (role === 'student') {
    if (cat && cat !== 'teacher') return [];
    const st = sectionTeachersSql(orgId);
    const sub = subjectFilter(f, orgId, 'tu');
    const only = idClause(f, 'tu');
    return query(
      `SELECT DISTINCT tu.id AS user_id,
         CONCAT(tu.first_name,' ',COALESCE(tu.last_name,'')) AS name,
         'teacher' AS role, NULL AS student_name,
         sec.class_id AS class_id, c.name AS class_name,
         sec.id AS section_id, sec.name AS section_name,
         ${subjectLabelFor('tu')} AS subjects
       FROM client_students s
       JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
       JOIN (${st.sql}) sect ON sect.section_id=e.section_id
       JOIN client_users tu ON tu.id=sect.teacher_id AND tu.is_active=1 AND tu.org_id=s.org_id
       JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes c ON c.id=sec.class_id
       WHERE s.org_id=? AND s.user_id=?
         AND CONCAT(tu.first_name,' ',COALESCE(tu.last_name,'')) LIKE ?${sub.sql}${only.sql}
       ORDER BY name LIMIT 200`,
      [orgId, ...st.params, orgId, uid, like, ...sub.params, ...only.params]
    );
  }

  // ── Staff (owner/admin/principal/hod/…): anyone active in the org ──────────
  //
  // The flat list at the bottom is UNCHANGED on purpose: with no category and no
  // class/section this endpoint runs the query it has always run. A category is
  // a different question, so it gets a query shaped for it — which is also what
  // makes the class/section labels possible at all, because the flat list has no
  // idea which of its rows is a child.
  //
  // ⚠ None of the branches below uses GROUP BY. The flat one does
  // (MIN(base_role) + GROUP BY u.id), and adding selected columns to THAT is
  // exactly how MariaDB's ONLY_FULL_GROUP_BY rejects a query that passed on a
  // developer's MySQL. Correlated subqueries instead: one row per person, no
  // grouping, nothing to drift between the two engines.
  const scope = sectionScopeClause(f);
  const only = idClause(f, 'u');
  const onlyP = idClause(f, 'pu');
  const wantsSection = !!(f.class_id || f.section_id);

  // A class or section names CHILDREN. Asked for with no category, it means the
  // people OF that section — the children and their parents, not one or other.
  const kinds = cat ? [cat] : (wantsSection ? ['student', 'parent'] : []);

  if (kinds.length) {
    const blocks = [];
    const params = [];
    if (kinds.includes('student')) {
      blocks.push(
        `SELECT DISTINCT u.id AS user_id,
           CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
           'student' AS role, NULL AS student_name,
           sec.class_id AS class_id, c.name AS class_name,
           sec.id AS section_id, sec.name AS section_name, NULL AS subjects
         FROM client_enrollments e
         JOIN client_students s ON s.id=e.student_id
         JOIN client_users u ON u.id=s.user_id AND u.is_active=1
         JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         WHERE e.org_id=? AND e.status='active' AND u.id != ?
           AND CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ?${scope.sql}${only.sql}`
      );
      params.push(orgId, uid, like, ...scope.params, ...only.params);
    }
    if (kinds.includes('parent')) {
      blocks.push(
        `SELECT DISTINCT pu.id AS user_id,
           CONCAT(pu.first_name,' ',COALESCE(pu.last_name,'')) AS name,
           'parent' AS role,
           CONCAT(su.first_name,' ',COALESCE(su.last_name,'')) AS student_name,
           sec.class_id AS class_id, c.name AS class_name,
           sec.id AS section_id, sec.name AS section_name, NULL AS subjects
         FROM client_enrollments e
         JOIN client_parent_students ps ON ps.student_id=e.student_id
         JOIN client_parents p ON p.id=ps.parent_id
         JOIN client_users pu ON pu.id=p.user_id AND pu.is_active=1
         JOIN client_students s2 ON s2.id=e.student_id
         JOIN client_users su ON su.id=s2.user_id
         JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         WHERE e.org_id=? AND e.status='active' AND pu.id != ?
           AND CONCAT(pu.first_name,' ',COALESCE(pu.last_name,'')) LIKE ?${scope.sql}${onlyP.sql}`
      );
      params.push(orgId, uid, like, ...scope.params, ...onlyP.params);
    }
    if (kinds.includes('teacher')) {
      const sub = subjectFilter(f, orgId, 'u');
      blocks.push(
        `SELECT u.id AS user_id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
           'teacher' AS role, NULL AS student_name, NULL AS class_id, NULL AS class_name,
           NULL AS section_id, NULL AS section_name, ${subjectLabelFor('u')} AS subjects
         FROM client_users u
         WHERE u.org_id=? AND u.is_active=1 AND u.id != ?
           AND EXISTS (SELECT 1 FROM client_user_roles ur
                         JOIN client_roles r ON r.id=ur.role_id
                        WHERE ur.user_id=u.id AND r.base_role='teacher')
           AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR u.email LIKE ?)${sub.sql}${only.sql}`
      );
      params.push(orgId, orgId, uid, like, like, ...sub.params, ...only.params);
    }
    if (kinds.includes('staff')) {
      // Everyone who is NOT a child, a parent or a teacher — including a user
      // with no role row at all, who is staff by elimination and would otherwise
      // be reachable from no category whatsoever. Same catch-all rule the
      // message list's buckets use, so the two always agree.
      blocks.push(
        `SELECT u.id AS user_id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
           'staff' AS role, NULL AS student_name, NULL AS class_id, NULL AS class_name,
           NULL AS section_id, NULL AS section_name, NULL AS subjects
         FROM client_users u
         WHERE u.org_id=? AND u.is_active=1 AND u.id != ?
           AND NOT EXISTS (SELECT 1 FROM client_user_roles ur
                             JOIN client_roles r ON r.id=ur.role_id
                            WHERE ur.user_id=u.id AND r.base_role IN ('student','parent','teacher'))
           AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR u.email LIKE ?)${only.sql}`
      );
      params.push(orgId, uid, like, like, ...only.params);
    }
    return query(`${blocks.join(' UNION ')} ORDER BY role, name LIMIT 200`, params);
  }

  return query(
    `SELECT u.id AS user_id,
       CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
       COALESCE(MIN(r.base_role),'staff') AS role, NULL AS student_name
     FROM client_users u
     LEFT JOIN client_user_roles ur ON ur.user_id=u.id
     LEFT JOIN client_roles r ON r.id=ur.role_id
     WHERE u.org_id=? AND u.is_active=1 AND u.id != ?
       AND (CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) LIKE ? OR u.email LIKE ?)
     GROUP BY u.id ORDER BY name LIMIT 200`,
    [orgId, uid, like, like]
  );
}

async function canMessage(user, orgId, toUserId) {
  if (!GATED_ROLES.includes(user.role_slug)) {
    // Staff: target just has to be a real active user in the same org.
    const u = await queryOne('SELECT 1 FROM client_users WHERE id=? AND org_id=? AND is_active=1', [toUserId, orgId]);
    return !!u;
  }
  const id = parseInt(toUserId, 10);
  if (!id) return false;
  // Ask about THIS person, rather than listing the first 200 recipients and
  // looking for them in it. Those are different questions, and the difference
  // shows the day a teacher has more than 200 students and parents: the list is
  // cut, the child is not in it, and the teacher is told they may not message a
  // child they teach. The picker can now filter its way to that child (class /
  // section / search all run in SQL), so a truncated gate would refuse a
  // recipient the app itself just offered.
  const list = await recipientsFor(user, orgId, '', { recipient_id: id });
  return list.some(r => r.user_id === id);
}

// ── My threads ───────────────────────────────────────────────────────────────
router.get('/threads', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const threads = await query(
      `SELECT t.*,
        CONCAT(u.first_name,' ',u.last_name) AS other_name,
        u.avatar AS other_avatar, u.email AS other_email,
        (SELECT r.base_role FROM client_user_roles ur
           JOIN client_roles r ON r.id=ur.role_id
          WHERE ur.user_id=u.id ORDER BY r.id LIMIT 1) AS other_role,
        CONCAT(su.first_name,' ',su.last_name) AS student_name
       FROM client_message_threads t
       JOIN client_users u ON u.id = CASE
         WHEN t.participant_a=? THEN t.participant_b ELSE t.participant_a END
       LEFT JOIN client_students cs ON cs.id=t.student_id
       LEFT JOIN client_users su ON su.id=cs.user_id
       WHERE t.org_id=? AND (t.participant_a=? OR t.participant_b=?)
       ORDER BY t.last_msg_at DESC`,
      [uid, o, uid, uid]
    );
    return success(res, { threads });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Who can I message ────────────────────────────────────────────────────────
// Filters narrow the answer; they never widen it. Ids are coerced to integers
// here and only ever reach the query as bound parameters (§17).
router.get('/recipients', async (req, res) => {
  try {
    const num = (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    const recipients = await recipientsFor(req.user, req.user.org_id, req.query.q, {
      category:   req.query.category,
      class_id:   num(req.query.class_id),
      section_id: num(req.query.section_id),
      subject_id: num(req.query.subject_id),
    });
    return success(res, { recipients });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Unread badge ─────────────────────────────────────────────────────────────
router.get('/unread-count', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const row = await queryOne(
      `SELECT COALESCE(SUM(CASE
         WHEN participant_a=? THEN unread_a
         WHEN participant_b=? THEN unread_b ELSE 0 END),0) AS unread
       FROM client_message_threads
       WHERE org_id=? AND (participant_a=? OR participant_b=?)`,
      [uid, uid, o, uid, uid]
    );
    return success(res, { unread_count: parseInt(row?.unread || 0) });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Thread messages (marks read) ─────────────────────────────────────────────
router.get('/threads/:threadId', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const thread = await queryOne(
      'SELECT participant_a, participant_b FROM client_message_threads WHERE id=? AND org_id=? LIMIT 1',
      [req.params.threadId, o]
    );
    if (!thread || (thread.participant_a !== uid && thread.participant_b !== uid)) {
      return error(res, 'Forbidden', 403);
    }
    const msgs = await query(
      `SELECT m.*, CONCAT(u.first_name,' ',u.last_name) AS sender_name, u.avatar AS sender_avatar
       FROM client_messages m
       JOIN client_users u ON u.id=m.sender_id
       WHERE m.thread_id=? AND m.org_id=?
       ORDER BY m.created_at ASC`,
      [req.params.threadId, o]
    );
    await query(
      `UPDATE client_message_threads SET
       unread_a = CASE WHEN participant_a=? THEN 0 ELSE unread_a END,
       unread_b = CASE WHEN participant_b=? THEN 0 ELSE unread_b END
       WHERE id=? AND org_id=?`,
      [uid, uid, req.params.threadId, o]
    );
    await query(
      'UPDATE client_messages SET is_read=1 WHERE thread_id=? AND sender_id!=? AND org_id=?',
      [req.params.threadId, uid, o]
    );
    return success(res, { messages: msgs });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Send (reply or start a thread) ───────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const { to_user_id, subject, body, student_id, thread_id } = req.body;
    if (!body) return error(res, 'body required', 400);

    let tId = thread_id;
    if (tId) {
      // Reply: caller must be a participant (else anyone could inject into
      // arbitrary threads by guessing ids).
      const thread = await queryOne(
        'SELECT participant_a, participant_b FROM client_message_threads WHERE id=? AND org_id=? LIMIT 1',
        [tId, o]
      );
      if (!thread || (thread.participant_a !== uid && thread.participant_b !== uid)) {
        return error(res, 'Forbidden', 403);
      }
    } else {
      if (!to_user_id || !subject) return error(res, 'to_user_id and subject required for new thread', 400);
      if (parseInt(to_user_id) === uid) return error(res, 'Cannot message yourself', 400);
      // Relationship gate: teacher↔their students/parents, parent/student↔their
      // teachers; staff may message anyone in-org.
      if (!(await canMessage(req.user, o, to_user_id))) {
        return error(res, 'You can only message people connected to your classes', 403);
      }
      const existing = await queryOne(
        `SELECT id FROM client_message_threads
         WHERE org_id=? AND ((participant_a=? AND participant_b=?) OR (participant_a=? AND participant_b=?))
         AND subject=? LIMIT 1`,
        [o, uid, to_user_id, to_user_id, uid, subject]
      );
      if (existing) {
        tId = existing.id;
      } else {
        const tRes = await query(
          `INSERT INTO client_message_threads
           (org_id,subject,participant_a,participant_b,student_id,last_message,last_msg_at,unread_a,unread_b)
           VALUES (?,?,?,?,?,?,NOW(),0,1)`,
          [o, subject, uid, to_user_id, student_id || null, body]
        );
        tId = tRes.insertId;
      }
    }

    await query(
      'INSERT INTO client_messages (org_id,thread_id,sender_id,body) VALUES (?,?,?,?)',
      [o, tId, uid, body]
    );
    await query(
      `UPDATE client_message_threads SET
       last_message=?, last_msg_at=NOW(),
       unread_a = CASE WHEN participant_b=? THEN unread_a+1 ELSE unread_a END,
       unread_b = CASE WHEN participant_a=? THEN unread_b+1 ELSE unread_b END
       WHERE id=?`,
      [body, uid, uid, tId]
    );
    return success(res, { thread_id: tId }, 'Message sent', 201);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
