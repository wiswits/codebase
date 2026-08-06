const express  = require('express');
const router   = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error, paginated } = require('../../utils/response');
const { needsAdminApproval } = require('../../middleware/destructiveApproval');
const lifecycle = require('../../services/personLifecycle');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const logger   = require('../../utils/logger');
const { buildNameSearch } = require('../../utils/sqlBuild');
const { checkEmail } = require('../../utils/validate');
const { tempPassword } = require('../../utils/tempPassword');
// ONE definition of announcement visibility/targeting — utils/announcementTargeting.js
const { announcementVisibleSql } = require('../../utils/announcementTargeting');
// ONE definition of "who teaches this section" — shared with the admin's class
// card and the student portal.
const { getSectionProfile } = require('../../services/sectionProfile');

router.use(authenticate);

// Admin parent-management surface (roster, PII, children fees/attendance,
// account create/edit). Students/parents must not reach it — the parent
// self-service portal uses the /me + /portal routes which derive from req.user.
const requireStaff = requireRole('owner', 'admin', 'principal', 'coordinator', 'hod');

// ─── HELPERS ────────────────────────────────────────────────────────────────
const hashPassword = async (plain) => {
  const { hash } = require('../../core/auth/password');
  return hash(plain);
};

// The local generator this replaced built the password from Math.random(),
// which is not a CSPRNG — a predictable first credential is the same class of
// problem as a shared one (utils/tempPassword.js, 31-Jul-2026). One generator
// for the whole platform, seeded from crypto.

const parentQuery = (orgId, extra = '', params = []) => query(
  `SELECT
    p.id, p.user_id, p.occupation, p.education, p.alternate_phone,
    p.address, p.city, p.state, p.pincode, p.portal_access, p.notes,
    p.created_at,
    u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
    (SELECT COUNT(*) FROM client_parent_students ps WHERE ps.parent_id=p.id) AS child_count,
    (SELECT COUNT(*) FROM client_parent_meetings m
     WHERE m.parent_id=p.id AND m.status='pending') AS pending_meetings,
    (SELECT COUNT(*) FROM client_message_threads t
     WHERE t.org_id=p.org_id
       AND (t.participant_a=p.user_id OR t.participant_b=p.user_id)
       AND (CASE WHEN t.participant_a=p.user_id THEN t.unread_a ELSE t.unread_b END) > 0
    ) AS unread_messages
   FROM client_parents p
   JOIN client_users u ON u.id = p.user_id
   WHERE p.org_id = ? ${extra}
   ORDER BY u.first_name ASC`,
  [orgId, ...params]
);

// ─── STATS ──────────────────────────────────────────────────────────────────
router.get('/stats', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const row = await queryOne(
      // WW-96: the header ("23 parents") comes from the LIST, which applies the
      // soft-delete filter `u.is_active=1`; this card counted client_parents raw
      // and said 25. Two numbers for one question, on one screen, neither of them
      // labelled. The card follows the list — a removed parent is not a parent —
      // and `mapped` follows it too, so "100% mapped" is a percentage of the same
      // population the reader is looking at.
      `SELECT
        (SELECT COUNT(*) FROM client_parents p JOIN client_users u ON u.id=p.user_id
         WHERE p.org_id=? AND u.is_active=1) AS total,
        (SELECT COUNT(*) FROM client_parents p JOIN client_users u ON u.id=p.user_id
         WHERE p.org_id=? AND p.portal_access=1 AND u.is_active=1) AS active_logins,
        (SELECT COUNT(*) FROM client_parent_meetings
         WHERE org_id=? AND status='pending') AS pending_meetings,
        (SELECT COUNT(*) FROM client_message_threads
         WHERE org_id=? AND (unread_a>0 OR unread_b>0)) AS unread_threads,
        (SELECT COUNT(*) FROM client_parent_students WHERE org_id=?) AS total_links,
        (SELECT COUNT(DISTINCT ps.parent_id) FROM client_parent_students ps
           JOIN client_parents p ON p.id=ps.parent_id
           JOIN client_users u ON u.id=p.user_id
          WHERE ps.org_id=? AND u.is_active=1) AS mapped`,
      [o,o,o,o,o,o]
    );
    return success(res, row);
  } catch(e) { logger.error('Parent stats:', e); return error(res, e.message, 500); }
});

// ─── LIST ───────────────────────────────────────────────────────────────────
router.get('/', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { search='', class_id, page=1, limit=20 } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);

    let where = '';
    const params = [];

    if (search) {
      // Principal §12.2: also match occupation and the CHILD's name/admission no.
      // buildNameSearch adds the full-name ("First Last") + reversed match that a
      // per-column LIKE can never satisfy.
      const ns = buildNameSearch(search, 'u', ['u.email', 'u.phone', 'p.occupation']);
      const q = `%${String(search).trim().replace(/\s+/g,' ')}%`;
      where += ` AND (${ns.clause}
        OR EXISTS (
          SELECT 1 FROM client_parent_students ps2
          JOIN client_students cs2 ON cs2.id=ps2.student_id
          JOIN client_users cu2 ON cu2.id=cs2.user_id
          WHERE ps2.parent_id=p.id
            AND (CONCAT(cu2.first_name,' ',COALESCE(cu2.last_name,'')) LIKE ?
              OR CONCAT(COALESCE(cu2.last_name,''),' ',cu2.first_name) LIKE ?
              OR cs2.admission_number LIKE ?)
        ))`;
      params.push(...ns.values, q, q, q);
    }
    // Principal §12.1: Portal Active card click-filters to INACTIVE profiles
    if (req.query.portal === 'inactive') {
      where += ` AND (p.portal_access=0 OR u.is_active=0)`;
    } else if (req.query.status === 'inactive') {
      where += ` AND u.is_active=0`;
    } else if (req.query.status !== 'all') {
      // Soft-delete: DELETE /parents/:id sets is_active=0. Without this the
      // "removed" parent stayed in the roster forever (same defect as students).
      where += ` AND u.is_active=1`;
    }
    if (class_id) {
      where += ` AND EXISTS (
        SELECT 1 FROM client_parent_students ps
        JOIN client_students st ON st.id=ps.student_id
        JOIN client_enrollments e ON e.student_id=st.id
        JOIN client_sections sec ON sec.id=e.section_id
        WHERE ps.parent_id=p.id AND sec.class_id=?
      )`;
      params.push(class_id);
    }

    const countRow = await queryOne(
      `SELECT COUNT(*) AS total FROM client_parents p
       JOIN client_users u ON u.id=p.user_id
       WHERE p.org_id=? ${where}`, [o,...params]
    );

    const rows = await query(
      `SELECT
        p.id, p.user_id, p.occupation, p.education, p.alternate_phone,
        p.city, p.state, p.portal_access, p.created_at,
        u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active,
        (SELECT COUNT(*) FROM client_parent_students ps WHERE ps.parent_id=p.id) AS child_count,
        (SELECT COUNT(*) FROM client_parent_meetings m WHERE m.parent_id=p.id AND m.status='pending') AS pending_meetings,
        (SELECT GROUP_CONCAT(CONCAT(cu.first_name,' ',cu.last_name) ORDER BY cs.id SEPARATOR ', ')
         FROM client_parent_students ps
         JOIN client_students cs ON cs.id=ps.student_id
         JOIN client_users cu ON cu.id=cs.user_id
         WHERE ps.parent_id=p.id LIMIT 3) AS children_names,
        (SELECT GROUP_CONCAT(cs.id ORDER BY cs.id SEPARATOR ',')
         FROM client_parent_students ps
         JOIN client_students cs ON cs.id=ps.student_id
         WHERE ps.parent_id=p.id LIMIT 3) AS children_ids
       FROM client_parents p
       JOIN client_users u ON u.id=p.user_id
       WHERE p.org_id=? ${where}
       ORDER BY u.first_name ASC
       LIMIT ? OFFSET ?`,
      [o,...params,parseInt(limit),offset]
    );
    return paginated(res, rows, countRow.total, page, limit, 'Parents fetched');
  } catch(e) { logger.error('Parent list:', e); return error(res, e.message, 500); }
});

