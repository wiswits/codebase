const express = require('express');
const router  = express.Router();
const ctrl    = require('./students.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireRole } = require('../../middleware/rbac');
const { query, queryOne, transaction } = require('../../config/db');
const { EMAIL_RE } = require('../../utils/validate');
const { success, error, paginated } = require('../../utils/response');
const logger  = require('../../utils/logger');
const { teacherTeachesStudent, teacherIsHomeroomOf, teacherSectionsSql } = require('../../middleware/teacherScope');
const lifecycle = require('../../services/personLifecycle');
const { tempPassword } = require('../../utils/tempPassword');
// multi-branch: stamp bulk-added students with their branch (single-add already
// does via the controller). Prefer the target section's branch, else active/primary.
const { getWriteSchool } = require('../../utils/activeSchool');
const customFields = require('../custom-fields/customFields.service');
const meters = require('../../services/meters');
const { audit } = require('../../utils/audit');

router.use(authenticate);

// A plain teacher may access a per-student detail route ONLY for a student they
// teach (students.view is otherwise org-wide). Elevated staff pass through.
const scopeStudentForTeacher = async (req, res, next) => {
  try {
    const slug = (req.user.role_slug || '').toLowerCase();
    if (['teacher', 'class_teacher'].includes(slug)) {
      const ok = await teacherTeachesStudent(req.user.org_id, req.user.user_id, req.params.id);
      if (!ok) return error(res, 'Forbidden', 403);
    }
    next();
  } catch (e) { return error(res, e.message, 500); }
};

// ── existing controller routes (static FIRST) ──────────────────────────────
router.get('/stats',      requirePermission('students.view'), ctrl.stats);
router.post('/bulk',      requirePermission('students.create'), ctrl.bulkCreate);

// ── CSV import ──────────────────────────────────────────────────────────────
router.post('/import/validate', requirePermission('students.create'), async (req, res) => {
  try {
    const { rows } = req.body; // array of objects from parsed CSV
    if (!Array.isArray(rows) || rows.length === 0)
      return error(res, 'rows array required', 400);
    if (rows.length > 500)
      return error(res, 'Max 500 rows per import', 400);

    const orgId = req.user.org_id;
    const results = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const issues = [];

      // required fields
      if (!r.first_name) issues.push('first_name required');
      if (!r.email)      issues.push('email required');
      else {
        // email format
        if (!EMAIL_RE.test(r.email))
          issues.push('invalid email format');
        else {
          // duplicate check
          const ex = await queryOne('SELECT id FROM client_users WHERE email=?', [r.email]);
          if (ex) issues.push('email already exists');
        }
      }
      if (r.gender && !['male','female','other'].includes(r.gender.toLowerCase()))
        issues.push('gender must be male/female/other');

      results.push({
        row: i + 1,
        data: r,
        status: issues.length === 0 ? 'valid' : 'error',
        issues
      });
    }

    const valid   = results.filter(r => r.status === 'valid').length;
    const errors  = results.filter(r => r.status === 'error').length;
    return success(res, { results, summary: { total: rows.length, valid, errors } });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/import/execute', requirePermission('students.create'), async (req, res) => {
  try {
    const { rows, section_id } = req.body;
    if (!Array.isArray(rows) || rows.length === 0)
      return error(res, 'rows required', 400);

    const orgId = req.user.org_id;
    const { hash } = require('../../core/auth/password');

    const studentRoleId = await queryOne(
      `SELECT id FROM client_roles WHERE base_role='student' AND org_id=? ORDER BY id DESC LIMIT 1`, [orgId]
    );

    const results = { created: 0, skipped: 0, errors: [] };

    // custom fields (T2.6 Phase E): CSV columns matching active field_keys are
    // imported too. Loaded once; multiselect cells accept ';' or ',' separated values.
    const cfDefs = await customFields.listDefs(orgId, 'student');

    // Validate the target section ONCE, not per row
    const targetSection = section_id
      ? await queryOne('SELECT id, school_id FROM client_sections WHERE id=? AND org_id=?', [section_id, orgId])
      : null;

    // PLAN LIMIT (KI-118) — whole batch, up front, same reasoning as bulkCreate in
    // students.controller.js: refusing the import is recoverable, a half-import that
    // stops at the cap leaves the admin guessing which rows landed.
    const cap = await meters.checkHeadcount(orgId, 'students', rows.length);
    if (!cap.ok) return error(res, cap.message, 402);

    // Branch to stamp on each new student: the target section's branch if given,
    // else the active/primary branch (null for single-branch orgs → column stays null).
    const writeSchool = (targetSection && targetSection.school_id) || await getWriteSchool(req);

    for (const r of rows) {
      try {
        if (!r.first_name || !r.email) {
          results.errors.push({ email: r.email, reason: 'Missing required fields' });
          continue;
        }
        const ex = await queryOne('SELECT id FROM client_users WHERE email=?', [r.email]);
        if (ex) { results.skipped++; continue; }

        // build + validate custom fields from the row's extra columns
        let cfClean = {};
        if (cfDefs.length) {
          const raw = {};
          for (const d of cfDefs) {
            const cell = r[d.field_key];
            if (cell == null || String(cell).trim() === '') continue;
            raw[d.field_key] = (d.data_type === 'multiselect' && typeof cell === 'string')
              ? cell.split(/[;,]/).map(s => s.trim()).filter(Boolean) : cell;
          }
          const cv = await customFields.validateCustom(orgId, 'student', raw, { enforceRequired: false });
          if (!cv.ok) { results.errors.push({ email: r.email, reason: cv.message }); continue; }
          cfClean = cv.cleaned;
        }

        const pwd = await hash(r.password || tempPassword());

        // Each row is atomic: user + student + role + enrollment + library
        // commit together — a mid-row failure can't leave an orphan user.
        await transaction(async (conn) => {
          const [uRes] = await conn.execute(
            `INSERT INTO client_users (org_id,email,phone,password_hash,first_name,last_name,gender,date_of_birth)
             VALUES (?,?,?,?,?,?,?,?)`,
            [orgId, r.email, r.phone||null, pwd, r.first_name, r.last_name||'',
             r.gender?.toLowerCase()||null, r.date_of_birth||null]
          );
          const userId = uRes.insertId;

          const [sRes] = await conn.execute(
            `INSERT INTO client_students (org_id,user_id,admission_number,gender,date_of_birth,blood_group,address,school_id)
             VALUES (?,?,?,?,?,?,?,?)`,
            [orgId, userId, r.admission_number||null, r.gender?.toLowerCase()||null,
             r.date_of_birth||null, r.blood_group||null, r.address||null, writeSchool]
          );
          const studentId = sRes.insertId;

          if (studentRoleId) {
            await conn.execute('INSERT IGNORE INTO client_user_roles (org_id,user_id,role_id) VALUES (?,?,?)',
              [orgId, userId, studentRoleId.id]);
          }
          if (targetSection) {
            await conn.execute(
              `INSERT INTO client_enrollments (org_id,student_id,section_id,enrollment_date,status)
               VALUES (?,?,?,CURDATE(),'active')`,
              [orgId, studentId, section_id]
            );
          }

          // auto-enroll in library. ROOT-CAUSE FIX: this was the ONLY query in the
          // codebase writing client_library_members(student_id, card_number) —
          // columns that do not exist. The table's FK is user_id and the card
          // column is card_no (+ member_type), exactly as the library module and
          // this file's own getOne read it. The wrong columns made EVERY CSV-import
          // row throw "Unknown column 'student_id'" and roll back — CSV import of
          // students was fully broken. Aligned to the real schema.
          await conn.execute(
            `INSERT IGNORE INTO client_library_members (org_id,user_id,member_type,card_no,status)
             VALUES (?,?,?,?,?)`,
            [orgId, userId, 'student', `LIB-S-${String(studentId).padStart(5,'0')}`, 'active']
          );

          // custom field values — same transaction as the student row
          await customFields.writeValues(orgId, 'student', studentId, cfClean, conn);
        });

        results.created++;
      } catch(e) {
        results.errors.push({ email: r.email, reason: e.message });
      }
    }

    logger.info(`CSV import: ${results.created} created, ${results.skipped} skipped (org:${orgId})`);
    // §12 Admission. A log line is for us; the audit row is for the school — it
    // survives log rotation and is the only place a CSV import of a whole
    // incoming class can be traced back to the person who ran it.
    await audit(req, 'ADMISSION', 'student', null, {
      new_data: { via: 'csv_import', created: results.created, skipped: results.skipped,
                  failed: results.errors.length, section_id: section_id || null },
    });
    return success(res, results, `Imported ${results.created} students`);
  } catch(e) { return error(res, e.message, 500); }
});

// ── per-student detail routes (:id AFTER static routes) ─────────────────────
router.get('/:id/academic', requirePermission('students.view'), scopeStudentForTeacher, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const enrollment = await queryOne(
      `SELECT e.*, s.name AS section_name, s.id AS section_id,
        c.name AS class_name, c.id AS class_id, c.standard, c.academic_year
       FROM client_enrollments e
       JOIN client_sections s ON s.id=e.section_id
       JOIN client_classes c ON c.id=s.class_id
       WHERE e.student_id=? AND e.org_id=? AND e.status='active'
       ORDER BY e.enrollment_date DESC LIMIT 1`,
      [id, orgId]
    );

    const history = await query(
      `SELECT e.*, s.name AS section_name, c.name AS class_name, c.academic_year,
        e.status, e.enrollment_date
       FROM client_enrollments e
       JOIN client_sections s ON s.id=e.section_id
       JOIN client_classes c ON c.id=s.class_id
       WHERE e.student_id=? AND e.org_id=?
       ORDER BY e.enrollment_date DESC`,
      [id, orgId]
    );

    const libraryMember = await queryOne(
      `SELECT lm.* FROM client_library_members lm
       JOIN client_students s ON s.user_id=lm.user_id
       WHERE s.id=? AND lm.org_id=? LIMIT 1`,
      [id, orgId]
    );

    const activeIssues = await query(
      `SELECT bi.*, lb.title, lb.author
       FROM client_book_issues bi
       JOIN client_library_books lb ON lb.id=bi.book_id
       JOIN client_library_members lm ON lm.id=bi.member_id
       JOIN client_students s ON s.user_id=lm.user_id
       WHERE s.id=? AND bi.org_id=? AND bi.status='issued'`,
      [id, orgId]
    );

    return success(res, { enrollment, history, libraryMember, activeIssues });
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/:id/attendance', requirePermission('students.view'), scopeStudentForTeacher, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year ) || new Date().getFullYear();

    const records = await query(
      `SELECT ar.status, ar.remarks, sess.date AS session_date,
        sec.name AS section_name, c.name AS class_name
       FROM client_attendance_records ar
       JOIN client_attendance_sessions sess ON sess.id=ar.session_id
       LEFT JOIN client_sections sec ON sec.id=sess.section_id
       LEFT JOIN client_classes c ON c.id=sec.class_id
       WHERE ar.student_id=? AND ar.org_id=?
         AND MONTH(sess.date)=? AND YEAR(sess.date)=?
       ORDER BY sess.date ASC`,
      [id, orgId, m, y]
    );

    // overall stats (all time)
    const overall = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(ar.status='present') AS present,
        SUM(ar.status='absent')  AS absent,
        SUM(ar.status='late')    AS late,
        ROUND(SUM(ar.status='present')/NULLIF(COUNT(*),0)*100,1) AS pct
       FROM client_attendance_records ar
       WHERE ar.student_id=? AND ar.org_id=?`,
      [id, orgId]
    );

    // monthly stats
    const monthly = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(ar.status='present') AS present,
        SUM(ar.status='absent')  AS absent,
        SUM(ar.status='late')    AS late,
        ROUND(SUM(ar.status='present')/NULLIF(COUNT(*),0)*100,1) AS pct
       FROM client_attendance_records ar
       JOIN client_attendance_sessions sess ON sess.id=ar.session_id
       WHERE ar.student_id=? AND ar.org_id=?
         AND MONTH(sess.date)=? AND YEAR(sess.date)=?`,
      [id, orgId, m, y]
    );

    // last 6 months trend
    const trend = await query(
      `SELECT
        DATE_FORMAT(sess.date,'%Y-%m') AS month,
        COUNT(*) AS total,
        SUM(ar.status='present') AS present,
        ROUND(SUM(ar.status='present')/NULLIF(COUNT(*),0)*100,1) AS pct
       FROM client_attendance_records ar
       JOIN client_attendance_sessions sess ON sess.id=ar.session_id
       WHERE ar.student_id=? AND ar.org_id=?
         AND sess.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(sess.date,'%Y-%m')
       ORDER BY month ASC`,
      [id, orgId]
    );

    return success(res, { records, overall, monthly, trend, month: m, year: y });
  } catch(e) { return error(res, e.message, 500); }
});

