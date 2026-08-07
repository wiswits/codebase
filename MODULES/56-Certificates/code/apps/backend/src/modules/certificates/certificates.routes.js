const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { teacherTeachesStudent } = require('../../middleware/teacherScope');
const { audit } = require('../../utils/audit');

/*
 * Certificates — native (ADR-012, §7). Staff issue immutable certificates to
 * students; students/parents view + print; anyone authenticated can verify by
 * number. NO hard delete — revoke only (§12 "certificates immutable" · §3 P3).
 */

router.use(authenticate);

const STAFF = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
const ADMIN_TIER = ['owner', 'admin', 'principal', 'super_admin', 'system_admin'];
const isStaff = (u) => STAFF.includes((u.role_slug || '').toLowerCase());
const isAdminTier = (u) => ADMIN_TIER.includes((u.role_slug || '').toLowerCase());

const TYPES = ['completion', 'achievement', 'merit', 'excellence', 'participation'];

// Access guard — mirrors reportcards.canViewStudentReport (prevents IDOR).
async function canViewStudent(user, studentId, orgId) {
  if (isStaff(user)) return true;
  const slug = (user.role_slug || '').toLowerCase();
  if (slug === 'teacher') return teacherTeachesStudent(orgId, user.user_id, studentId);
  if (slug === 'student') {
    const self = await queryOne('SELECT 1 FROM client_students WHERE id=? AND org_id=? AND user_id=?', [studentId, orgId, user.user_id]);
    return !!self;
  }
  if (slug === 'parent') {
    const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, user.user_id]);
    if (!parent) return false;
    const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
    return !!link;
  }
  return false;
}

// Immutable serial: WW-<org>-<year>-<seq>. Retry on the (rare) unique collision.
async function nextNumber(orgId, year) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await query(
      `SELECT COUNT(*) AS n FROM client_certificates WHERE org_id=? AND YEAR(issue_date)=?`, [orgId, year]);
    const seq = (row.n || 0) + 1 + attempt;
    const num = `WW-${orgId}-${year}-${String(seq).padStart(4, '0')}`;
    const dup = await queryOne(`SELECT 1 FROM client_certificates WHERE certificate_number=?`, [num]);
    if (!dup) return num;
  }
  return `WW-${orgId}-${year}-${Date.now().toString().slice(-6)}`;
}