// ─── GET ONE ────────────────────────────────────────────────────────────────
router.get('/:id', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const parent = await queryOne(
      `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active
       FROM client_parents p JOIN client_users u ON u.id=p.user_id
       WHERE p.id=? AND p.org_id=?`, [req.params.id, o]
    );
    if (!parent) return error(res, 'Parent not found', 404);

    const children = await query(
      `SELECT
        ps.id AS link_id, ps.relation, ps.is_primary,
        cs.id AS student_id, cs.admission_number,
        u.first_name, u.last_name, u.email, u.phone,
        sec.name AS section_name, cl.name AS class_name,
        (SELECT ROUND(SUM(ar.status='present')/NULLIF(COUNT(*),0)*100,1)
         FROM client_attendance_records ar WHERE ar.student_id=cs.id AND ar.org_id=?) AS attendance_pct,
        (SELECT COALESCE(SUM(fa.final_amount),0)-COALESCE(SUM(fp.amount),0)
         FROM client_fee_assignments fa
         LEFT JOIN client_fee_payments fp ON fp.fee_assignment_id=fa.id AND fp.status='completed'
         WHERE fa.student_id=cs.id AND fa.org_id=?) AS fees_due
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=?`,
      [o,o,req.params.id,o]
    );

    const meetings = await query(
      `SELECT m.*, CONCAT(u.first_name,' ',u.last_name) AS teacher_name
       FROM client_parent_meetings m
       JOIN client_users u ON u.id=m.teacher_id
       WHERE m.parent_id=? AND m.org_id=?
       ORDER BY m.created_at DESC LIMIT 10`,
      [req.params.id, o]
    );

    const threads = await query(
      `SELECT t.*,
        CONCAT(u.first_name,' ',u.last_name) AS other_name,
        u.avatar AS other_avatar
       FROM client_message_threads t
       JOIN client_users u ON u.id = CASE
         WHEN t.participant_a=? THEN t.participant_b ELSE t.participant_a END
       WHERE t.org_id=? AND (t.participant_a=? OR t.participant_b=?)
       ORDER BY t.last_msg_at DESC LIMIT 10`,
      [parent.user_id, o, parent.user_id, parent.user_id]
    );

    return success(res, { parent, children, meetings, threads });
  } catch(e) { logger.error('Parent getOne:', e); return error(res, e.message, 500); }
});