// A student's fee assignments + payment history is FINANCE data. `students.view`
// (which teachers hold) must not expose it — restrict to finance/elevated roles,
// matching the fees module's own policy.
router.get('/:id/fees', requireRole('owner','admin','principal','accountant','super_admin','system_admin'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const assignments = await query(
      `SELECT fa.*,
        fs.name AS structure_name, fs.frequency, fs.amount AS structure_amount,
        fa.final_amount,
        COALESCE(SUM(fp.amount),0) AS paid,
        fa.final_amount - COALESCE(SUM(fp.amount),0) AS due,
        fa.discount_percent, fa.discount_amount
       FROM client_fee_assignments fa
       JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
       LEFT JOIN client_fee_payments fp ON fp.fee_assignment_id=fa.id AND fp.status='completed'
       WHERE fa.student_id=? AND fa.org_id=?
       GROUP BY fa.id
       ORDER BY fa.assigned_date DESC`,
      [id, orgId]
    );

    const payments = await query(
      `SELECT fp.*, fs.name AS structure_name,
        fp.receipt_number, fp.payment_date, fp.payment_mode, fp.amount
       FROM client_fee_payments fp
       JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
       JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
       WHERE fa.student_id=? AND fp.org_id=?
       ORDER BY fp.payment_date DESC`,
      [id, orgId]
    );

    const summary = {
      total_assigned: assignments.reduce(( s,a)=>s+parseFloat(a.final_amount||0),0),
      total_paid:     assignments.reduce(( s,a)=>s+parseFloat(a.paid||0),0),
      total_due:      assignments.reduce(( s,a)=>s+parseFloat(a.due||0),0),
    };

    return success(res, { assignments, payments, summary });
  } catch(e) { return error(res, e.message, 500); }
});

