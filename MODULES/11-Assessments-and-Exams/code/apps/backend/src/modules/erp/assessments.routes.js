const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error, paginated } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
// multi-branch: scope exams to the active branch (null for single-branch orgs → unchanged)
const { getActiveSchool, getWriteSchool } = require('../../utils/activeSchool');
const { requirePermission, requireRole } = require('../../middleware/rbac');
// ONE definition of "a child who actually attends" — an active enrolment whose
// student is not archived. Shared with classes/sections/timetable/assignments so
// a section's strength cannot read one number here and another there.
const { activeEnrolment } = require('../../utils/headcount');
// Teachers legitimately enter/manage marks but the seeded teacher role lacks an
// 'assessments.*' permission, so gate assessment writes by ROLE (admins auto-pass
// via base_role, teachers included) rather than a permission they don't hold.
const canManageAssessments = requireRole('owner', 'admin', 'principal', 'teacher');
const { teacherTeachesSection, teacherTeachesStudent } = require('../../middleware/teacherScope');
// Reading a whole section's marks/results is staff-only; a teacher must actually
// teach that section. Was ungated — any authenticated user (incl. a student)
// could pull any class's marks. (SUG-0017)
const SECTION_STAFF = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
async function requireSectionAccess(req, res, next) {
  try {
    const u = req.user;
    if (SECTION_STAFF.includes(u.role_slug)) return next();
    if (u.role_slug === 'teacher' && await teacherTeachesSection(u.org_id, u.user_id, req.params.sectionId)) return next();
    return error(res, 'Forbidden', 403);
  } catch (e) { return error(res, 'Forbidden', 403); }
}
const logger = require('../../utils/logger');
const { audit } = require('../../utils/audit');
// ONE definition of "a student's result percentage" + ONE rounding rule,
// shared with the student/parent dashboards — see utils/examResult.js.
const { RESULT_ELIGIBLE_SQL, weightedPercent, roundPct } = require('../../utils/examResult');

