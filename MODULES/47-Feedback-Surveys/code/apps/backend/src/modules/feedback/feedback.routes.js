const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');

/*
 * Teacher Feedback v1 (SUG-0009) — ANONYMOUS student ratings.
 * - A student rates each of their section's teachers once per month (1–5).
 * - student_id is stored only for the once-per-month constraint; no read
 *   endpoint ever returns it, and per-teacher results only aggregate.
 * - Summary is elevated-only (owner/admin/principal see averages, not names).
 */

const ELEVATED = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
const monthNow = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 7); // IST wall-time

router.use(authenticate);

const myStudent = (req) =>
  queryOne('SELECT id FROM client_students WHERE org_id=? AND user_id=?', [req.user.org_id, req.user.user_id]);

// Teachers this student can rate (their section's timetable teachers) + own rating this month
router.get('/teachers', async (req, res) => {
  try {
    const o = req.user.org_id;
    const st = await myStudent(req);
    if (!st) return error(res, 'Students only', 403);
    const rows = await query(
      `SELECT DISTINCT u.id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
              COALESCE(u.designation,'Teacher') AS designation,
              (SELECT GROUP_CONCAT(DISTINCT sub.name SEPARATOR ', ')
                 FROM client_timetable_slots ts2
                 JOIN client_subjects sub ON sub.id=ts2.subject_id
                WHERE ts2.teacher_id=u.id AND ts2.section_id=e.section_id) AS subjects,
              mf.rating AS my_rating, mf.comment AS my_comment
         FROM client_enrollments e
         JOIN client_timetable_slots ts ON ts.section_id=e.section_id
         JOIN client_users u ON u.id=ts.teacher_id AND u.is_active=1
         LEFT JOIN client_teacher_feedback mf
           ON mf.org_id=? AND mf.teacher_id=u.id AND mf.student_id=? AND mf.month=?
        WHERE e.student_id=? AND e.status='active' AND u.org_id=?
        ORDER BY name`,
      [o, st.id, monthNow(), st.id, o]);
    return success(res, { month: monthNow(), teachers: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Rate (upsert for this month)
router.post('/teacher', async (req, res) => {
  try {
    const o = req.user.org_id;
    const st = await myStudent(req);
    if (!st) return error(res, 'Students only', 403);
    const teacher_id = parseInt(req.body.teacher_id);
    const rating = parseInt(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim().slice(0, 300) : null;
    if (!teacher_id || !(rating >= 1 && rating <= 5)) return error(res, 'teacher_id and rating 1-5 required', 400);
    const t = await queryOne(
      `SELECT u.id FROM client_users u
        WHERE u.id=? AND u.org_id=? AND EXISTS (
          SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id
           WHERE ur.user_id=u.id AND r.base_role='teacher')`, [teacher_id, o]);
    if (!t) return error(res, 'Teacher not found', 404);
    await query(
      `INSERT INTO client_teacher_feedback (org_id, teacher_id, student_id, rating, comment, month)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)`,
      [o, teacher_id, st.id, rating, comment || null, monthNow()]);
    return success(res, {}, 'Thanks — your feedback is anonymous 💛');
  } catch (e) { return error(res, e.message, 500); }
});

// Aggregated summary (elevated) — averages only, never who rated
router.get('/summary', async (req, res) => {
  try {
    if (!ELEVATED.includes((req.user.role_slug || '').toLowerCase())) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const rows = await query(
      `SELECT f.teacher_id, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name,
              ROUND(AVG(f.rating),1) AS avg_rating, COUNT(*) AS ratings,
              ROUND(AVG(CASE WHEN f.month=? THEN f.rating END),1) AS this_month
         FROM client_teacher_feedback f
         JOIN client_users u ON u.id=f.teacher_id
        WHERE f.org_id=? AND f.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 MONTH),'%Y-%m')
        GROUP BY f.teacher_id, name
        ORDER BY avg_rating DESC`,
      [monthNow(), o]);
    return success(res, { summary: rows });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