// ── Teacher's own students (SUG-0025 §8 + §22) — class-scoped, fail-closed ──
// A teacher may only see students in the sections they actually teach
// (timetable-scoped). Elevated staff see all active students in their org.
router.get('/teacher/mine', requirePermission('students.view'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const role = (req.user.role_slug || '').toLowerCase();
    const elevated = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'].includes(role);
    let rows;
    if (elevated) {
      rows = await query(
        `SELECT cs.id, cs.admission_number, u.first_name, u.last_name, u.email,
                sec.id AS section_id, sec.name AS section_name, c.id AS class_id, c.name AS class_name,
                EXISTS(SELECT 1 FROM client_parent_students ps WHERE ps.student_id=cs.id AND COALESCE(ps.status,'active')='active') AS has_parent
           FROM client_students cs
           JOIN client_users u ON u.id=cs.user_id
           JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
           JOIN client_sections sec ON sec.id=e.section_id
           JOIN client_classes c ON c.id=sec.class_id
          WHERE cs.org_id=? AND u.is_active=1
          ORDER BY c.name, sec.name, u.first_name`, [o]);
    } else if (role === 'teacher') {
      // Was a bare join on client_timetable_slots, so a class teacher whose
      // school had drawn no timetable got an empty roster — the JDPS P-0 bug in
      // its second-to-last hiding place. One scope now: timetable ∪ subject
      // assignments ∪ class teacher. — 2026-07-29
      const scope = teacherSectionsSql(o, uid);
      rows = await query(
        `SELECT DISTINCT cs.id, cs.admission_number, u.first_name, u.last_name, u.email,
                sec.id AS section_id, sec.name AS section_name, c.id AS class_id, c.name AS class_name,
                EXISTS(SELECT 1 FROM client_parent_students ps WHERE ps.student_id=cs.id AND COALESCE(ps.status,'active')='active') AS has_parent
           FROM client_enrollments e
           JOIN client_students cs ON cs.id=e.student_id
           JOIN client_users u ON u.id=cs.user_id
           JOIN client_sections sec ON sec.id=e.section_id
           JOIN client_classes c ON c.id=sec.class_id
          WHERE e.org_id=? AND e.status='active' AND u.is_active=1
            AND e.section_id IN (${scope.sql})
          ORDER BY c.name, sec.name, u.first_name`, [o, ...scope.params]);
    } else {
      return error(res, 'Forbidden', 403);
    }
    return success(res, { students: rows });
  } catch (e) { return error(res, e.message, 500); }
});

