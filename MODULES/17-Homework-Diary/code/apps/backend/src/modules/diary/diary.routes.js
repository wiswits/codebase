const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { teacherTeachesSection } = require('../../middleware/teacherScope');

router.use(authenticate);

const ELEVATED = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'];

// ── Teacher: create a diary entry for a section they teach ──────────────────
router.post('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const role = (req.user.role_slug || '').toLowerCase();
    const elevated = ELEVATED.includes(role);
    if (!elevated && role !== 'teacher') return error(res, 'Forbidden', 403);
    const { section_id, subject_id, entry_date, title, homework, note } = req.body;
    if (!section_id || !entry_date) return error(res, 'section_id and entry_date required', 400);
    if (!homework && !note && !title) return error(res, 'Add homework or a note', 400);
    if (!elevated && !(await teacherTeachesSection(o, uid, section_id))) return error(res, 'Forbidden', 403);

    const r = await query(
      `INSERT INTO client_diary_entries (org_id, section_id, subject_id, teacher_id, entry_date, title, homework, note)
       VALUES (?,?,?,?,?,?,?,?)`,
      [o, section_id, subject_id || null, uid, entry_date, title || null, homework || null, note || null]);
    return success(res, { id: r.insertId }, 'Diary entry added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Teacher: their own diary entries (optionally by section/date) ───────────
router.get('/mine', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const { section_id, date } = req.query;
    let where = 'd.org_id=? AND d.teacher_id=?'; const p = [o, uid];
    if (section_id) { where += ' AND d.section_id=?'; p.push(section_id); }
    if (date) { where += ' AND d.entry_date=?'; p.push(date); }
    const rows = await query(
      `SELECT d.*, DATE_FORMAT(d.entry_date,'%Y-%m-%d') AS entry_date,
              c.name AS class_name, sec.name AS section_name, sub.name AS subject_name
         FROM client_diary_entries d
         LEFT JOIN client_sections sec ON sec.id=d.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         LEFT JOIN client_subjects sub ON sub.id=d.subject_id
        WHERE ${where}
        ORDER BY d.entry_date DESC, d.id DESC LIMIT 200`, p);
    return success(res, { entries: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Teacher: delete own entry ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const elevated = ELEVATED.includes((req.user.role_slug || '').toLowerCase());
    const own = await queryOne('SELECT teacher_id FROM client_diary_entries WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!own) return error(res, 'Not found', 404);
    if (!elevated && own.teacher_id !== uid) return error(res, 'Forbidden', 403);
    await query('DELETE FROM client_diary_entries WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Student / Parent: read the diary for their (child's) section ────────────
router.get('/student', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const role = (req.user.role_slug || '').toLowerCase();
    let sectionIds = [];
    if (role === 'student') {
      const rows = await query(
        `SELECT e.section_id FROM client_enrollments e
           JOIN client_students s ON s.id=e.student_id
          WHERE s.user_id=? AND s.org_id=? AND e.status='active'`, [uid, o]);
      sectionIds = rows.map(r => r.section_id);
    } else if (role === 'parent') {
      const rows = await query(
        `SELECT e.section_id FROM client_parents p
           JOIN client_parent_students ps ON ps.parent_id=p.id
           JOIN client_enrollments e ON e.student_id=ps.student_id AND e.status='active'
          WHERE p.user_id=? AND p.org_id=?`, [uid, o]);
      sectionIds = [...new Set(rows.map(r => r.section_id))];
    } else {
      return error(res, 'Forbidden', 403);
    }
    if (!sectionIds.length) return success(res, { entries: [] });
    const ph = sectionIds.map(() => '?').join(',');
    const entries = await query(
      `SELECT d.id, DATE_FORMAT(d.entry_date,'%Y-%m-%d') AS entry_date, d.title, d.homework, d.note,
              c.name AS class_name, sec.name AS section_name, sub.name AS subject_name,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS teacher_name
         FROM client_diary_entries d
         LEFT JOIN client_sections sec ON sec.id=d.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
         LEFT JOIN client_subjects sub ON sub.id=d.subject_id
         LEFT JOIN client_users u ON u.id=d.teacher_id
        WHERE d.org_id=? AND d.section_id IN (${ph})
        ORDER BY d.entry_date DESC, d.id DESC LIMIT 200`, [o, ...sectionIds]);
    return success(res, { entries });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
