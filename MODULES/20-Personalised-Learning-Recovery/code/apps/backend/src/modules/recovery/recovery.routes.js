'use strict';
const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const ctrl = require('./recovery.controller');
// One definition of topic accuracy / confidence / label — utils/weakArea.js.
const wa = require('../../utils/weakArea');

// Recovery compute/generate is STAFF-only. Without this gate any authenticated
// user (incl. student/parent) could trigger org-wide weak-area recomputes or
// drive unbounded AI worksheet generation. Self-reads (/me, /mine) stay open.
const recStaff = requireRole('owner','admin','principal','coordinator','academic_coordinator','hod','super_admin','system_admin','teacher');

// recStaff lets teachers in, but a PLAIN teacher may only touch students/classes
// they actually teach (elevated staff pass through). Mirrors the guard already on
// /worksheets/:id/assign + /analytics/student/:id.
const { teacherTeachesStudent } = require('../../middleware/teacherScope');
const { queryOne: recQueryOne } = require('../../config/db');
const isRecTeacher = (req) => ['teacher', 'class_teacher'].includes((req.user.role_slug || '').toLowerCase());
const recScopeStudent = (getId) => async (req, res, next) => {
  try {
    if (!isRecTeacher(req)) return next();
    const sid = getId(req);
    if (sid && !(await teacherTeachesStudent(req.user.org_id, req.user.user_id, sid)))
      return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
};
const recScopeClass = async (req, res, next) => {
  try {
    if (!isRecTeacher(req)) return next();
    const row = await recQueryOne(
      `SELECT 1 AS ok FROM client_timetable_slots ts JOIN client_sections sec ON sec.id=ts.section_id
        WHERE ts.teacher_id=? AND sec.class_id=? AND ts.org_id=? LIMIT 1`,
      [req.user.user_id, req.params.classId, req.user.org_id]);
    if (!row) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
};

// Token-in-query pre-auth (for ?token= on direct PDF links, same as worksheets)
router.use((req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

router.use(authenticate);

// Added by audit script — index endpoint. Was registered ABOVE
// router.use(authenticate) in file order, so it ran pre-auth (failed closed
// to an empty array — no data leaked — but the ordering was a latent bug).
// Moved below auth and gated to recStaff: it returns org-wide weak-area rows
// across all students, matching the module's other staff-only reads.
router.get('/', recStaff, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { query: q } = require('../../config/db');
    const rows = await q(
      `SELECT id, student_id, chapter_id, detected_signal, recovery_status, detected_at
       FROM client_weak_areas WHERE org_id = ? ORDER BY detected_at DESC LIMIT 100`,
      [orgId]
    );
    return res.json({ status: 'success', data: { weak_areas: rows } });
  } catch (e) {
    return res.json({ status: 'success', data: { weak_areas: [] } });
  }
});

// Per-worksheet access: a worksheet by id may be read/submitted ONLY by an
// assigned student, that student's linked parent, a teacher who teaches them, or
// elevated staff. Closes the IDOR where any user read/mutated any worksheet by id.
const { query: recQuery } = require('../../config/db');
const REC_ELEVATED_SET = new Set(['owner','admin','principal','coordinator','academic_coordinator','hod','super_admin','system_admin']);
const assertWorksheetAccess = async (req, res, next) => {
  try {
    const role = (req.user.role_slug || '').toLowerCase();
    if (REC_ELEVATED_SET.has(role)) return next();
    const org = req.user.org_id;
    const rows = await recQuery('SELECT student_id FROM client_worksheet_assignments WHERE worksheet_id=? AND org_id=?', [req.params.id, org]);
    const studentIds = rows.map((r) => r.student_id);
    if (role === 'student') {
      const me = await recQueryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, org]);
      if (me && studentIds.includes(me.id)) return next();
    } else if (role === 'parent' && studentIds.length) {
      const p = await recQueryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [req.user.user_id, org]);
      if (p) {
        const ph = studentIds.map(() => '?').join(',');
        const link = await recQueryOne(
          `SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id IN (${ph}) AND COALESCE(status,'active')='active'`,
          [p.id, ...studentIds]);
        if (link) return next();
      }
    } else if (['teacher', 'class_teacher'].includes(role)) {
      for (const sid of studentIds) {
        if (await teacherTeachesStudent(org, req.user.user_id, sid)) return next();
      }
    }
    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
};