/* ── A class teacher looks after their own section ────────────────────────
 *
 * AK, 2026-07-29: "Students Add/Edit/View krne ka option Class Teacher ke paas
 * rahega, but delete or edit goes to pending from admin approval."
 *
 * ADD is immediate — a new child in your own section is a fact you are the
 * first to know, and it is additive.
 * EDIT and DELETE are not. A wrong edit is quiet and a delete is quieter
 * still, so both become a request an admin approves; the mutation is held in
 * `payload_json` and applied only on approval, through the SAME controller the
 * admin uses, so there is exactly one write path.
 *
 * Elevated staff are untouched by all of this — their edit and delete keep
 * landing immediately, exactly as before.
 *
 * The approval shape is lifted from client_link_requests / parent-link, which
 * this platform already runs, rather than inventing a second one.
 */
const isTeacherActor = (req) => ['teacher', 'class_teacher'].includes((req.user.role_slug || '').toLowerCase());

/*
 * The class teacher's authority here comes from OWNING THE SECTION, not from a
 * granted permission — so these handlers are registered BEFORE the permission-
 * gated ones and hand over with next('route') for everybody else. Doing it the
 * other way round (granting teachers students.create/edit/delete) would widen
 * RBAC for every org on the platform to serve one workflow, and would also let
 * a plain subject teacher edit any child in the school.
 */