/* Calendar-date guard.
 * A native <input type="date"> rendered dd/mm/yyyy has its own YEAR segment;
 * typing "26" there yields year 0026, and MariaDB stores '0026-04-20' happily —
 * which is the "exam subject date shows the wrong year" QA reported. The UI now
 * bounds those inputs, but the API is the authority: reject anything that is not
 * a plain YYYY-MM-DD inside a sane calendar window. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function badDate(d) {
  if (d === undefined || d === null || d === '') return null;      // optional → fine
  const s = String(d).slice(0, 10);
  if (!DATE_RE.test(s) || s < '2000-01-01' || s > '2099-12-31') return String(d);
  const t = new Date(s + 'T00:00:00Z');
  return Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== s ? String(d) : null;
}

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
// ─── Grade utility ──────────────────────────────────────────────────────────
const getGrade = (pct) => {
  if (pct == null || isNaN(pct)) return { grade: '—', remark: '—' };
  if (pct >= 91) return { grade: 'A+', remark: 'Outstanding Performance' };
  if (pct >= 81) return { grade: 'A',  remark: 'Excellent' };
  if (pct >= 71) return { grade: 'B+', remark: 'Very Good' };
  if (pct >= 61) return { grade: 'B',  remark: 'Good' };
  if (pct >= 51) return { grade: 'C',  remark: 'Satisfactory' };
  if (pct >= 41) return { grade: 'D',  remark: 'Needs Improvement' };
  return { grade: 'F', remark: 'Unsatisfactory — Immediate Attention Required' };
};

// ─── STATS ──────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    // multi-branch: fold the active branch into every exam count (null → unchanged)
    const activeSchool = await getActiveSchool(req);
    const sc = activeSchool ? ' AND school_id=?' : '';
    const p = (base) => activeSchool ? [...base, activeSchool] : base;
    const row = await queryOne(
      `SELECT
        (SELECT COUNT(*) FROM client_exams WHERE org_id=?${sc}) AS total_exams,
        (SELECT COUNT(*) FROM client_exams WHERE org_id=? AND status='ongoing'${sc}) AS ongoing,
        (SELECT COUNT(*) FROM client_exams WHERE org_id=? AND status='scheduled'${sc}) AS scheduled,
        (SELECT COUNT(*) FROM client_exams WHERE org_id=? AND status='published'${sc}) AS published,
        (SELECT COUNT(*) FROM client_exam_marks WHERE org_id=?) AS total_marks`,
      [...p([o]), ...p([o]), ...p([o]), ...p([o]), o]
    );
    return success(res, row);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── LIST exams ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { status, academic_year } = req.query;
    let where = 'WHERE e.org_id=?';
    const params = [o];
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND e.school_id=?'; params.push(activeSchool); }
    if (status) { where += ' AND e.status=?'; params.push(status); }
    if (academic_year) { where += ' AND e.academic_year=?'; params.push(academic_year); }

    const exams = await query(
      `SELECT e.*,
        (SELECT COUNT(*) FROM client_exam_subjects es WHERE es.exam_id=e.id) AS subject_count,
        (SELECT COUNT(DISTINCT es.section_id) FROM client_exam_sections es WHERE es.exam_id=e.id) AS section_count,
        (SELECT COUNT(*) FROM client_exam_marks m WHERE m.exam_id=e.id) AS marks_entered,
        (SELECT COUNT(*) * (SELECT COUNT(*) FROM client_exam_subjects WHERE exam_id=e.id)
          FROM client_enrollments en
          JOIN client_exam_sections xs ON xs.section_id=en.section_id
          WHERE xs.exam_id=e.id AND en.status='active') AS marks_expected
       FROM client_exams e ${where}
       ORDER BY e.start_date DESC`,
      params
    );
    return success(res, { exams });
  } catch(e) { logger.error('Exam list:', e); return error(res, e.message, 500); }
});

// ─── GET single exam ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const exam = await queryOne(
      'SELECT * FROM client_exams WHERE id=? AND org_id=?',
      [req.params.id, o]
    );
    if (!exam) return error(res, 'Exam not found', 404);

    const subjects = await query(
      `SELECT es.*, s.name AS subject_name, s.color AS subject_color
       FROM client_exam_subjects es
       JOIN client_subjects s ON s.id=es.subject_id
       WHERE es.exam_id=? ORDER BY es.exam_date, s.name`,
      [req.params.id]
    );

    const sections = await query(
      `SELECT xs.*, sec.name AS section_name, c.name AS class_name, c.standard,
        (SELECT COUNT(*) FROM client_enrollments e WHERE e.section_id=xs.section_id AND ${activeEnrolment('e')}) AS student_count
       FROM client_exam_sections xs
       JOIN client_sections sec ON sec.id=xs.section_id
       JOIN client_classes c ON c.id=xs.class_id
       WHERE xs.exam_id=?`,
      [req.params.id]
    );

    // An exam can hold marks while holding ZERO sections (seeded straight to
    // SQL, bypassing the publish guard). Reading `sections: []` alone made QA
    // conclude "no marks exist", while the dashboards — which reach marks via
    // client_exam_subjects — happily showed a percentage. Report the marks
    // count and the roster state explicitly so this detail can never be read
    // as "empty exam" when it is really "orphaned exam".
    const integrity = await queryOne(
      `SELECT (SELECT COUNT(*) FROM client_exam_marks m WHERE m.exam_id=? AND m.org_id=?) AS marks_entered,
              (SELECT COUNT(*) FROM client_exam_sections xs WHERE xs.exam_id=? AND xs.org_id=?) AS section_count`,
      [req.params.id, o, req.params.id, o]
    );
    const marksEntered  = Number(integrity?.marks_entered) || 0;
    const sectionCount  = Number(integrity?.section_count) || 0;
    // results_visible mirrors utils/examResult.js RESULT_ELIGIBLE_SQL exactly.
    const resultsVisible = sectionCount > 0 && marksEntered > 0 &&
      ['published', 'ongoing', 'completed'].includes(exam.status);

    return success(res, {
      exam, subjects, sections,
      marks_entered: marksEntered,
      results_visible: resultsVisible,
      // Set when the exam holds marks but no class is linked to it — the state
      // that breaks Report Cards. Repair: scripts/migrations/019_repair_empty_published_exams.js
      integrity_warning: (marksEntered > 0 && sectionCount === 0)
        ? 'This exam has marks but no class linked to it, so results and report cards cannot be produced. Link the classes that sat this exam.'
        : null,
    });
  // Logged, not just returned. This handler threw a ReferenceError on EVERY
  // exam for four days (WW-121) and the only trace anywhere was the reporter's
  // screenshot — the sibling list handler logs, this one did not.
  } catch(e) { logger.error('Exam detail:', e); return error(res, e.message, 500); }
});

// ─── CREATE exam ────────────────────────────────────────────────────────────
router.post('/', canManageAssessments, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, exam_type, academic_year, start_date, end_date, description,
            sections = [], subjects = [] } = req.body;

    if (!name || !start_date) return error(res, 'name and start_date required', 400);

    // Reject impossible calendar dates (see badDate above) before anything is written.
    const bad = badDate(start_date) || badDate(end_date) ||
                subjects.map(s => badDate(s && s.exam_date)).find(Boolean);
    if (bad) return error(res, `"${bad}" is not a valid date — please pick it from the calendar (YYYY-MM-DD, year 2000–2099).`, 400);

    // Validate weightage sum = 1
    if (subjects.length > 0) {
      const sum = subjects.reduce((s,x)=>s + parseFloat(x.weightage||0), 0);
      if (Math.abs(sum - 1) > 0.01) {
        return error(res, `Weightage must sum to 1.0 (got ${sum.toFixed(3)})`, 400);
      }
    }

    const writeSchool = await getWriteSchool(req);
    const r = await query(
      `INSERT INTO client_exams (org_id, name, exam_type, academic_year, start_date, end_date, description, status, created_by, school_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [o, name, exam_type||'unit_test', academic_year||'2025-26',
       start_date, end_date||null, description||null, 'draft', req.user.user_id, writeSchool]
    );
    const examId = r.insertId;

    // Link sections
    for (const s of sections) {
      await query(
        'INSERT IGNORE INTO client_exam_sections (org_id, exam_id, class_id, section_id) VALUES (?,?,?,?)',
        [o, examId, s.class_id, s.section_id]
      );
    }

    // Add subjects
    for (const sub of subjects) {
      await query(
        `INSERT INTO client_exam_subjects (org_id, exam_id, subject_id, max_marks, passing_marks, weightage, exam_date, exam_time, duration_mins)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [o, examId, sub.subject_id, sub.max_marks||100, sub.passing_marks||35,
         sub.weightage||0.2, sub.exam_date||null, sub.exam_time||null, sub.duration_mins||null]
      );
    }

    return success(res, { exam_id: examId }, 'Exam created', 201);
  } catch(e) { logger.error('Create exam:', e); return error(res, e.message, 500); }
});

// ─── UPDATE exam ────────────────────────────────────────────────────────────
router.put('/:id', canManageAssessments, async (req, res) => {
  try {
    const o = req.user.org_id;
    const exam = await queryOne('SELECT * FROM client_exams WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!exam) return error(res, 'Exam not found', 404);

    const { name, exam_type, academic_year, start_date, end_date, description, status } = req.body;

    const badUpd = badDate(start_date) || badDate(end_date);
    if (badUpd) return error(res, `"${badUpd}" is not a valid date — please pick it from the calendar (YYYY-MM-DD, year 2000–2099).`, 400);

    // ─── STATE INTEGRITY: an exam may not reach 'published' while it is empty ───
    // A published exam is visible to students/parents and drives report cards, so
    // publishing one with no sections, no subjects or no marks produces a dead
    // record (0 sections / 0% entered) and a blank marks screen for the teacher.
    // The server is the authority here — a UI-only guard is not a guard.
    if (status === 'published' && exam.status !== 'published') {
      const counts = await queryOne(
        `SELECT
          (SELECT COUNT(*) FROM client_exam_sections WHERE exam_id=? AND org_id=?) AS sections,
          (SELECT COUNT(*) FROM client_exam_subjects WHERE exam_id=? AND org_id=?) AS subjects,
          (SELECT COUNT(*) FROM client_exam_marks    WHERE exam_id=? AND org_id=?) AS marks`,
        [req.params.id, o, req.params.id, o, req.params.id, o]
      );
      const missing = [];
      if (!counts || !counts.sections) missing.push('at least one class section');
      if (!counts || !counts.subjects) missing.push('at least one subject');
      if (!counts || !counts.marks)    missing.push('marks entered for at least one student');
      if (missing.length) {
        return error(res, `This exam can't be published yet — it still needs ${missing.join(', ')}.`, 400);
      }
    }

    await query(
      `UPDATE client_exams SET
        name=COALESCE(?,name), exam_type=COALESCE(?,exam_type),
        academic_year=COALESCE(?,academic_year),
        start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date),
        description=COALESCE(?,description), status=COALESCE(?,status)
       WHERE id=?`,
      [name||null, exam_type||null, academic_year||null, start_date||null,
       end_date||null, description||null, status||null, req.params.id]
    );
    if (status === 'published' && exam.status !== 'published') {
      await audit(req, 'EXAM_PUBLISH', 'exam', req.params.id, { new_data: { status }, old_data: { status: exam.status } });
    }
    return success(res, {}, 'Exam updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── DELETE exam ────────────────────────────────────────────────────────────
// Exam deletion cascades (marks/subjects/sections). A teacher must NOT be able to
// wipe ANY exam org-wide — restrict deletion to elevated staff only.
router.delete('/:id', requireRole('owner','admin','principal','super_admin','system_admin'), async (req, res) => {
  try {
    const o = req.user.org_id;
    await query('DELETE FROM client_exam_marks WHERE exam_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_exam_subjects WHERE exam_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_exam_sections WHERE exam_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_exams WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Exam deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── MARKS ENTRY GRID for a section ──────────────────────────────────────────
router.get('/:id/marks/section/:sectionId', requireSectionAccess, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { id, sectionId } = req.params;

    const exam = await queryOne('SELECT * FROM client_exams WHERE id=? AND org_id=?', [id, o]);
    if (!exam) return error(res, 'Exam not found', 404);

    const subjects = await query(
      `SELECT es.*, s.name AS subject_name, s.color AS subject_color
       FROM client_exam_subjects es
       JOIN client_subjects s ON s.id=es.subject_id
       WHERE es.exam_id=? ORDER BY s.name`,
      [id]
    );

    const students = await query(
      `SELECT s.id AS student_id, s.admission_number,
        u.first_name, u.last_name
       FROM client_enrollments e
       JOIN client_students s ON s.id=e.student_id
       JOIN client_users u ON u.id=s.user_id
       WHERE e.section_id=? AND e.status='active' AND e.org_id=?
       ORDER BY u.first_name`,
      [sectionId, o]
    );

    const marks = await query(
      `SELECT m.* FROM client_exam_marks m
       WHERE m.exam_id=? AND m.org_id=?`,
      [id, o]
    );

    // Build a matrix: student_id -> subject_id -> marks
    const matrix = {};
    students.forEach(st => { matrix[st.student_id] = {}; });
    marks.forEach(m => {
      const es = subjects.find(x=>x.id===m.exam_subject_id);
      if (es && matrix[m.student_id]) {
        matrix[m.student_id][es.subject_id] = {
          mark_id: m.id,
          exam_subject_id: m.exam_subject_id,
          marks_obtained: m.marks_obtained,
          is_absent: m.is_absent,
        };
      }
    });

    return success(res, { exam, subjects, students, matrix });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── BULK save marks ────────────────────────────────────────────────────────
router.post('/:id/marks/bulk', canManageAssessments, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { id } = req.params;
    const { entries = [] } = req.body;
    // entries: [{ student_id, exam_subject_id, marks_obtained, is_absent }]

    const exam = await queryOne('SELECT * FROM client_exams WHERE id=? AND org_id=?', [id, o]);
    if (!exam) return error(res, 'Exam not found', 404);

    // SUG-0021: a teacher may only enter marks for a section they teach. Prefer a
    // section_id in the body; otherwise verify they teach every affected student.
    if (req.user.role_slug === 'teacher') {
      if (req.body.section_id) {
        if (!(await teacherTeachesSection(req.user.org_id, req.user.user_id, req.body.section_id))) {
          return error(res, 'Forbidden', 403);
        }
      } else {
        const studentIds = [...new Set(entries.map(e => e.student_id).filter(Boolean))];
        for (const sid of studentIds) {
          if (!(await teacherTeachesStudent(req.user.org_id, req.user.user_id, sid))) {
            return error(res, 'Forbidden', 403);
          }
        }
      }
    }

    // every student in the batch must belong to THIS org (covers elevated roles,
    // not just the teacher path above) — a crafted student_id must not receive
    // marks in another tenant. One check up front.
    const batchSids = [...new Set(entries.map(e => e.student_id).filter(Boolean))];
    if (batchSids.length) {
      const ph = batchSids.map(() => '?').join(',');
      const owned = await query(`SELECT id FROM client_students WHERE org_id=? AND id IN (${ph})`, [o, ...batchSids]);
      if (owned.length !== batchSids.length) return error(res, 'Some students do not belong to this school', 400);
    }

    let saved = 0;
    let errors = 0;

    for (const e of entries) {
      try {
        const es = await queryOne(
          'SELECT max_marks FROM client_exam_subjects WHERE id=? AND exam_id=? AND org_id=?',
          [e.exam_subject_id, id, o]
        );
        if (!es) { errors++; continue; }

        const marks = e.is_absent ? null : parseFloat(e.marks_obtained);
        if (!e.is_absent && (isNaN(marks) || marks < 0 || marks > es.max_marks)) {
          errors++; continue;
        }

        await query(
          `INSERT INTO client_exam_marks
           (org_id, exam_id, exam_subject_id, student_id, marks_obtained, is_absent, graded_by, graded_at)
           VALUES (?,?,?,?,?,?,?,NOW())
           ON DUPLICATE KEY UPDATE
             marks_obtained=VALUES(marks_obtained),
             is_absent=VALUES(is_absent),
             graded_by=VALUES(graded_by),
             graded_at=NOW()`,
          [o, id, e.exam_subject_id, e.student_id, marks, e.is_absent?1:0, req.user.user_id]
        );
        saved++;
      } catch(err) {
        logger.error('Mark save:', err);
        errors++;
      }
    }

    return success(res, { saved, errors, total: entries.length }, `Saved ${saved} marks`);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── RESULTS — per exam, per section (for admin view & reports) ─────────────
router.get('/:id/results/section/:sectionId', requireSectionAccess, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { id, sectionId } = req.params;

    const exam = await queryOne('SELECT * FROM client_exams WHERE id=? AND org_id=?', [id, o]);
    if (!exam) return error(res, 'Exam not found', 404);

    const subjects = await query(
      `SELECT es.*, s.name AS subject_name
       FROM client_exam_subjects es
       JOIN client_subjects s ON s.id=es.subject_id
       WHERE es.exam_id=? ORDER BY s.name`,
      [id]
    );

    const students = await query(
      `SELECT s.id AS student_id, s.admission_number,
        u.first_name, u.last_name
       FROM client_enrollments e
       JOIN client_students s ON s.id=e.student_id
       JOIN client_users u ON u.id=s.user_id
       WHERE e.section_id=? AND e.status='active' AND e.org_id=?`,
      [sectionId, o]
    );

    const marks = await query(
      `SELECT m.*, es.subject_id, es.max_marks, es.weightage, s.name AS subject_name
       FROM client_exam_marks m
       JOIN client_exam_subjects es ON es.id=m.exam_subject_id
       JOIN client_subjects s ON s.id=es.subject_id
       WHERE m.exam_id=? AND m.org_id=?`,
      [id, o]
    );

    // Build per-student totals
    const results = students.map(st => {
      const studentMarks = marks.filter(m => m.student_id === st.student_id);
      const bySubject = subjects.map(sub => {
        const m = studentMarks.find(x => x.exam_subject_id === sub.id);
        if (!m) return { subject_name: sub.subject_name, max_marks: sub.max_marks, marks_obtained: null, percent: null, weightage: sub.weightage };
        if (m.is_absent) return { subject_name: sub.subject_name, max_marks: sub.max_marks, marks_obtained: 'AB', percent: 0, weightage: sub.weightage };
        const pct = (parseFloat(m.marks_obtained)/parseFloat(sub.max_marks))*100;
        return { subject_name: sub.subject_name, max_marks: sub.max_marks, marks_obtained: parseFloat(m.marks_obtained), percent: pct, weightage: parseFloat(sub.weightage) };
      });

      // Same helper + same rounding as the report card and the dashboards
      // (utils/examResult.js) — a section results table that disagreed with the
      // report card it feeds is exactly the class of bug this file's rule kills.
      const weighted_pct = weightedPercent(bySubject) ?? 0;
      const grade = (() => {
        if (weighted_pct >= 91) return 'A+';
        if (weighted_pct >= 81) return 'A';
        if (weighted_pct >= 71) return 'B+';
        if (weighted_pct >= 61) return 'B';
        if (weighted_pct >= 51) return 'C';
        if (weighted_pct >= 41) return 'D';
        return 'F';
      })();

      return {
        ...st,
        subjects: bySubject,
        weighted_percent: weighted_pct,   // already rounded (utils/examResult.js)
        grade,
      };
    });

    // Sort by weighted_percent desc and assign rank
    results.sort((a,b) => b.weighted_percent - a.weighted_percent);
    results.forEach((r,i) => r.rank = i+1);

    // Class stats
    const valid = results.filter(r => r.weighted_percent > 0);
    const classStats = {
      average: valid.length ? Math.round(valid.reduce((s,x)=>s+x.weighted_percent,0) / valid.length * 100)/100 : 0,
      highest: valid.length ? Math.max(...valid.map(x=>x.weighted_percent)) : 0,
      lowest:  valid.length ? Math.min(...valid.map(x=>x.weighted_percent)) : 0,
      passed:  valid.filter(x=>x.weighted_percent >= 40).length,
      failed:  valid.filter(x=>x.weighted_percent < 40).length,
      total:   results.length,
    };

    return success(res, { exam, subjects, results, classStats });
  } catch(e) { logger.error('Results:', e); return error(res, e.message, 500); }
});

// ─── STUDENT PORTAL: own exam results ───────────────────────────────────────
router.get('/my/results', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const student = await queryOne(
      'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [uid, o]
    );
    if (!student) return error(res, 'Student not found', 404);

    // Result-eligible exams only (utils/examResult.js): a roster-linked,
    // result-bearing exam. An exam with marks but no client_exam_sections rows
    // cannot produce a report card, so it must not produce a percentage here.
    const exams = await query(
      `SELECT DISTINCT e.*
       FROM client_exams e
       JOIN client_exam_subjects es ON es.exam_id=e.id
       JOIN client_exam_marks m ON m.exam_subject_id=es.id AND m.student_id=?
       WHERE e.org_id=? AND ${RESULT_ELIGIBLE_SQL}
       ORDER BY e.start_date DESC`,
      [student.id, o]
    );

    const results = [];
    for (const exam of exams) {
      const marks = await query(
        `SELECT m.*, es.max_marks, es.weightage, s.name AS subject_name, s.color AS subject_color
         FROM client_exam_marks m
         JOIN client_exam_subjects es ON es.id=m.exam_subject_id
         JOIN client_subjects s ON s.id=es.subject_id
         WHERE m.exam_id=? AND m.student_id=? AND m.org_id=?
         ORDER BY s.name`,
        [exam.id, student.id, o]
      );

      const subjects = marks.map(m => {
        // Absent counts as 0 and STAYS in the weighting — this is exactly what
        // Report Cards does (reportcards.routes.js buildReportCard), and the two
        // must never disagree. A subject with no mark at all is percent null and
        // is excluded from the weighting instead.
        if (m.is_absent) return { ...m, marks_obtained: 'AB', percent: 0 };
        const max = parseFloat(m.max_marks);
        const pct = max > 0 ? roundPct((parseFloat(m.marks_obtained)/max)*100) : null;
        return { ...m, percent: pct };
      });

      // Single source + single rounding rule (utils/examResult.js). null means
      // "nothing gradeable" — the exam is skipped rather than reported as 0%.
      const weighted_pct = weightedPercent(subjects);
      if (weighted_pct === null) continue;

      let grade = 'F';
      if (weighted_pct >= 91) grade = 'A+';
      else if (weighted_pct >= 81) grade = 'A';
      else if (weighted_pct >= 71) grade = 'B+';
      else if (weighted_pct >= 61) grade = 'B';
      else if (weighted_pct >= 51) grade = 'C';
      else if (weighted_pct >= 41) grade = 'D';

      // Flattened: the student Performance page reads r.id/r.name/r.exam_type
      // at the top level — the nested {exam} shape rendered undefined names.
      results.push({
        ...exam,
        exam,
        subjects,
        weighted_percent: weighted_pct,   // already rounded by weightedPercent()
        grade,
      });
    }

    return success(res, { results });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── TEACHER: exams they can enter marks for ────────────────────────────────
router.get('/teacher/my-exams', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    // Get teacher's subjects
    const subjectIds = await query(
      'SELECT subject_id FROM client_teacher_subjects WHERE teacher_id=?',
      [uid]
    );
    const subIds = subjectIds.map(s => s.subject_id);

    const exams = await query(
      `SELECT DISTINCT e.*,
        (SELECT COUNT(*) FROM client_exam_subjects es WHERE es.exam_id=e.id) AS subject_count
       FROM client_exams e
       WHERE e.org_id=? AND e.status IN ('ongoing','scheduled','draft')
       ORDER BY e.start_date DESC`,
      [o]
    );

    return success(res, { exams });
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;