// Logged-in student's OWN assigned recovery worksheets (SUG-0052).
// Registered BEFORE '/worksheets/:id' so 'mine' isn't captured as an id.
router.get('/worksheets/mine', async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const [[st]] = await db.pool.execute(
      'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [req.user.user_id, orgId]);
    if (!st) return res.json({ success: true, data: { worksheets: [] } });
    // client_recovery_worksheets has NO created_at — the column is `assigned_at`
    // (WW-54, WW-58). This SELECT named a column that has never existed, so the
    // endpoint answered 500 to every student from the day it was written, taking
    // BOTH the Worksheets page and the Recovery Hub down with it. Aliased rather
    // than renamed because the page prints `created_at`.
    const [rows] = await db.pool.execute(
      `SELECT w.id, w.difficulty, w.total_questions, w.total_marks, w.time_limit_min,
              w.attempt_status, w.assigned_at AS created_at
         FROM client_worksheet_assignments a
         JOIN client_recovery_worksheets w ON w.id=a.worksheet_id
        WHERE a.org_id=? AND a.student_id=?
        ORDER BY w.assigned_at DESC LIMIT 50`, [orgId, st.id]);
    return res.json({ success: true, data: { worksheets: rows, student_id: st.id } });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

router.post('/weak-areas/recalculate',     recStaff, ctrl.recalculate);
router.get('/weak-areas/me',               ctrl.getMyWeakAreas);
router.get('/weak-areas/student/:id',      recStaff, recScopeStudent(r => r.params.id), ctrl.getStudentWeakAreas);
router.get('/weak-areas/class/:classId',   recStaff, recScopeClass, ctrl.getClassWeakAreas);
router.post('/profile/build',           recStaff, recScopeStudent(r => r.body.student_id), ctrl.buildProfile);
router.get('/profile/me',                ctrl.getMyProfile);
router.get('/profile/student/:id',       recStaff, recScopeStudent(r => r.params.id), ctrl.getStudentProfile);
router.post('/worksheets/generate',         recStaff, recScopeStudent(r => r.body.student_id), ctrl.generateWorksheet);
router.get('/worksheets/:id',                assertWorksheetAccess, ctrl.getWorksheet);
router.get('/worksheets/:id/pdf',            assertWorksheetAccess, ctrl.downloadWorksheetPDF);
router.get('/worksheets/student/:id',        recStaff, recScopeStudent(r => r.params.id), ctrl.listStudentWorksheets);

// ═══ REVIEW FLOW (SUG-0052) — generate as draft → replace questions → assign ═══
// (teacherTeachesStudent imported above)
const REC_ELEVATED = ['owner','admin','principal','coordinator','hod','super_admin','system_admin'];

// Replace ONE question in a recovery worksheet with a fresh QB question from
// the same topic (any difficulty), never repeating a question already inside.
router.post('/worksheets/:id/replace-question', authenticate, recStaff, async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const { question_id } = req.body;
    if (!question_id) return res.status(400).json({ success: false, message: 'question_id required' });

    const [rows] = await db.pool.execute(
      'SELECT id, question_ids, difficulty FROM client_recovery_worksheets WHERE id=? AND org_id=?',
      [req.params.id, orgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Worksheet not found' });
    const wsRow = rows[0];
    let qIds = [];
    try { qIds = typeof wsRow.question_ids === 'string' ? JSON.parse(wsRow.question_ids) : wsRow.question_ids || []; } catch {}
    const idx = qIds.indexOf(parseInt(question_id));
    if (idx === -1) return res.status(400).json({ success: false, message: 'Question is not in this worksheet' });

    // The outgoing question's topic anchors the replacement.
    const [[oldQ]] = await db.pool.execute(
      'SELECT topic_id, chapter_id FROM client_qb_questions WHERE id=? AND org_id=?', [question_id, orgId]);
    const ph = qIds.map(() => '?').join(',');
    let candidates = [];
    if (oldQ?.topic_id) {
      [candidates] = await db.pool.execute(
        `SELECT id, question_text, options, correct_answer, solution, difficulty,
                marks_positive AS marks, topic_id, chapter_id, subject_id, source, bloom_level
           FROM client_qb_questions
          WHERE org_id=? AND topic_id=? AND is_active=1 AND id NOT IN (${ph})
          ORDER BY (difficulty=?) DESC, usage_count ASC, RAND() LIMIT 1`,
        [orgId, oldQ.topic_id, ...qIds, wsRow.difficulty]);
    }
    if (!candidates.length && oldQ?.chapter_id) {
      [candidates] = await db.pool.execute(
        `SELECT id, question_text, options, correct_answer, solution, difficulty,
                marks_positive AS marks, topic_id, chapter_id, subject_id, source, bloom_level
           FROM client_qb_questions
          WHERE org_id=? AND chapter_id=? AND is_active=1 AND id NOT IN (${ph})
          ORDER BY usage_count ASC, RAND() LIMIT 1`,
        [orgId, oldQ.chapter_id, ...qIds]);
    }
    if (!candidates.length) return res.status(404).json({ success: false, message: 'No alternative question available for this topic yet' });

    const newQ = candidates[0];
    qIds[idx] = newQ.id;
    await db.pool.execute(
      'UPDATE client_recovery_worksheets SET question_ids=? WHERE id=? AND org_id=?',
      [JSON.stringify(qIds), req.params.id, orgId]);
    try { newQ.options = typeof newQ.options === 'string' ? JSON.parse(newQ.options) : newQ.options; } catch {}
    return res.json({ success: true, question: newQ, replaced_id: parseInt(question_id) });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// Assign a reviewed (draft) worksheet to the student — teacher-scoped.
router.post('/worksheets/:id/assign', authenticate, async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ success: false, message: 'student_id required' });
    const role = (req.user.role_slug || '').toLowerCase();
    const elevated = REC_ELEVATED.includes(role);
    if (!elevated && role === 'teacher') {
      if (!(await teacherTeachesStudent(orgId, req.user.user_id, student_id)))
        return res.status(403).json({ success: false, message: 'Forbidden' });
    } else if (!elevated && role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const [rows] = await db.pool.execute(
      'SELECT id FROM client_recovery_worksheets WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Worksheet not found' });
    // Idempotent: don't double-assign.
    const [exist] = await db.pool.execute(
      'SELECT id FROM client_worksheet_assignments WHERE org_id=? AND worksheet_id=? AND student_id=?',
      [orgId, req.params.id, student_id]);
    if (!exist.length) {
      await db.pool.execute(
        'INSERT INTO client_worksheet_assignments (org_id, worksheet_id, student_id) VALUES (?,?,?)',
        [orgId, req.params.id, student_id]);
    }
    return res.json({ success: true, message: 'Worksheet assigned to student' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ═══ STUDENT 360° ANALYTICS (SUG-0052) — the key feature ═══════════════════
// One bundle for the Student Profile dashboard: learning profile, weak areas,
// bloom-level mastery, conceptual-vs-analytical split, exam trend vs class
// average vs class topper, and recovery-worksheet history.
// Access: elevated staff · teacher of the student · the student · linked parent.
router.get('/analytics/student/:id', authenticate, async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const uid = req.user.user_id;
    const studentId = parseInt(req.params.id);
    const role = (req.user.role_slug || '').toLowerCase();

    // ── Access control (fail-closed) ──
    let allowed = REC_ELEVATED.includes(role);
    if (!allowed && role === 'teacher') allowed = await teacherTeachesStudent(orgId, uid, studentId);
    if (!allowed && role === 'student') {
      const [[self]] = await db.pool.execute('SELECT 1 AS ok FROM client_students WHERE id=? AND org_id=? AND user_id=?', [studentId, orgId, uid]);
      allowed = !!self;
    }
    if (!allowed && role === 'parent') {
      const [[link]] = await db.pool.execute(
        `SELECT 1 AS ok FROM client_parents p JOIN client_parent_students ps ON ps.parent_id=p.id
          WHERE p.user_id=? AND p.org_id=? AND ps.student_id=?`, [uid, orgId, studentId]);
      allowed = !!link;
    }
    if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

    // ── Student + section ──
    const [[student]] = await db.pool.execute(
      `SELECT s.id, s.admission_number, u.first_name, u.last_name,
              e.section_id, sec.name AS section_name, c.name AS class_name
         FROM client_students s
         JOIN client_users u ON u.id=s.user_id
         LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
         LEFT JOIN client_sections sec ON sec.id=e.section_id
         LEFT JOIN client_classes c ON c.id=sec.class_id
        WHERE s.id=? AND s.org_id=?`, [studentId, orgId]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const out = { student };

    // ── Learning profile (AI label/summary/recommendations) ──
    try {
      const [[profile]] = await db.pool.execute(
        `SELECT * FROM client_student_learning_profiles WHERE student_id=? ORDER BY id DESC LIMIT 1`, [studentId]);
      out.profile = profile || null;
    } catch { out.profile = null; }

    // ── Weak areas (topic level, named) ──
    try {
      const [weak] = await db.pool.execute(
        `SELECT w.severity, w.accuracy_pct, w.total_attempts, w.correct_attempts,
                w.trend, w.severity_score,
                t.name AS topic_name, c.name AS chapter_name, s.name AS subject_name
           FROM client_student_weak_areas w
           LEFT JOIN client_qb_topics t ON t.id=w.topic_id
           LEFT JOIN client_qb_chapters c ON c.id=w.chapter_id
           LEFT JOIN client_qb_subjects s ON s.id=w.subject_id
          WHERE w.student_id=? AND w.org_id=? AND w.level='topic'
          ORDER BY w.severity_score DESC LIMIT 40`, [studentId, orgId]);
      // Same describe() as the Weak Areas page and the dashboard widget.
      out.weakAreas = weak.map(w => {
        const d = wa.describe({ ...w, name: w.topic_name });
        return { ...w, accuracy_pct: d.accuracy, status: d.status, confidence: d.confidence, status_label: d.label };
      });
    } catch { out.weakAreas = []; }

    // ── Bloom-level mastery (accuracy per bloom level from quiz answers) ──
    try {
      const [bloom] = await db.pool.execute(
        `SELECT qb.bloom_level,
                COUNT(*) AS attempts,
                ROUND(SUM(ans.is_correct=1)/COUNT(*)*100,1) AS accuracy_pct
           FROM client_quiz_attempts att
           JOIN client_quiz_answers ans ON ans.attempt_id=att.id
           JOIN client_quiz_questions qq ON qq.id=ans.question_id
           JOIN client_qb_questions qb ON qb.id=qq.question_bank_id AND qb.org_id=att.org_id
          WHERE att.student_id=? AND att.org_id=? AND att.status IN ('submitted','graded')
            AND ans.is_correct IS NOT NULL AND qb.bloom_level IS NOT NULL
          GROUP BY qb.bloom_level`, [studentId, orgId]);
      out.bloom = bloom;
      // Conceptual (remember/understand) vs Application (apply) vs Analytical (analyze/evaluate/create)
      const grp = { conceptual: { a: 0, c: 0 }, application: { a: 0, c: 0 }, analytical: { a: 0, c: 0 } };
      for (const b of bloom) {
        const k = ['remember','understand'].includes(b.bloom_level) ? 'conceptual'
                : b.bloom_level === 'apply' ? 'application' : 'analytical';
        grp[k].a += Number(b.attempts);
        grp[k].c += Number(b.attempts) * Number(b.accuracy_pct) / 100;
      }
      out.skills = Object.fromEntries(Object.entries(grp).map(([k, v]) =>
        [k, { attempts: v.a, accuracy_pct: v.a ? Math.round(v.c / v.a * 1000) / 10 : null }]));
    } catch { out.bloom = []; out.skills = {}; }

    // ── Exam trend: student % vs class average % vs topper % (same section) ──
    try {
      const [trend] = await db.pool.execute(
        `SELECT e.id AS exam_id, e.name AS exam_name, e.start_date,
                ROUND(SUM(CASE WHEN m.student_id=? THEN (m.marks_obtained/es.max_marks)*100*es.weightage END)
                      /NULLIF(SUM(CASE WHEN m.student_id=? THEN es.weightage END),0),1) AS student_pct,
                ROUND(AVG((m.marks_obtained/es.max_marks)*100),1) AS class_avg_pct
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
           JOIN client_enrollments en ON en.student_id=m.student_id AND en.status='active'
          WHERE m.org_id=? AND m.is_absent=0 AND en.section_id=?
            AND e.status IN ('published','completed','ongoing')
          GROUP BY e.id ORDER BY e.start_date ASC LIMIT 10`,
        [studentId, studentId, orgId, student.section_id || 0]);
      // Topper per exam (max student weighted % within the section)
      const [toppers] = await db.pool.execute(
        `SELECT exam_id, MAX(pct) AS topper_pct FROM (
           SELECT m.exam_id, m.student_id,
                  SUM((m.marks_obtained/es.max_marks)*100*es.weightage)/NULLIF(SUM(es.weightage),0) AS pct
             FROM client_exam_marks m
             JOIN client_exam_subjects es ON es.id=m.exam_subject_id
             JOIN client_enrollments en ON en.student_id=m.student_id AND en.status='active'
            WHERE m.org_id=? AND m.is_absent=0 AND en.section_id=?
            GROUP BY m.exam_id, m.student_id
         ) x GROUP BY exam_id`, [orgId, student.section_id || 0]);
      const topMap = new Map(toppers.map(t => [t.exam_id, Math.round(Number(t.topper_pct) * 10) / 10]));
      out.examTrend = trend.map(t => ({ ...t, topper_pct: topMap.get(t.exam_id) ?? null }));
    } catch { out.examTrend = []; }

    // ── Recovery worksheet history ──
    try {
      const [wsRows] = await db.pool.execute(
        `SELECT w.id, w.difficulty, w.total_questions, w.total_marks, w.attempt_status,
                w.created_at
           FROM client_worksheet_assignments a
           JOIN client_recovery_worksheets w ON w.id=a.worksheet_id
          WHERE a.org_id=? AND a.student_id=?
          ORDER BY w.created_at DESC LIMIT 20`, [orgId, studentId]);
      out.worksheets = wsRows;
    } catch { out.worksheets = []; }

    return res.json({ success: true, data: out });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// === QB-only worksheet generation routes ===
router.get('/qb/topics', authenticate, async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const classId = req.query.class_id || null;
    const [rows] = await db.pool.execute(`
      SELECT DISTINCT
        s.id as subject_id, s.name as subject_name,
        c.id as chapter_id, c.name as chapter_name,
        t.id as topic_id, t.name as topic_name
      FROM client_topics t
      LEFT JOIN client_chapters c ON c.id = t.chapter_id
      LEFT JOIN client_subjects s ON s.id = c.subject_id
      WHERE t.org_id = ? AND t.is_active = 1
      ORDER BY s.name, c.name, t.name
    `, [orgId]);
    res.json({ success: true, data: { topics: rows } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/qb/count', authenticate, async (req, res) => {
  try {
    const db = require('../../config/db');
    const orgId = req.user.org_id;
    const { topic_id, difficulty } = req.query;
    if (!topic_id) return res.status(400).json({ success: false, error: 'topic_id required' });
    let diffFilter = '';
    const params = [orgId, topic_id];
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      diffFilter = 'AND difficulty = ?';
      params.push(difficulty);
    }
    const [rows] = await db.pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM client_qb_questions WHERE org_id = ? AND topic_id = ? AND is_active = 1 ${diffFilter}) as qb_count
    `, params);
    res.json({ success: true, data: { qb_count: rows[0]?.qb_count || 0 } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Worksheet view (full data including questions)
router.get('/worksheets/:id/full', authenticate, assertWorksheetAccess, async (req, res) => {
  try {
    const db = require('../../config/db');
    const id = parseInt(req.params.id);
    const orgId = req.user.org_id;
    const [worksheets] = await db.pool.execute(
      'SELECT * FROM client_recovery_worksheets WHERE id = ? AND org_id = ?',
      [id, orgId]
    );
    if (!worksheets.length) return res.status(404).json({ success: false, error: 'Not found' });
    const worksheet = worksheets[0];

    // Parse question_ids JSON (the field that actually exists)
    let questionIds = [];
    try {
      const parsed = JSON.parse(worksheet.question_ids || '[]');
      questionIds = Array.isArray(parsed) ? parsed.filter(x => x != null) : [];
    } catch (err) { questionIds = []; }

    let questions = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const [rows] = await db.pool.execute(
        'SELECT id, question_text, options, correct_answer, solution, difficulty, marks_positive AS marks, topic_id, chapter_id, subject_id, source FROM client_qb_questions WHERE id IN (' + placeholders + ') AND org_id = ?',
        [...questionIds, orgId]
      );
      // Preserve order from question_ids array
      const byId = new Map(rows.map(r => [r.id, r]));
      questions = questionIds.map(qid => byId.get(qid)).filter(Boolean);
    }

    res.json({ success: true, data: { worksheet, questions } });
  } catch (e) {
    console.error('[recovery.worksheet.full]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});



router.post('/worksheets/:id/submit', authenticate, assertWorksheetAccess, async (req, res) => {
  try {
    const db = require('../../config/db');
    const id = parseInt(req.params.id);
    const orgId = req.user.org_id;
    const { answers, score, time_taken, correct_count, total_count } = req.body;

    await db.pool.execute(`
      UPDATE client_recovery_worksheets
      SET attempt_status = 'submitted',
          score_pct = ?,
          score = ?,
          submitted_at = NOW(),
          completed_at = NOW(),
          attempted_at = NOW()
      WHERE id = ? AND org_id = ?
    `, [score, correct_count, id, orgId]);

    res.json({ success: true, score, correct_count, total_count });
  } catch (e) {
    console.error('[recovery.submit]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