// ─── CREATE ─────────────────────────────────────────────────────────────────
router.post('/', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      first_name, last_name, phone,
      occupation, education, alternate_phone,
      address, city, state, pincode, notes,
      student_ids = [], relation = 'guardian'
    } = req.body;

    if (!first_name || !req.body.email) return error(res, 'first_name and email required', 400);

    // This becomes their login — see checkEmail (WW-33).
    const em = checkEmail(req.body.email, 'Login email');
    if (!em.ok) return error(res, em.message, 400);
    const email = em.value;

    const existing = await queryOne('SELECT id FROM client_users WHERE email=?', [email]);
    if (existing) return error(res, 'Email already registered', 409);

    // The office creating the account may choose the password (they are the
    // ones who have to read it out); otherwise we mint one. Either way it is
    // returned once below so it can actually be handed over.
    const plainPwd = (req.body.password && String(req.body.password)) || tempPassword();
    const pwd_hash = await hashPassword(plainPwd);

    const parentRoleId = await queryOne(
      `SELECT id FROM client_roles WHERE base_role='parent' AND org_id=? ORDER BY id DESC LIMIT 1`, [o]
    );

    const uRes = await query(
      `INSERT INTO client_users (org_id,email,phone,password_hash,first_name,last_name)
       VALUES (?,?,?,?,?,?)`,
      [o, email, phone||null, pwd_hash, first_name, last_name||'']
    );
    const userId = uRes.insertId;

    if (parentRoleId) {
      await query('INSERT IGNORE INTO client_user_roles (org_id,user_id,role_id) VALUES (?,?,?)',
        [o, userId, parentRoleId.id]);
    }

    const pRes = await query(
      `INSERT INTO client_parents
       (org_id,user_id,occupation,education,alternate_phone,address,city,state,pincode,notes,portal_access)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [o,userId,occupation||null,education||null,alternate_phone||null,
       address||null,city||null,state||null,pincode||null,notes||null]
    );
    const parentId = pRes.insertId;

    // Link children
    for (const sid of student_ids) {
      const st = await queryOne('SELECT id FROM client_students WHERE id=? AND org_id=?',[sid,o]);
      if (st) {
        await query(
          `INSERT IGNORE INTO client_parent_students (org_id,parent_id,student_id,relation,is_primary)
           VALUES (?,?,?,?,1)`, [o,parentId,sid,relation]
        );
      }
    }

    await query(
      `INSERT INTO client_audit_logs (org_id,user_id,action,entity_type,entity_id)
       VALUES (?,?,?,?,?)`,
      [o,req.user.user_id,'CREATE_PARENT','parent',parentId]
    ).catch(()=>{});

    logger.info(`Parent created: ${email} (org:${o})`);
    return success(res, { parent_id: parentId, user_id: userId, temp_password: plainPwd,
      email, message: 'Parent created. Share the temp_password with them.' }, 'Parent created', 201);
  } catch(e) { logger.error('Parent create:', e); return error(res, e.message, 500); }
});

// ─── UPDATE ─────────────────────────────────────────────────────────────────
router.put('/:id', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const p = await queryOne('SELECT * FROM client_parents WHERE id=? AND org_id=?',[req.params.id,o]);
    if (!p) return error(res,'Parent not found',404);

    const { first_name,last_name,phone,occupation,education,
            alternate_phone,address,city,state,pincode,notes,portal_access } = req.body;

    await query(
      'UPDATE client_users SET first_name=?,last_name=?,phone=? WHERE id=?',
      [first_name,last_name,phone||null,p.user_id]
    );
    await query(
      `UPDATE client_parents SET occupation=?,education=?,alternate_phone=?,
       address=?,city=?,state=?,pincode=?,notes=?,portal_access=? WHERE id=?`,
      [occupation||null,education||null,alternate_phone||null,
       address||null,city||null,state||null,pincode||null,notes||null,
       portal_access??1,req.params.id]
    );
    return success(res,{},'Parent updated');
  } catch(e) { return error(res,e.message,500); }
});

// ─── DELETE (soft) ───────────────────────────────────────────────────────────
// Same routing as the teacher and student deletes (AK, 2026-07-30): leadership
// removes now with ten seconds of Undo; everyone else deactivates the parent and
// files it for an admin. One rule, in middleware/destructiveApproval.js.
router.delete('/:id', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const p = await queryOne('SELECT * FROM client_parents WHERE id=? AND org_id=?',[req.params.id,o]);
    if (!p) return error(res,'Parent not found',404);
    const person = await lifecycle.resolveUser(o, 'parent', req.params.id);
    await lifecycle.deactivate(o, p.user_id);

    if (needsAdminApproval(req)) {
      const { alreadyPending } = await lifecycle.requestDeletion(req, 'parent', Number(req.params.id), person || {});
      return success(res, { pending_approval: true }, alreadyPending
        ? 'Already waiting for an admin to approve'
        : 'Removed from the lists — an admin will confirm the deletion');
    }
    return success(res,{ pending_approval: false },'Parent removed');
  } catch(e) { return error(res,e.message,500); }
});

// Undo / reactivate — one endpoint for both, same as teachers.
router.post('/:id/activate', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const p = await queryOne('SELECT user_id FROM client_parents WHERE id=? AND org_id=?',[req.params.id,o]);
    if (!p) return error(res,'Parent not found',404);
    await lifecycle.activate(o, p.user_id);
    await query(
      `UPDATE client_student_change_requests SET status='cancelled'
        WHERE org_id=? AND entity_type='parent' AND student_id=? AND change_type='delete' AND status='pending'`,
      [o, req.params.id]);
    return success(res,{},'Parent restored');
  } catch(e) { return error(res,e.message,500); }
});

// ─── CHILDREN LINK/UNLINK ────────────────────────────────────────────────────
router.post('/:id/children', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { student_id, relation='guardian' } = req.body;
    const p = await queryOne('SELECT id FROM client_parents WHERE id=? AND org_id=?',[req.params.id,o]);
    if (!p) return error(res,'Parent not found',404);
    const st = await queryOne('SELECT id FROM client_students WHERE id=? AND org_id=?',[student_id,o]);
    if (!st) return error(res,'Student not found',404);
    await query(
      `INSERT INTO client_parent_students (org_id,parent_id,student_id,relation,is_primary)
       VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE relation=VALUES(relation)`,
      [o,req.params.id,student_id,relation]
    );
    return success(res,{},'Child linked');
  } catch(e) { return error(res,e.message,500); }
});

router.delete('/:id/children/:studentId', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    await query(
      'DELETE FROM client_parent_students WHERE parent_id=? AND student_id=? AND org_id=?',
      [req.params.id,req.params.studentId,o]
    );
    return success(res,{},'Child unlinked');
  } catch(e) { return error(res,e.message,500); }
});

// ─── MEETINGS ────────────────────────────────────────────────────────────────
// Parent's own meetings (SUG-0061 §3) — /meetings/all is staff-only, so the
// parent portal reads this instead. Scoped to the logged-in parent's row.
router.get('/meetings/mine', async (req, res) => {
  try {
    const o = req.user.org_id;
    const p = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, req.user.user_id]);
    if (!p) return success(res, { meetings: [] });
    const rows = await query(
      `SELECT m.*,
              CONCAT(tu.first_name,' ',COALESCE(tu.last_name,'')) AS teacher_name,
              CONCAT(su.first_name,' ',COALESCE(su.last_name,'')) AS student_name
         FROM client_parent_meetings m
         JOIN client_users tu ON tu.id=m.teacher_id
         LEFT JOIN client_students cs ON cs.id=m.student_id
         LEFT JOIN client_users su ON su.id=cs.user_id
        WHERE m.org_id=? AND m.parent_id=?
        ORDER BY COALESCE(m.confirmed_date, m.requested_date) DESC, m.id DESC
        LIMIT 100`, [o, p.id]);
    return success(res, { meetings: rows });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * WHO MAY RUN A STAFF MEETING — one list, two consumers.
 *
 * The picker below and the schedule endpoint had SEPARATE lists, and they
 * disagreed: `academic_coordinator` could load the staff roster and then be
 * refused on submit. A permission answered twice is a permission that drifts,
 * so both read this.
 */
const MEET_ELEVATED = ['owner','admin','principal','coordinator','academic_coordinator','hod','super_admin','system_admin'];

/*
 * The staff a meeting can be scheduled with, split Academic / Non-Academic.
 *
 * `staff_kind` ('teaching' | 'support') is the platform's own split, added by
 * migration 049 and re-asserted by 061. It is NOT guessed from the role at read
 * time: a principal who teaches and one who does not are the same role, and the
 * school corrects the person on the staff form. Anyone still NULL after the
 * backfill is listed under support rather than dropped — a person missing from
 * the picker is a person who cannot be invited to anything.
 *
 * Elevated only, matching who may actually schedule a staff meeting.
 */
router.get('/meetings/staff', requireRole(...MEET_ELEVATED), async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query(
      `SELECT u.id AS user_id,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
              COALESCE(u.staff_kind,'support') AS staff_kind,
              s.designation AS designation
         FROM client_users u
         LEFT JOIN client_staff s ON s.user_id=u.id AND s.org_id=u.org_id
        WHERE u.org_id=? AND u.is_active=1 AND u.id<>?
          AND NOT EXISTS (SELECT 1 FROM client_user_roles ur
                            JOIN client_roles r ON r.id=ur.role_id
                           WHERE ur.user_id=u.id AND r.base_role IN ('student','parent'))
        ORDER BY staff_kind DESC, name
        LIMIT 500`,
      [o, req.user.user_id]);
    return success(res, { staff: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/meetings/all', requireRole('owner','admin','principal','coordinator','academic_coordinator','hod','super_admin','system_admin','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { status, teacher_id, page=1, limit=20 } = req.query;
    // Clamp to integers and interpolate, rather than binding LIMIT/OFFSET.
    // MariaDB (prod) accepts `LIMIT ? OFFSET ?`; MySQL 8 (every developer's
    // machine) rejects it with "Incorrect arguments to mysqld_stmt_execute", so
    // this endpoint 500'd locally and could not be exercised at all before
    // shipping. Same pattern as students.controller.js. No user value reaches
    // the SQL — both are Number-clamped here, per §17.
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
    const safePage  = Math.max(1, parseInt(page) || 1);
    const offset    = (safePage - 1) * safeLimit;
    // a teacher sees ONLY their own meetings; staff see all (optionally filtered)
    const isTeacher = ['teacher','class_teacher'].includes((req.user.role_slug || '').toLowerCase());
    let where = 'WHERE m.org_id=?'; const params=[o];
    if (status) { where+=' AND m.status=?'; params.push(status); }
    // A teacher sees the meetings they ORGANISED — and the ones they were
    // INVITED to. Without the second half, "the Academic team meets on Friday"
    // is invisible to every teacher in it: staff_kind='teaching' IS the
    // teachers, so the people the meeting is for would be the only ones who
    // could not see it.
    if (isTeacher) { where+=' AND (m.teacher_id=? OR m.staff_user_id=?)'; params.push(req.user.user_id, req.user.user_id); }
    else if (teacher_id) { where+=' AND m.teacher_id=?'; params.push(teacher_id); }

    const rows = await query(
      `SELECT m.*,
        CONCAT(pu.first_name,' ',pu.last_name) AS parent_name, pu.phone AS parent_phone,
        CONCAT(tu.first_name,' ',tu.last_name) AS teacher_name,
        CONCAT(su.first_name,' ',su.last_name) AS student_name,
        CONCAT(stu.first_name,' ',COALESCE(stu.last_name,'')) AS staff_name,
        stu.staff_kind AS staff_kind, stf.designation AS staff_designation,
        cl.name AS class_name, sec.name AS section_name
       FROM client_parent_meetings m
       LEFT JOIN client_parents p ON p.id=m.parent_id
       LEFT JOIN client_users pu ON pu.id=p.user_id
       JOIN client_users tu ON tu.id=m.teacher_id
       LEFT JOIN client_users stu ON stu.id=m.staff_user_id
       LEFT JOIN client_staff stf ON stf.user_id=m.staff_user_id AND stf.org_id=m.org_id
       LEFT JOIN client_students cs ON cs.id=m.student_id
       LEFT JOIN client_users su ON su.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       ${where}
       ORDER BY m.requested_date ASC
       LIMIT ${safeLimit} OFFSET ${offset}`,
      params
    );
    const total = await queryOne(
      `SELECT COUNT(*) AS c FROM client_parent_meetings m ${where}`, params
    );
    return paginated(res, rows, total.c, safePage, safeLimit, 'Meetings fetched');
  } catch(e) { return error(res,e.message,500); }
});

// Staff who may schedule a meeting on a parent's behalf (admin/parents/page.tsx).
const MEETING_STAFF = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'];
router.post('/meetings', async (req, res) => {
  try {
    const o = req.user.org_id;
    let { parent_id, teacher_id, student_id, title, description,
            requested_date, requested_time, duration_mins=30 } = req.body;
    const role = (req.user.role_slug || '').toLowerCase();
    if (MEETING_STAFF.includes(role)) {
      // Staff-initiated, on behalf of a parent (e.g. front-desk scheduling a
      // PTM). The body-supplied parent_id is trusted only after confirming it
      // belongs to this org — same tenant-guard pattern fees.routes.js
      // POST /collect uses for a client-supplied id.
      if (!parent_id) return error(res, 'parent_id required', 400);
      const p = await queryOne('SELECT id FROM client_parents WHERE id=? AND org_id=?', [parent_id, o]);
      if (!p) return error(res, 'Parent not found', 404);
    } else if (role === 'parent') {
      // Parent-initiated request (SUG-0061 §3): resolve parent_id from the token —
      // never trust a client-supplied id for the parent role.
      const p = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, req.user.user_id]);
      if (!p) return error(res, 'Parent profile not found', 404);
      parent_id = p.id;
    } else {
      // Any other role (student, plain teacher, etc.) has no legitimate path
      // here — teacher-initiated scheduling has its own ownership-checked
      // endpoint below, POST /meetings/schedule. Without this branch any
      // authenticated user could impersonate an arbitrary parent_id/
      // teacher_id/student_id via the request body.
      return error(res, 'Only staff or a parent can request a meeting here', 403);
    }
    if (!parent_id||!teacher_id||!title||!requested_date)
      return error(res,'parent_id, teacher_id, title, requested_date required',400);

    const r = await query(
      `INSERT INTO client_parent_meetings
       (org_id,parent_id,teacher_id,student_id,title,description,
        requested_date,requested_time,duration_mins,status)
       VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
      [o,parent_id,teacher_id,student_id||null,title,description||null,
       requested_date,requested_time||null,duration_mins]
    );
    return success(res,{ meeting_id: r.insertId },'Meeting requested',201);
  } catch(e) { return error(res,e.message,500); }
});