const notTeacher = (req, res, next) => (isTeacherActor(req) ? next() : next('route'));

/*
 * A teacher may only add a child INTO A SECTION THEY RUN. Anyone can claim a
 * section_id in a form body; teacherIsHomeroomOf is what decides.
 *
 * It used to be teacherTeachesSection — the "may I see/teach this" scope, which
 * folds in timetable periods and subject assignments. That admitted a child on
 * the strength of taking one period of Science in the room. AK, 2026-08-05, on
 * a live school: admission belongs to the CLASS INCHARGE (every section of
 * their class) and to the SECTION's class teacher (that one section). The
 * Classes screen shows the Add button by exactly this rule, so the button and
 * this gate answer the same question.
 */
const scopeStudentCreateForTeacher = async (req, res, next) => {
  try {
    const sectionId = req.body.section_id;
    if (!sectionId) {
      return error(res, `Choose the section this student joins — you can add students to your own sections`, 400);
    }
    const ok = await teacherIsHomeroomOf(req.user.org_id, req.user.user_id, sectionId);
    if (!ok) return error(res, 'Only the class incharge or the section\'s class teacher can add a student here', 403);
    return next();
  } catch (e) { return error(res, e.message, 500); }
};

// EDIT / DELETE by a teacher never reach the controller. They are recorded and
// wait for an admin.
const holdStudentChangeForApproval = (changeType) => async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const studentId = req.params.id;

    const ok = await teacherTeachesStudent(orgId, req.user.user_id, studentId);
    if (!ok) return error(res, 'Forbidden', 403);

    // Snapshot what it looks like NOW, so the admin approving three days later
    // can see what is actually being changed. The audit log cannot show them
    // that at approval time.
    const before = await queryOne(
      `SELECT s.id, s.admission_number, s.date_of_birth, s.gender, s.lifecycle_status,
              u.first_name, u.last_name, u.email, u.phone,
              e.section_id
         FROM client_students s
         LEFT JOIN client_users u ON u.id = s.user_id
         LEFT JOIN client_enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE s.id = ? AND s.org_id = ?`, [studentId, orgId]);
    if (!before) return error(res, 'Student not found', 404);

    // One open request per student per type — a second click is the same ask.
    const open = await queryOne(
      `SELECT id FROM client_student_change_requests
        WHERE org_id=? AND student_id=? AND change_type=? AND status='pending'`,
      [orgId, studentId, changeType]);
    if (open) {
      return success(res, { request_id: open.id, status: 'pending' },
        'Already waiting for admin approval', 202);
    }

    const r = await query(
      `INSERT INTO client_student_change_requests
         (org_id, student_id, section_id, requested_by_user_id, requester_role,
          change_type, payload_json, old_snapshot_json, reason, status)
       VALUES (?,?,?,?,?,?,?,?,?,'pending')`,
      [orgId, studentId, before.section_id || null, req.user.user_id,
       req.user.role_slug || 'teacher', changeType,
       changeType === 'edit' ? JSON.stringify(req.body || {}) : null,
       JSON.stringify(before),
       (req.body && req.body.reason) ? String(req.body.reason).slice(0, 500) : null]);

    await audit(req, 'STUDENT_CHANGE_REQUEST', 'student', Number(studentId), {
      old_data: before, new_data: { request_id: r.insertId, change_type: changeType, payload: req.body || {} },
    });

    return success(res, { request_id: r.insertId, status: 'pending' },
      changeType === 'delete'
        ? 'Sent to the admin for approval — nothing has been removed yet'
        : 'Sent to the admin for approval — nothing has changed yet',
      202);
  } catch (e) { return error(res, e.message, 500); }
};