// ─── ISSUE (staff; a teacher may only issue to students they teach) ──────────
router.post('/', requireRole('owner', 'admin', 'principal', 'coordinator', 'hod', 'teacher', 'super_admin', 'system_admin'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      student_id, type, title, description, context_type, context_ref,
      grade, score, issue_date, signatory_name, signatory_role,
    } = req.body;

    if (!student_id) return error(res, 'Student is required', 400);
    if (!title || !title.trim()) return error(res, 'Title is required', 400);
    const ctype = TYPES.includes(type) ? type : 'completion';

    // Student must belong to this org
    const stu = await queryOne(
      `SELECT s.id, u.first_name, u.last_name FROM client_students s
         JOIN client_users u ON u.id=s.user_id
        WHERE s.id=? AND s.org_id=?`, [student_id, o]);
    if (!stu) return error(res, 'Student not found', 404);

    // A teacher can only issue to a student they actually teach (anti-IDOR)
    if ((req.user.role_slug || '').toLowerCase() === 'teacher') {
      const ok = await teacherTeachesStudent(o, req.user.user_id, student_id);
      if (!ok) return error(res, 'You can only issue certificates to students you teach', 403);
    }

    const day = (issue_date && /^\d{4}-\d{2}-\d{2}$/.test(issue_date))
      ? issue_date
      : new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // IST today
    const year = parseInt(day.slice(0, 4), 10);
    const number = await nextNumber(o, year);

    const r = await query(
      `INSERT INTO client_certificates
        (org_id, certificate_number, student_id, type, title, description, context_type, context_ref,
         grade, score, issue_date, signatory_name, signatory_role, issued_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o, number, student_id, ctype, title.trim(), description || null, context_type || 'manual',
       context_ref || null, grade || null, score || null, day, signatory_name || null,
       signatory_role || null, req.user.user_id]);

    await audit(req, 'CERTIFICATE_ISSUE', 'client_certificates', r.insertId).catch(() => {});
    return success(res, { id: r.insertId, certificate_number: number }, 'Certificate issued ✓', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ─── STAFF LIST (org-scoped; teacher sees own-issued + taught students) ──────
router.get('/', requireRole('owner', 'admin', 'principal', 'coordinator', 'hod', 'teacher', 'super_admin', 'system_admin'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { type, status, student_id, search, limit = 100 } = req.query;
    let where = 'WHERE c.org_id=?';
    const p = [o];
    // Teacher: restrict to certs they issued OR students they teach
    if ((req.user.role_slug || '').toLowerCase() === 'teacher') {
      where += ` AND (c.issued_by=? OR c.student_id IN (
        SELECT DISTINCT e.student_id FROM client_timetable_slots ts
          JOIN client_sections sec ON sec.id=ts.section_id
          JOIN client_enrollments e ON e.section_id=sec.id AND e.status='active'
         WHERE ts.teacher_id=? AND ts.org_id=?))`;
      p.push(req.user.user_id, req.user.user_id, o);
    }
    if (type)       { where += ' AND c.type=?';   p.push(type); }
    if (status)     { where += ' AND c.status=?'; p.push(status); }
    if (student_id) { where += ' AND c.student_id=?'; p.push(student_id); }
    if (search)     { where += ' AND (c.title LIKE ? OR c.certificate_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
                      const s = `%${search}%`; p.push(s, s, s, s); }
    const rows = await query(
      `SELECT c.id, c.certificate_number, c.student_id, c.type, c.title, c.grade, c.score,
              c.issue_date, c.status, c.context_ref,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name
         FROM client_certificates c
         JOIN client_students s ON s.id=c.student_id
         JOIN client_users u ON u.id=s.user_id
         ${where}
        ORDER BY c.created_at DESC LIMIT ?`,
      [...p, Math.min(parseInt(limit) || 100, 300)]);
    return success(res, { certificates: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ─── MY (student: own; parent: children's) ──────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const o = req.user.org_id;
    const slug = (req.user.role_slug || '').toLowerCase();
    let studentIds = [];
    if (slug === 'student') {
      const s = await queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, o]);
      if (s) studentIds = [s.id];
    } else if (slug === 'parent') {
      const parent = await queryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [req.user.user_id, o]);
      if (parent) {
        const kids = await query('SELECT student_id FROM client_parent_students WHERE parent_id=? AND org_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, o]);
        studentIds = kids.map(k => k.student_id);
      }
    } else {
      return error(res, 'Use the staff list', 403);
    }
    if (!studentIds.length) return success(res, { certificates: [] });
    const rows = await query(
      `SELECT c.id, c.certificate_number, c.student_id, c.type, c.title, c.description, c.grade, c.score,
              c.issue_date, c.status, c.context_ref,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name
         FROM client_certificates c
         JOIN client_students s ON s.id=c.student_id
         JOIN client_users u ON u.id=s.user_id
        WHERE c.org_id=? AND c.status='issued' AND c.student_id IN (${studentIds.map(() => '?').join(',')})
        ORDER BY c.issue_date DESC`,
      [o, ...studentIds]);
    return success(res, { certificates: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ─── VERIFY by number (any authenticated user; minimal, cross-org) ──────────
router.get('/verify/:number', async (req, res) => {
  try {
    const row = await queryOne(
      `SELECT c.certificate_number, c.type, c.title, c.issue_date, c.status,
              CONCAT(u.first_name,' ',LEFT(COALESCE(u.last_name,''),1)) AS holder,
              o.name AS school
         FROM client_certificates c
         JOIN client_students s ON s.id=c.student_id
         JOIN client_users u ON u.id=s.user_id
         JOIN client_organizations o ON o.id=c.org_id
        WHERE c.certificate_number=?`, [req.params.number]);
    if (!row) return success(res, { valid: false }, 'No certificate with that number');
    return success(res, {
      valid: row.status === 'issued',
      status: row.status, title: row.title, type: row.type,
      holder: row.holder, school: row.school, issue_date: row.issue_date,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ─── ONE (full, for printable view — ownership-checked) ─────────────────────
router.get('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const c = await queryOne(
      `SELECT c.*, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
              cl.name AS class_name, sec.name AS section_name, org.name AS school_name
         FROM client_certificates c
         JOIN client_students s ON s.id=c.student_id
         JOIN client_users u ON u.id=s.user_id
         JOIN client_organizations org ON org.id=c.org_id
         LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
         LEFT JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes cl ON cl.id=sec.class_id
        WHERE c.id=? AND c.org_id=?`, [req.params.id, o]);
    if (!c) return error(res, 'Certificate not found', 404);
    const ok = await canViewStudent(req.user, c.student_id, o);
    if (!ok) return error(res, 'Not authorized to view this certificate', 403);
    return success(res, { certificate: c });
  } catch (e) { return error(res, e.message, 500); }
});

// ─── REVOKE (admin-tier only; immutable — status change + reason, no delete) ─
router.post('/:id/revoke', requireRole(...ADMIN_TIER), async (req, res) => {
  try {
    const o = req.user.org_id;
    const reason = (req.body && req.body.reason ? String(req.body.reason) : '').slice(0, 300);
    const c = await queryOne(`SELECT id, status FROM client_certificates WHERE id=? AND org_id=?`, [req.params.id, o]);
    if (!c) return error(res, 'Not found', 404);
    if (c.status === 'revoked') return success(res, {}, 'Already revoked');
    await query(`UPDATE client_certificates SET status='revoked', revoke_reason=?, revoked_by=? WHERE id=? AND org_id=?`,
      [reason || null, req.user.user_id, req.params.id, o]);
    await audit(req, 'CERTIFICATE_REVOKE', 'client_certificates', req.params.id).catch(() => {});
    return success(res, {}, 'Certificate revoked');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