// Teacher-initiated meeting scheduling (SUG-0025 §14) — for an INDIVIDUAL
// student or an ENTIRE CLASS (section). audience='parent' (default) resolves
// each student's primary parent and fans out; audience='student' (SUG-0041b)
// meets the students themselves — no parent link needed, each student gets a
// notification. Teacher is scoped to sections they teach (fail-closed);
// elevated staff may target any section/student.
const { teacherTeachesSection, teacherTeachesStudent } = require('../../middleware/teacherScope');
const notifSvc = require('../../services/notificationService');
router.post('/meetings/schedule', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const role = (req.user.role_slug || '').toLowerCase();
    const elevated = MEET_ELEVATED.includes(role);
    if (!elevated && role !== 'teacher') return error(res, 'Forbidden', 403);
    const { scope, student_id, section_id, title, description,
            requested_date, requested_time, duration_mins = 30, audience = 'parent',
            student_ids, staff_user_ids, staff_kind } = req.body;
    if (!title || !requested_date) return error(res, 'title and requested_date required', 400);
    if (!['parent', 'student', 'staff'].includes(audience)) {
      return error(res, 'audience must be parent, student or staff', 400);
    }

    /* ── STAFF MEETINGS ────────────────────────────────────────────────────
     * A meeting with the Academic team, or with three named colleagues.
     *
     * ELEVATED ONLY, deliberately. A teacher may already reach the children
     * they teach and those children's parents; letting them schedule a meeting
     * into any colleague's list is a different power, and the safe default for
     * a new one is the narrow one. Loosening it later is a line; discovering
     * that every teacher could summon the principal is an incident.
     *
     * `staff_kind` is the Academic / Non-Academic split from migration 049
     * ('teaching' | 'support'), re-asserted by 061 so this cannot depend on a
     * ledger entry being true. */
    if (audience === 'staff') {
      if (!elevated) return error(res, 'Only school leadership can schedule staff meetings', 403);

      let staff = [];
      if (staff_kind) {
        if (!['teaching', 'support'].includes(staff_kind)) {
          return error(res, 'staff_kind must be teaching or support', 400);
        }
        staff = await query(
          `SELECT id AS user_id FROM client_users
            WHERE org_id=? AND is_active=1 AND staff_kind=? AND id<>?`,
          [o, staff_kind, uid]);
      } else {
        const ids = (Array.isArray(staff_user_ids) ? staff_user_ids : [])
          .map((n) => parseInt(n, 10)).filter(Boolean);
        if (!ids.length) return error(res, 'Pick at least one staff member', 400);
        // Every id is checked against THIS org before anything is written (§17),
        // and against the active roster — never trusted from the payload.
        staff = await query(
          `SELECT id AS user_id FROM client_users
            WHERE org_id=? AND is_active=1 AND id<>? AND id IN (${ids.map(() => '?').join(',')})`,
          [o, uid, ...ids]);
      }
      if (!staff.length) return error(res, 'No staff found for the selected target', 400);

      let created = 0;
      for (const s of staff) {
        await query(
          `INSERT INTO client_parent_meetings
           (org_id,parent_id,teacher_id,student_id,staff_user_id,title,description,requested_date,requested_time,duration_mins,status,audience)
           VALUES (?,NULL,?,NULL,?,?,?,?,?,?,'pending','staff')`,
          [o, uid, s.user_id, title, description || null, requested_date, requested_time || null, duration_mins]);
        created++;
        try {
          await notifSvc.send(o, {
            recipient_id: s.user_id, recipient_role: 'staff',
            type: 'meeting', title: 'Meeting scheduled',
            body: `${title} — ${requested_date}${requested_time ? ` at ${requested_time}` : ''}`,
            action_url: '/communication/meetings', icon: 'Calendar', priority: 'high',
            sender_id: uid, sender_role: role,
          });
        } catch { /* non-fatal: the meeting exists either way */ }
      }
      return success(res, { created, skipped: 0 },
        `${created} staff meeting${created === 1 ? '' : 's'} scheduled`, 201);
    }

    let targets = [];
    if (scope === 'class') {
      if (!section_id) return error(res, 'section_id required for a class meeting', 400);
      if (!elevated && !(await teacherTeachesSection(o, uid, section_id))) return error(res, 'Forbidden', 403);
      targets = await query(
        `SELECT cs.id AS student_id,
                (SELECT ps.parent_id FROM client_parent_students ps
                  WHERE ps.student_id=cs.id ORDER BY ps.is_primary DESC LIMIT 1) AS parent_id
           FROM client_enrollments e
           JOIN client_students cs ON cs.id=e.student_id
          WHERE e.section_id=? AND e.status='active' AND cs.org_id=?`, [section_id, o]);
    } else {
      // One child or many — "individual" now accepts a list, because picking
      // thirty children one modal at a time is thirty meetings' worth of
      // clicking for one conversation. `student_id` (singular) is still
      // accepted so nothing that already calls this breaks.
      const ids = (Array.isArray(student_ids) && student_ids.length ? student_ids : [student_id])
        .map((n) => parseInt(n, 10)).filter(Boolean);
      const unique = [...new Set(ids)];
      if (!unique.length) return error(res, 'student_id required for an individual meeting', 400);
      // The scope check is PER CHILD. A teacher who teaches one of the thirty
      // must not get the other twenty-nine by putting them in the same array.
      if (!elevated) {
        for (const sid of unique) {
          if (!(await teacherTeachesStudent(o, uid, sid))) return error(res, 'Forbidden', 403);
        }
      }
      const rows = await query(
        `SELECT cs.id AS student_id,
                (SELECT ps.parent_id FROM client_parent_students ps
                  WHERE ps.student_id=cs.id ORDER BY ps.is_primary DESC LIMIT 1) AS parent_id
           FROM client_students cs
          WHERE cs.org_id=? AND cs.id IN (${unique.map(() => '?').join(',')})`,
        [o, ...unique]);
      targets = rows;
    }

    if (audience === 'student') {
      // Meet the students directly — parent link not required (SUG-0041b).
      if (!targets.length) return error(res, 'No students found for the selected target', 400);
      let created = 0;
      for (const t of targets) {
        try {
          await query(
            `INSERT INTO client_parent_meetings
             (org_id,parent_id,teacher_id,student_id,title,description,requested_date,requested_time,duration_mins,status,audience)
             VALUES (?,NULL,?,?,?,?,?,?,?,'pending','student')`,
            [o, uid, t.student_id, title, description || null, requested_date, requested_time || null, duration_mins]);
        } catch (e) {
          if (/audience|parent_id/i.test(e.message)) return error(res, 'Student meetings need a DB update — run scripts/teacher_followups_migration.js', 500);
          throw e;
        }
        created++;
        try {
          await notifSvc.sendToStudent(o, t.student_id, {
            type: 'meeting', title: 'Meeting scheduled',
            body: `${title} — ${requested_date}${requested_time ? ` at ${requested_time}` : ''}`,
            action_url: '/student', icon: 'Calendar', priority: 'high',
            sender_id: uid, sender_role: 'teacher',
          });
        } catch { /* non-fatal */ }
      }
      return success(res, { created, skipped: 0 }, `${created} student meeting${created === 1 ? '' : 's'} scheduled`, 201);
    }

    const withParent = targets.filter(t => t.parent_id);
    if (!withParent.length) return error(res, 'No linked parents found for the selected target', 400);

    let created = 0;
    for (const t of withParent) {
      await query(
        `INSERT INTO client_parent_meetings
         (org_id,parent_id,teacher_id,student_id,title,description,requested_date,requested_time,duration_mins,status)
         VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
        [o, t.parent_id, uid, t.student_id, title, description || null, requested_date, requested_time || null, duration_mins]);
      created++;
    }
    // NAME the children who were skipped, do not just count them. "24 scheduled
    // (6 skipped)" is unactionable when thirty boxes were ticked: the teacher
    // cannot tell which six families were left out, so nobody chases the
    // missing parent links and six children quietly have no meeting.
    const skippedIds = targets.filter(t => !t.parent_id).map(t => t.student_id);
    let skippedNames = [];
    if (skippedIds.length) {
      const rows = await query(
        `SELECT CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name
           FROM client_students cs JOIN client_users u ON u.id=cs.user_id
          WHERE cs.org_id=? AND cs.id IN (${skippedIds.map(() => '?').join(',')})`,
        [o, ...skippedIds]);
      skippedNames = rows.map(r => r.name.trim()).filter(Boolean);
    }
    const skipped = skippedIds.length;
    return success(res, { created, skipped, skipped_names: skippedNames },
      `${created} meeting${created === 1 ? '' : 's'} scheduled${skipped ? ` — no linked parent for ${skippedNames.join(', ') || `${skipped} student(s)`}` : ''}`, 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/meetings/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const m = await queryOne('SELECT id, parent_id, teacher_id FROM client_parent_meetings WHERE id=? AND org_id=?',[req.params.id,o]);
    if (!m) return error(res,'Meeting not found',404);
    // Ownership: a parent may edit only THEIR meeting; a teacher only meetings
    // they are the teacher of; elevated staff may edit any.
    const mRole = (req.user.role_slug || '').toLowerCase();
    if (mRole === 'parent') {
      const par = await queryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [req.user.user_id, o]);
      if (!par || par.id !== m.parent_id) return error(res, 'This is not your meeting', 403);
    } else if (['teacher','class_teacher'].includes(mRole)) {
      if (m.teacher_id !== req.user.user_id) return error(res, 'This is not your meeting', 403);
    } else if (!MEET_ELEVATED.includes(mRole)) {
      // Any other authenticated role previously fell through with no check at
      // all and could mutate any org's meeting record.
      return error(res, 'Forbidden', 403);
    }
    const { status, confirmed_date, confirmed_time, location, meet_link,
            cancel_reason, notes, duration_mins } = req.body;
    await query(
      `UPDATE client_parent_meetings SET
       status=COALESCE(?,status), confirmed_date=COALESCE(?,confirmed_date),
       confirmed_time=COALESCE(?,confirmed_time), location=COALESCE(?,location),
       meet_link=COALESCE(?,meet_link), cancel_reason=COALESCE(?,cancel_reason),
       notes=COALESCE(?,notes), duration_mins=COALESCE(?,duration_mins)
       WHERE id=?`,
      [status||null,confirmed_date||null,confirmed_time||null,location||null,
       meet_link||null,cancel_reason||null,notes||null,duration_mins||null,req.params.id]
    );
    return success(res,{},'Meeting updated');
  } catch(e) { return error(res,e.message,500); }
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────
router.get('/messages/threads', async (req, res) => {
  try {
    const o = req.user.org_id;
    // Always use the authenticated user — never a client-supplied user_id (was IDOR).
    const uid = req.user.user_id;
    const threads = await query(
      `SELECT t.*,
        CONCAT(u.first_name,' ',u.last_name) AS other_name,
        u.avatar AS other_avatar, u.email AS other_email,
        CONCAT(su.first_name,' ',su.last_name) AS student_name
       FROM client_message_threads t
       JOIN client_users u ON u.id = CASE
         WHEN t.participant_a=? THEN t.participant_b ELSE t.participant_a END
       LEFT JOIN client_students cs ON cs.id=t.student_id
       LEFT JOIN client_users su ON su.id=cs.user_id
       WHERE t.org_id=? AND (t.participant_a=? OR t.participant_b=?)
       ORDER BY t.last_msg_at DESC`,
      [uid,o,uid,uid]
    );
    return success(res,{ threads });
  } catch(e) { return error(res,e.message,500); }
});

router.get('/messages/threads/:threadId', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    // Caller must be a participant of this thread — else they could read anyone's DMs.
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
      [req.params.threadId,o]
    );
    // Mark as read
    await query(
      `UPDATE client_message_threads SET
       unread_a = CASE WHEN participant_a=? THEN 0 ELSE unread_a END,
       unread_b = CASE WHEN participant_b=? THEN 0 ELSE unread_b END
       WHERE id=? AND org_id=?`,
      [uid,uid,req.params.threadId,o]
    );
    await query(
      'UPDATE client_messages SET is_read=1 WHERE thread_id=? AND sender_id!=? AND org_id=?',
      [req.params.threadId,uid,o]
    );
    return success(res,{ messages: msgs });
  } catch(e) { return error(res,e.message,500); }
});

router.post('/messages', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const { to_user_id, subject, body, student_id, thread_id } = req.body;
    if (!body) return error(res,'body required',400);

    let tId = thread_id;
    if (!tId) {
      if (!to_user_id||!subject) return error(res,'to_user_id and subject required for new thread',400);
      // Recipient must belong to the caller's org — never start a thread with an
      // arbitrary cross-tenant user_id (IDOR / cross-org messaging).
      const recip = await queryOne('SELECT id FROM client_users WHERE id=? AND org_id=?', [to_user_id, o]);
      if (!recip) return error(res, 'Recipient not found', 404);
      const existing = await queryOne(
        `SELECT id FROM client_message_threads
         WHERE org_id=? AND ((participant_a=? AND participant_b=?) OR (participant_a=? AND participant_b=?))
         AND subject=? LIMIT 1`,
        [o,uid,to_user_id,to_user_id,uid,subject]
      );
      if (existing) {
        tId = existing.id;
      } else {
        const tRes = await query(
          `INSERT INTO client_message_threads
           (org_id,subject,participant_a,participant_b,student_id,last_message,last_msg_at,unread_a,unread_b)
           VALUES (?,?,?,?,?,?,NOW(),0,1)`,
          [o,subject,uid,to_user_id,student_id||null,body]
        );
        tId = tRes.insertId;
      }
    }

    // Participant guard (covers the reply path where thread_id is supplied): the
    // caller MUST be a participant of this thread before writing — else a parent
    // could iterate thread_id and inject messages into any conversation,
    // cross-family and cross-tenant.
    const th = await queryOne('SELECT participant_a, participant_b FROM client_message_threads WHERE id=? AND org_id=?', [tId, o]);
    if (!th || (th.participant_a !== uid && th.participant_b !== uid)) {
      return error(res, 'You are not a participant of this conversation', 403);
    }

    await query(
      'INSERT INTO client_messages (org_id,thread_id,sender_id,body) VALUES (?,?,?,?)',
      [o,tId,uid,body]
    );

    await query(
      `UPDATE client_message_threads SET
       last_message=?, last_msg_at=NOW(),
       unread_a = CASE WHEN participant_b=? THEN unread_a+1 ELSE unread_a END,
       unread_b = CASE WHEN participant_a=? THEN unread_b+1 ELSE unread_b END
       WHERE id=?`,
      [body,uid,uid,tId]
    );
    return success(res,{ thread_id:tId },'Message sent',201);
  } catch(e) { return error(res,e.message,500); }
});

// ─── PORTAL (parent's own view) ───────────────────────────────────────────
router.get('/portal/dashboard', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const parent = await queryOne(
      'SELECT id FROM client_parents WHERE user_id=? AND org_id=?',[uid,o]
    );
    if (!parent) return error(res,'Parent profile not found',404);

    const children = await query(
      `SELECT
        cs.id AS student_id, cs.admission_number,
        u.first_name, u.last_name, u.email,
        sec.name AS section_name, cl.name AS class_name, cl.standard,
        ps.relation,
        ROUND(
          (SELECT SUM(ar.status='present') FROM client_attendance_records ar
           WHERE ar.student_id=cs.id AND ar.org_id=?)
          / NULLIF(
            (SELECT COUNT(*) FROM client_attendance_records ar
             WHERE ar.student_id=cs.id AND ar.org_id=?),0
          )*100,1
        ) AS attendance_pct,
        (SELECT COALESCE(SUM(fa.final_amount),0) - COALESCE(SUM(fp.amount),0)
         FROM client_fee_assignments fa
         LEFT JOIN client_fee_payments fp ON fp.fee_assignment_id=fa.id AND fp.status='completed'
         WHERE fa.student_id=cs.id AND fa.org_id=?) AS fees_due
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=?`,
      [o,o,o,parent.id,o]
    );

    const meetings = await query(
      `SELECT m.*, CONCAT(u.first_name,' ',u.last_name) AS teacher_name
       FROM client_parent_meetings m
       JOIN client_users u ON u.id=m.teacher_id
       WHERE m.parent_id=? AND m.org_id=? AND m.status IN ('pending','confirmed')
       ORDER BY m.requested_date ASC LIMIT 5`,
      [parent.id,o]
    );

    // Role-targeted, same definition as the Announcements inbox. This block used
    // to be untargeted, so a parent's dashboard could surface a staff-only notice
    // while the inbox (correctly) hid it.
    const annVis = announcementVisibleSql('a', 'parent');
    const announcements = await query(
      `SELECT a.* FROM announcements a WHERE a.org_id=? AND ${annVis.sql}
       ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT 5`, [o, ...annVis.params]
    );

    const unread = await queryOne(
      `SELECT SUM(
         CASE WHEN t.participant_a=? THEN t.unread_a ELSE t.unread_b END
       ) AS total
       FROM client_message_threads t
       WHERE t.org_id=? AND (t.participant_a=? OR t.participant_b=?)`,
      [uid,o,uid,uid]
    );

    return success(res,{
      children, meetings, announcements,
      unread_messages: unread?.total || 0
    });
  } catch(e) { logger.error('Portal dashboard:',e); return error(res,e.message,500); }
});

// Parent-portal access guard: caller must be the student themselves, a linked
// parent, or staff. Without this, any user could read any student's data by id.
const canAccessChild = async (user, studentId, o) => {
  if (['owner', 'admin', 'principal', 'teacher'].includes(user.role_slug)) return true;
  const self = await queryOne('SELECT 1 FROM client_students WHERE id=? AND org_id=? AND user_id=?', [studentId, o, user.user_id]);
  if (self) return true;
  const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, user.user_id]);
  if (!parent) return false;
  const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
  return !!link;
};

router.get('/portal/child/:studentId/attendance', async (req, res) => {
  try {
    const o = req.user.org_id;
    if (!(await canAccessChild(req.user, req.params.studentId, o))) return error(res, 'Forbidden', 403);
    const { month, year } = req.query;
    const m = month || new Date().getMonth()+1;
    const y = year  || new Date().getFullYear();

    const records = await query(
      `SELECT ar.status, s.date AS session_date
       FROM client_attendance_records ar
       JOIN client_attendance_sessions s ON s.id=ar.session_id
       WHERE ar.student_id=? AND ar.org_id=?
         AND MONTH(s.date)=? AND YEAR(s.date)=?
       ORDER BY s.date ASC`,
      [req.params.studentId,o,m,y]
    );

    const summary = {
      present: records.filter(r=>r.status==='present').length,
      absent:  records.filter(r=>r.status==='absent').length,
      late:    records.filter(r=>r.status==='late').length,
      total:   records.length
    };
    summary.pct = summary.total
      ? Math.round(summary.present/summary.total*100) : 0;

    return success(res,{ records, summary });
  } catch(e) { return error(res,e.message,500); }
});

router.get('/portal/child/:studentId/fees', async (req, res) => {
  try {
    const o = req.user.org_id;
    if (!(await canAccessChild(req.user, req.params.studentId, o))) return error(res, 'Forbidden', 403);
    const assignments = await query(
      `SELECT fa.*, fs.name AS structure_name, fs.frequency,
        COALESCE(SUM(fp.amount),0) AS paid,
        fa.final_amount - COALESCE(SUM(fp.amount),0) AS due
       FROM client_fee_assignments fa
       JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
       LEFT JOIN client_fee_payments fp ON fp.fee_assignment_id=fa.id AND fp.status='completed'
       WHERE fa.student_id=? AND fa.org_id=?
       GROUP BY fa.id
       ORDER BY fa.assigned_date DESC`,
      [req.params.studentId,o]
    );
    const total_due = assignments.reduce((s,a)=>s+parseFloat(a.due||0),0);
    return success(res,{ assignments, total_due });
  } catch(e) { return error(res,e.message,500); }
});

module.exports = router;

// ═══ PARENT SELF-SERVICE ═══
const { query: qMC, queryOne: qMC1 } = require('../../config/db');
const { success: okMC, error: errMC } = require('../../utils/response');

// GET /api/parents/me/children — parent's own children (FIXED + lifecycle)
router.get('/me/children', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;

    const parent = await qMC1(
      'SELECT id FROM client_parents WHERE user_id=? AND org_id=?',
      [userId, orgId]
    );
    if (!parent) return errMC(res, 'Parent record not found for this user', 404);

    const children = await qMC(
      `SELECT
        ps.id AS link_id, ps.relation, ps.is_primary,
        cs.id AS student_id, cs.admission_number, cs.lifecycle_status,
        u.first_name, u.last_name, u.email, u.phone,
        sec.id AS section_id, sec.name AS section_name, cl.name AS class_name
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=? AND COALESCE(ps.status,'active')='active'
       ORDER BY ps.is_primary DESC`,
      [parent.id, orgId]
    );

    return okMC(res, { parent, children });
  } catch (err) {
    console.error('my-children error:', err);
    return errMC(res, err.message, 500);
  }
});

// GET /api/parents/my-children/:childId/quizzes — child's quiz attempts
router.get('/me/children/:childId/quizzes', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const childId = req.params.childId;

    // Verify link
    const parentProfile = await qMC1('SELECT id FROM client_parents WHERE user_id=? AND org_id=? LIMIT 1', [userId, orgId]);
    if (!parentProfile) return errMC(res, 'Parent profile not found', 403);
    const link = await qMC1(
      'SELECT * FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'',
      [parentProfile.id, childId]
    );
    if (!link) return errMC(res, 'Not your child', 403);

    const attempts = await qMC(
      `SELECT a.*, q.title, q.total_marks, q.passing_marks, q.duration_minutes
       FROM client_quiz_attempts a
       JOIN client_quizzes q ON q.id=a.quiz_id
       WHERE a.student_id=? AND a.org_id=? AND a.status IN ('submitted','graded')
       ORDER BY a.submitted_at DESC LIMIT 50`,
      [childId, orgId]
    );
    return okMC(res, { attempts });
  } catch (err) { return errMC(res, err.message, 500); }
});

// GET /api/parents/my-children/:childId/assignments
router.get('/me/children/:childId/assignments', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const childId = req.params.childId;

    const parentProfile = await qMC1('SELECT id FROM client_parents WHERE user_id=? AND org_id=? LIMIT 1', [userId, orgId]);
    if (!parentProfile) return errMC(res, 'Parent profile not found', 403);
    const link = await qMC1(
      'SELECT * FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'',
      [parentProfile.id, childId]
    );
    if (!link) return errMC(res, 'Not your child', 403);

    // Get child's section
    const enrollment = await qMC1(
      'SELECT section_id FROM client_enrollments WHERE student_id=? AND org_id=?',
      [childId, orgId]
    );
    if (!enrollment) return okMC(res, { assignments: [] });

    const assignments = await qMC(
      `SELECT a.*, s.name AS subject_name,
              sub.id AS submission_id, sub.status AS submission_status, sub.marks_obtained, sub.is_late, sub.submitted_at,
              sub.graded_at, sub.feedback AS teacher_feedback
       FROM client_assignments a
       LEFT JOIN client_subjects s ON s.id=a.subject_id
       LEFT JOIN client_assignment_submissions sub ON sub.assignment_id=a.id AND sub.student_id=?
       WHERE a.org_id=? AND a.section_id=? AND a.status IN ('published','closed')
       ORDER BY a.due_date DESC LIMIT 50`,
      [childId, orgId, enrollment.section_id]
    );
    return okMC(res, { assignments });
  } catch (err) { return errMC(res, err.message, 500); }
});

// GET /api/parents/my-children/:childId/worksheets
router.get('/me/children/:childId/worksheets', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const childId = req.params.childId;

    const parentProfile = await qMC1('SELECT id FROM client_parents WHERE user_id=? AND org_id=? LIMIT 1', [userId, orgId]);
    if (!parentProfile) return errMC(res, 'Parent profile not found', 403);
    const link = await qMC1(
      'SELECT * FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'',
      [parentProfile.id, childId]
    );
    if (!link) return errMC(res, 'Not your child', 403);

    const enrollment = await qMC1(
      'SELECT section_id FROM client_enrollments WHERE student_id=? AND org_id=?',
      [childId, orgId]
    );
    if (!enrollment) return okMC(res, { worksheets: [] });

    const worksheets = await qMC(
      `SELECT w.*, s.name AS subject_name
       FROM client_worksheets w
       LEFT JOIN client_subjects s ON s.id=w.subject_id
       WHERE w.org_id=? AND w.section_id=? AND w.status IN ('finalized','assigned')
       ORDER BY w.created_at DESC LIMIT 50`,
      [orgId, enrollment.section_id]
    );
    return okMC(res, { worksheets });
  } catch (err) { return errMC(res, err.message, 500); }
});

// GET /api/parents/my-children/:childId/overview — KPIs for dashboard
router.get('/me/children/:childId/overview', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const childId = req.params.childId;

    const parentProfile = await qMC1('SELECT id FROM client_parents WHERE user_id=? AND org_id=? LIMIT 1', [userId, orgId]);
    if (!parentProfile) return errMC(res, 'Parent profile not found', 403);
    const link = await qMC1(
      'SELECT * FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'',
      [parentProfile.id, childId]
    );
    if (!link) return errMC(res, 'Not your child', 403);

    const enrollment = await qMC1(
      'SELECT section_id FROM client_enrollments WHERE student_id=? AND org_id=?',
      [childId, orgId]
    );

    const kpis = await qMC1(`
      SELECT
        (SELECT COUNT(*) FROM client_assignments WHERE org_id=? AND section_id=? AND status='published') AS total_assignments,
        (SELECT COUNT(*) FROM client_assignment_submissions WHERE student_id=? AND status IN ('submitted','resubmitted','graded')) AS submitted_count,
        (SELECT COUNT(*) FROM client_assignment_submissions WHERE student_id=? AND status='graded') AS graded_count,
        (SELECT COUNT(*) FROM client_quiz_attempts WHERE student_id=? AND status IN ('submitted','graded')) AS quiz_attempts,
        (SELECT ROUND(AVG(percentage),1) FROM client_quiz_attempts WHERE student_id=? AND status IN ('submitted','graded')) AS avg_quiz_pct,
        (SELECT MAX(percentage) FROM client_quiz_attempts WHERE student_id=? AND status IN ('submitted','graded')) AS best_quiz_pct,
        (SELECT ROUND(SUM(ar.status='present')/NULLIF(COUNT(*),0)*100,1) FROM client_attendance_records ar WHERE ar.student_id=? AND ar.org_id=?) AS attendance_pct
    `, [orgId, enrollment?.section_id || 0, childId, childId, childId, childId, childId, childId, orgId]);

    return okMC(res, { kpis });
  } catch (err) { return errMC(res, err.message, 500); }
});

// GET /api/parents/me/children/:childId/class
//
// "Which class is my child in, and who teaches them." The one page a parent
// opens first, and the platform had no answer for it: a parent could see marks
// and fees but not the name of their child's class teacher.
//
// Same source as the admin's class card and the student's own view
// (services/sectionProfile) — a family and the office read one truth.
//
// A parent, unlike a student, DOES get the class teacher's phone: reaching the
// class teacher is the entire point of the relationship. Subject teachers are
// named but not phoned — those conversations go through the class teacher.
// — JD PUBLIC SCHOOL, 2026-07-29
router.get('/me/children/:childId/class', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const childId = req.params.childId;

    const parentProfile = await qMC1('SELECT id FROM client_parents WHERE user_id=? AND org_id=? LIMIT 1', [userId, orgId]);
    if (!parentProfile) return errMC(res, 'Parent profile not found', 403);
    const link = await qMC1(
      'SELECT * FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'',
      [parentProfile.id, childId]
    );
    if (!link) return errMC(res, 'Not your child', 403);

    const enrollment = await qMC1(
      "SELECT section_id FROM client_enrollments WHERE student_id=? AND org_id=? AND status='active' LIMIT 1",
      [childId, orgId]
    );
    // A child admitted but not yet placed in a section is a normal state, not
    // an error — say so plainly instead of failing.
    if (!enrollment?.section_id) {
      return okMC(res, { enrolled: false, section: null, class_teacher: null, subjects: [] });
    }

    const profile = await getSectionProfile(orgId, enrollment.section_id);
    if (!profile) return okMC(res, { enrolled: false, section: null, class_teacher: null, subjects: [] });

    return okMC(res, {
      enrolled: true,
      section: profile.section,
      class_teacher: profile.class_teacher,
      subjects: profile.subjects.map(s => ({
        subject_id: s.subject_id, name: s.name, code: s.code, color: s.color,
        teachers: s.teachers.map(t => ({ id: t.id, name: t.name, avatar: t.avatar })),
      })),
    });
  } catch (err) { return errMC(res, err.message, 500); }
});