// ── the queue an admin works from ─────────────────────────────────────────
router.get('/change-requests', requirePermission('students.edit'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const status = req.query.status || 'pending';
    const rows = await query(
      `SELECT cr.*,
              TRIM(CONCAT(COALESCE(su.first_name,''),' ',COALESCE(su.last_name,''))) AS student_name,
              st.admission_number,
              TRIM(CONCAT(COALESCE(ru.first_name,''),' ',COALESCE(ru.last_name,''))) AS requested_by_name,
              sec.name AS section_name, c.name AS class_name
         FROM client_student_change_requests cr
         LEFT JOIN client_students st ON st.id = cr.student_id
         LEFT JOIN client_users su ON su.id = st.user_id
         LEFT JOIN client_users ru ON ru.id = cr.requested_by_user_id
         LEFT JOIN client_sections sec ON sec.id = cr.section_id
         LEFT JOIN client_classes c ON c.id = sec.class_id
        WHERE cr.org_id = ? AND (? = 'all' OR cr.status = ?)
        ORDER BY cr.created_at DESC
        LIMIT 200`, [orgId, status, status]);
    for (const r of rows) {
      try { r.payload = r.payload_json ? JSON.parse(r.payload_json) : null; } catch { r.payload = null; }
      try { r.before = r.old_snapshot_json ? JSON.parse(r.old_snapshot_json) : null; } catch { r.before = null; }
      delete r.payload_json; delete r.old_snapshot_json;
      // The joins above are the STUDENT joins, so a teacher/parent request comes
      // back with a blank name — an approval queue whose rows do not say who
      // they are about is worse than no queue. Fall back to the snapshot taken
      // when the request was filed, which is the name at the time anyway.
      r.entity_type = r.entity_type || 'student';
      if (!r.student_name && r.before?.name) r.student_name = r.before.name;
    }
    return success(res, { requests: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Approve — apply the held mutation through the SAME controller an admin uses,
// so approved changes and direct admin changes cannot behave differently.
router.post('/change-requests/:id/approve', requirePermission('students.edit'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const cr = await queryOne(
      `SELECT * FROM client_student_change_requests WHERE id=? AND org_id=? AND status='pending'`,
      [req.params.id, orgId]);
    if (!cr) return error(res, 'That request is not open any more', 404);

    // Mark it decided FIRST and only if it is still pending: two admins
    // clicking Approve at the same moment must not apply the change twice.
    const claim = await query(
      `UPDATE client_student_change_requests
          SET status='approved', reviewed_by_user_id=?, reviewed_at=NOW()
        WHERE id=? AND org_id=? AND status='pending'`,
      [req.user.user_id, cr.id, orgId]);
    if (!claim.affectedRows) return error(res, 'That request was just decided by someone else', 409);

    /*
     * A non-student person (teacher, parent, staff) took a different road here.
     * Their delete ALREADY deactivated them at request time — that is what
     * "inactive and submit for admin approval" means — so approving is a
     * confirmation, not a second mutation. Replaying the student controller
     * against a teacher id would edit the wrong table entirely.
     */
    if (cr.entity_type && cr.entity_type !== 'student') {
      await audit(req, 'PERSON_DELETE_APPROVED', cr.entity_type, cr.student_id, {
        old_data: cr.old_snapshot_json ? JSON.parse(cr.old_snapshot_json) : null,
        new_data: { approved_request: cr.id, requested_by: cr.requested_by_user_id },
      });
      return success(res, {}, 'Removal approved');
    }

    // Replay it as the controller would — one write path for both routes.
    const inner = {
      ...req,
      params: { id: String(cr.student_id) },
      body: cr.payload_json ? JSON.parse(cr.payload_json) : {},
      user: req.user,
    };
    let applied = true;
    const capture = {
      json: () => {}, status: () => capture, send: () => {},
    };
    try {
      if (cr.change_type === 'edit') await ctrl.update(inner, capture);
      else await ctrl.remove(inner, capture);
    } catch (e) {
      applied = false;
      // The decision is already recorded; say plainly that the change did not
      // land rather than leaving an "approved" row that changed nothing.
      await query(
        `UPDATE client_student_change_requests SET status='pending', reviewed_by_user_id=NULL, reviewed_at=NULL WHERE id=?`,
        [cr.id]);
      return error(res, `Approved, but the change could not be applied: ${e.message}`, 500);
    }

    await audit(req, cr.change_type === 'edit' ? 'STUDENT_UPDATE' : 'STUDENT_DELETE', 'student', cr.student_id, {
      old_data: cr.old_snapshot_json ? JSON.parse(cr.old_snapshot_json) : null,
      new_data: { approved_request: cr.id, requested_by: cr.requested_by_user_id, applied },
    });
    return success(res, {}, cr.change_type === 'delete' ? 'Removal approved' : 'Change approved');
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/change-requests/:id/reject', requirePermission('students.edit'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const reason = req.body && req.body.reason ? String(req.body.reason).slice(0, 500) : null;
    // Read it BEFORE deciding: rejecting a non-student deletion has to undo
    // something, and after the UPDATE we can no longer tell what.
    const cr = await queryOne(
      `SELECT id, entity_type, student_id, change_type FROM client_student_change_requests
        WHERE id=? AND org_id=? AND status='pending'`, [req.params.id, orgId]);
    const r = await query(
      `UPDATE client_student_change_requests
          SET status='rejected', rejection_reason=?, reviewed_by_user_id=?, reviewed_at=NOW()
        WHERE id=? AND org_id=? AND status='pending'`,
      [reason, req.user.user_id, req.params.id, orgId]);
    if (!r.affectedRows) return error(res, 'That request is not open any more', 404);

    /*
     * A rejected deletion must PUT THE PERSON BACK.
     *
     * For a student, nothing had happened yet — the mutation was held and
     * rejecting simply drops it. For a teacher/parent/staff member the delete
     * already deactivated them at request time ("inactive and submit for
     * approval"), so a reject that only stamped the row would have left them
     * removed from every roster with the request marked "rejected" — the admin
     * says no and the person stays gone. Restore them.
     */
    if (cr && cr.entity_type && cr.entity_type !== 'student' && cr.change_type === 'delete') {
      const person = await lifecycle.resolveUser(orgId, cr.entity_type, cr.student_id);
      if (person) await lifecycle.activate(orgId, person.user_id);
      await audit(req, 'PERSON_DELETE_REJECTED', cr.entity_type, cr.student_id,
        { new_data: { request_id: cr.id, reason, restored: !!person } });
      return success(res, {}, 'Request rejected — the person has been restored');
    }

    await audit(req, 'STUDENT_CHANGE_REJECT', 'student', null, { new_data: { request_id: Number(req.params.id), reason } });
    return success(res, {}, 'Request rejected');
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Put a student back.
 *
 * Archiving a student has always been reversible (client_users.is_active = 0)
 * but nothing could reverse it — the only way back was a DB edit. So "Remove"
 * was a soft delete with a hard feel. This is the other half, and it is what
 * the ten-second Undo calls; it is also how an admin reinstates a child who
 * left and came back.
 */
router.post('/:id/activate', requirePermission('students.edit'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const person = await lifecycle.resolveUser(orgId, 'student', req.params.id);
    if (!person) return error(res, 'Student not found', 404);
    await lifecycle.activate(orgId, person.user_id);
    await query(
      `UPDATE client_student_change_requests SET status='cancelled'
        WHERE org_id=? AND entity_type='student' AND student_id=? AND change_type='delete' AND status='pending'`,
      [orgId, req.params.id]);
    await audit(req, 'STUDENT_REACTIVATED', 'student', Number(req.params.id), {});
    return success(res, {}, 'Student restored');
  } catch (e) { return error(res, e.message, 500); }
});

// ── existing controller routes ──────────────────────────────────────────────
// A class teacher, on their own section: add lands, edit and delete wait.
// These are declared FIRST and pass everyone else through with next('route').
router.post('/',      notTeacher, scopeStudentCreateForTeacher, ctrl.create);
router.put('/:id',    notTeacher, holdStudentChangeForApproval('edit'));
router.delete('/:id', notTeacher, holdStudentChangeForApproval('delete'));

router.get('/',      requirePermission('students.view'),   ctrl.list);
router.get('/:id',   requirePermission('students.view'),   scopeStudentForTeacher, ctrl.getOne);
router.post('/',     requirePermission('students.create'), ctrl.create);
router.put('/:id',   requirePermission('students.edit'),   ctrl.update);
router.delete('/:id',requirePermission('students.delete'), ctrl.remove);

module.exports = router;
