const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { teacherTeachesSection } = require('../../middleware/teacherScope');
const notifSvc = require('../../services/notificationService');
const logger = require('../../utils/logger');
const { audit } = require('../../utils/audit');
// The report card is the AUTHORITY on a student's result percentage; every
// dashboard/widget now derives the same figure from the same helper.
// See utils/examResult.js for the single rule (weighting + 1-dp rounding).
const { weightedPercent } = require('../../utils/examResult');

/* A raw client_exam_marks row → the {percent, weightage} shape weightedPercent()
 * expects. Absent = 0 and stays in the weighting (school policy: a missed paper
 * scores zero); an unmarked paper is null and is left out of the weighting. */
const toWeighted = (mk) => ({
  percent: mk.is_absent ? 0
    : (mk.marks_obtained === null || mk.marks_obtained === undefined ? null
      : (parseFloat(mk.marks_obtained) / parseFloat(mk.max_marks)) * 100),
  weightage: mk.weightage,
});

router.use(authenticate);

// Report cards are staff-managed; students/parents may only view their OWN.
const requireReportStaff = requireRole('owner', 'admin', 'principal', 'coordinator', 'hod', 'teacher');

// Can this caller view THIS student's report card? Staff yes; a student only
// their own record; a parent only a linked child. Prevents iterating
// student_id to read any classmate's marks/rank/DOB (was an IDOR).
const { teacherTeachesStudent } = require('../../middleware/teacherScope');
const STAFF = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
async function canViewStudentReport(user, studentId, orgId) {
  if (STAFF.includes(user.role_slug)) return true;
  if (user.role_slug === 'teacher') return teacherTeachesStudent(orgId, user.user_id, studentId);
  if (user.role_slug === 'student') {
    const self = await queryOne('SELECT 1 FROM client_students WHERE id=? AND org_id=? AND user_id=?', [studentId, orgId, user.user_id]);
    return !!self;
  }
  if (user.role_slug === 'parent') {
    const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, user.user_id]);
    if (!parent) return false;
    const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
    return !!link;
  }
  return false;
}

// ─── Default grading policy ─────────────────────────────────────────────────
const DEFAULT_POLICY = [
  { min:91, max:100, grade:'A+', remark:'Outstanding Performance' },
  { min:81, max:90,  grade:'A',  remark:'Excellent' },
  { min:71, max:80,  grade:'B+', remark:'Very Good' },
  { min:61, max:70,  grade:'B',  remark:'Good' },
  { min:51, max:60,  grade:'C',  remark:'Satisfactory' },
  { min:41, max:50,  grade:'D',  remark:'Needs Improvement' },
  { min:0,  max:40,  grade:'F',  remark:'Unsatisfactory — Immediate Attention Required' },
];

const applyPolicy = (pct, policy) => {
  if (pct === null || pct === undefined || isNaN(pct)) return { grade:'—', remark:'—' };
  // Resilient: fall back to default bands if policy is missing/invalid
  const bands = (Array.isArray(policy) && policy.length > 0) ? policy : DEFAULT_POLICY;
  // Bands only touch at integer boundaries (max:90 / min:91), so fractional
  // values like 90.99 must not fall through the gap between them — match by
  // descending min instead of an inclusive [min,max] range test.
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  const band = sorted.find(b => pct >= b.min) || sorted[sorted.length - 1];
  return band ? { grade: band.grade, remark: band.remark }
              : { grade: '—', remark: '—' };
};

const getAttendanceStatus = (pct) => {
  if (pct >= 85) return 'Regular';
  if (pct >= 75) return 'Low';
  return 'Critical';
};

const firstName = (full) => (full||'').split(' ')[0];

const genRemark = (name, grade, strongest, weakest, attendancePct, progress) => {
  const fn = firstName(name) || 'Student';
  let base = '';
  if (['A+','A'].includes(grade)) {
    base = `${fn} has shown outstanding performance, especially in ${strongest||'studies'}. Keep challenging yourself to sustain this excellence.`;
  } else if (['B+','B'].includes(grade)) {
    base = `${fn}, your efforts in ${strongest||'studies'} are appreciated. Focus more on ${weakest||'weaker areas'} to move to the top.`;
  } else if (grade === 'C') {
    base = `${fn}, there is scope to improve. Your work in ${strongest||'some subjects'} shows potential — consistent practice in ${weakest||'weaker areas'} will help.`;
  } else if (grade === 'D') {
    base = `${fn}, these results show areas needing attention. Please seek help from teachers and focus on building strong fundamentals.`;
  } else if (grade === 'F') {
    base = `${fn}, these results indicate serious attention is needed. Improvement is possible — please meet your teachers and parents to plan the next steps.`;
  } else {
    base = `${fn}, keep working consistently on your studies.`;
  }
  if (attendancePct < 75) {
    base += ` Regular attendance is important — please aim for at least 85% attendance.`;
  }
  return base;
};

// ─── GET settings ────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const o = req.user.org_id;
    let s = await queryOne('SELECT * FROM client_reportcard_settings WHERE org_id=?', [o]);
    if (!s) {
      await query('INSERT INTO client_reportcard_settings (org_id) VALUES (?)', [o]);
      s = await queryOne('SELECT * FROM client_reportcard_settings WHERE org_id=?', [o]);
    }
    let policy = DEFAULT_POLICY;
    if (s.grading_policy) {
      try { policy = JSON.parse(s.grading_policy); } catch {}
    }
    // The org's own branding — the Designer preview uses these as the fallback when a
    // report-card field is blank, so the preview matches the real card (which falls
    // back to the same org branding in generateCard). "Uncustomised → show the org."
    const org = await queryOne(
      'SELECT display_name, name, logo_url, brand_color, primary_color FROM client_organizations WHERE id=?', [o]
    ).catch(() => null);
    const orgBranding = {
      name: org?.display_name || org?.name || '',
      logo: org?.logo_url || null,
      header_color: org?.brand_color || org?.primary_color || null,
    };
    return success(res, { settings: s, policy, org: orgBranding });
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/settings', requireRole('owner', 'admin', 'principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      school_name, school_address, school_phone, school_email,
      school_logo_url, principal_name, board_name,
      grading_policy, header_color, show_attendance, show_rank, show_remarks, footer_text,
      layout_json
    } = req.body;

    // layout_json is the report-card designer's document (which fields, columns,
    // tiles, signatures). Accept either a raw string or an object; store canonical
    // JSON. A malformed value is rejected rather than silently dropped so the school
    // never thinks it saved a layout it did not.
    let layoutStr = null;
    if (layout_json != null && layout_json !== '') {
      try {
        layoutStr = typeof layout_json === 'string'
          ? JSON.stringify(JSON.parse(layout_json))
          : JSON.stringify(layout_json);
      } catch { return error(res, 'Invalid layout configuration', 400); }
    }

    await query(
      `INSERT INTO client_reportcard_settings
       (org_id, school_name, school_address, school_phone, school_email, school_logo_url,
        principal_name, board_name, grading_policy, header_color,
        show_attendance, show_rank, show_remarks, footer_text, layout_json)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        school_name=VALUES(school_name), school_address=VALUES(school_address),
        school_phone=VALUES(school_phone), school_email=VALUES(school_email),
        school_logo_url=VALUES(school_logo_url),
        principal_name=VALUES(principal_name), board_name=VALUES(board_name),
        grading_policy=VALUES(grading_policy), header_color=VALUES(header_color),
        show_attendance=VALUES(show_attendance), show_rank=VALUES(show_rank),
        show_remarks=VALUES(show_remarks), footer_text=VALUES(footer_text),
        layout_json=VALUES(layout_json)`,
      [o, school_name||null, school_address||null, school_phone||null, school_email||null,
       school_logo_url||null, principal_name||null, board_name||'CBSE',
       grading_policy ? JSON.stringify(grading_policy) : null,
       header_color||'#1e40af',
       show_attendance??1, show_rank??1, show_remarks??1, footer_text||null, layoutStr]
    );
    return success(res, {}, 'Settings saved');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── GENERATE report card for one student ────────────────────────────────────
const generateCard = async (orgId, examId, studentId) => {
  // Fetch settings & policy
  const settings = await queryOne('SELECT * FROM client_reportcard_settings WHERE org_id=?', [orgId]);
  // KI-69: report-card letterhead is a separate configurable field, but a school
  // that never set it must NOT fall through to a "School Name" placeholder — fall
  // back to the org's own name so the card always shows a real, consistent name.
  const org = await queryOne('SELECT display_name, name, logo_url, brand_color, primary_color FROM client_organizations WHERE id=?', [orgId]).catch(() => null);
  let policy = DEFAULT_POLICY;
  if (settings?.grading_policy) {
    try { policy = JSON.parse(settings.grading_policy); } catch {}
  }

  // Report-card layout (the designer's document). A school that never opened the
  // designer has NULL layout_json → build a layout from the legacy tile toggles so
  // an old card renders exactly as it did before 021 (the shared renderer merges the
  // rest of the defaults). Once saved, layout_json wins.
  const { DEFAULT_LAYOUT } = require('../../../../../packages/reportcard/render');
  let layout;
  if (settings?.layout_json) {
    try { layout = JSON.parse(settings.layout_json); } catch { layout = null; }
  }
  if (!layout) {
    layout = {
      ...DEFAULT_LAYOUT,
      tiles: {
        rank: !!(settings?.show_rank ?? 1),
        attendance: !!(settings?.show_attendance ?? 1),
        progress: true,
        remark: !!(settings?.show_remarks ?? 1),
      },
    };
  }

  // Exam details
  const exam = await queryOne('SELECT * FROM client_exams WHERE id=? AND org_id=?', [examId, orgId]);
  if (!exam) throw new Error('Exam not found');

  // Student + enrollment
  const student = await queryOne(
    `SELECT s.id, s.admission_number, s.date_of_birth,
      u.first_name, u.last_name, u.email, u.phone,
      sec.id AS section_id, sec.name AS section_name,
      c.id AS class_id, c.name AS class_name, c.standard,
      ROUND(SUM(ar.status='present')/NULLIF(COUNT(ar.id),0)*100,1) AS attendance_pct
     FROM client_students s
     JOIN client_users u ON u.id=s.user_id
     LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
     LEFT JOIN client_sections sec ON sec.id=e.section_id
     LEFT JOIN client_classes c ON c.id=sec.class_id
     LEFT JOIN client_attendance_records ar ON ar.student_id=s.id
     WHERE s.id=? AND s.org_id=?
     GROUP BY s.id`,
    [studentId, orgId]
  );
  if (!student) throw new Error('Student not found');

  // Exam subjects + student marks
  const marks = await query(
    `SELECT es.*, s.name AS subject_name, s.color AS subject_color,
      m.marks_obtained, m.is_absent
     FROM client_exam_subjects es
     JOIN client_subjects s ON s.id=es.subject_id
     LEFT JOIN client_exam_marks m ON m.exam_subject_id=es.id AND m.student_id=?
     WHERE es.exam_id=? AND es.org_id=?
     ORDER BY s.name`,
    [studentId, examId, orgId]
  );

  // Build subject array
  const subjects = marks.map(m => {
    if (m.is_absent) {
      return {
        name: m.subject_name, color: m.subject_color,
        max_marks: parseFloat(m.max_marks),
        passing_marks: parseFloat(m.passing_marks),
        marks_obtained: 'AB', percent: 0, weightage: parseFloat(m.weightage),
        ...applyPolicy(0, policy),
      };
    }
    if (m.marks_obtained === null || m.marks_obtained === undefined) {
      return {
        name: m.subject_name, color: m.subject_color,
        max_marks: parseFloat(m.max_marks),
        passing_marks: parseFloat(m.passing_marks),
        marks_obtained: null, percent: null, weightage: parseFloat(m.weightage),
        grade: '—', remark: 'Not graded',
      };
    }
    const pct = (parseFloat(m.marks_obtained) / parseFloat(m.max_marks)) * 100;
    return {
      name: m.subject_name, color: m.subject_color,
      max_marks: parseFloat(m.max_marks),
      passing_marks: parseFloat(m.passing_marks),
      marks_obtained: parseFloat(m.marks_obtained),
      percent: Math.round(pct * 100)/100,
      weightage: parseFloat(m.weightage),
      ...applyPolicy(Math.round(pct * 100)/100, policy),
    };
  });

  // Weighted overall — normalize by total weightage so the result stays a
  // true 0–100 percent even when weightages don't sum to exactly 1.
  // Computed by the ONE shared helper (utils/examResult.js) so the number on
  // this report card is byte-identical to the one on every dashboard.
  const weighted_percent = weightedPercent(subjects) ?? 0;
  const overallGrade = applyPolicy(weighted_percent, policy);

  // Rank among section
  const sectionStudents = await query(
    `SELECT e.student_id FROM client_enrollments e
     WHERE e.section_id=? AND e.status='active' AND e.org_id=?`,
    [student.section_id, orgId]
  );

  const classResults = [];
  for (const cs of sectionStudents) {
    const csMarks = await query(
      `SELECT m.marks_obtained, m.is_absent, es.max_marks, es.weightage
       FROM client_exam_marks m
       JOIN client_exam_subjects es ON es.id=m.exam_subject_id
       WHERE m.exam_id=? AND m.student_id=? AND m.org_id=?`,
      [examId, cs.student_id, orgId]
    );
    // Rank on the SAME weighted percent every other surface shows — this used
    // to sum weighted marks without normalizing by the total weightage, so a
    // classmate who missed a paper could out-rank on an incomparable figure.
    classResults.push({ student_id: cs.student_id, total_percent: weightedPercent(csMarks.map(toWeighted)) ?? 0 });
  }
  classResults.sort((a,b) => b.total_percent - a.total_percent);
  const rank = classResults.findIndex(r => r.student_id === parseInt(studentId)) + 1;

  // Attendance status
  const attendancePct = student.attendance_pct || 0;
  const attendanceStatus = getAttendanceStatus(attendancePct);

  // Progress flag: compare to previous exam in same academic year
  const prevExam = await queryOne(
    `SELECT e.id FROM client_exams e
     WHERE e.org_id=? AND e.academic_year=? AND e.start_date < ? AND e.id!=?
     ORDER BY e.start_date DESC LIMIT 1`,
    [orgId, exam.academic_year, exam.start_date, examId]
  );

  let progress_flag = 'first_exam';
  let previous_percent = null;
  if (prevExam) {
    const prevMarks = await query(
      `SELECT m.marks_obtained, m.is_absent, es.max_marks, es.weightage
       FROM client_exam_marks m
       JOIN client_exam_subjects es ON es.id=m.exam_subject_id
       WHERE m.exam_id=? AND m.student_id=? AND m.org_id=?`,
      [prevExam.id, studentId, orgId]
    );
    if (prevMarks.length > 0) {
      previous_percent = weightedPercent(prevMarks.map(toWeighted)) ?? 0;
      const diff = weighted_percent - previous_percent;
      if (diff > 2) progress_flag = 'improved';
      else if (diff < -2) progress_flag = 'declined';
      else progress_flag = 'stable';
    }
  }

  // Strongest / weakest
  const valid = subjects.filter(s => s.percent !== null && s.marks_obtained !== 'AB');
  const strongest = valid.length ? valid.reduce((a,b)=>a.percent>b.percent?a:b).name : null;
  const weakest   = valid.length ? valid.reduce((a,b)=>a.percent<b.percent?a:b).name : null;

  // Auto remark
  const overall_remark = genRemark(
    student.first_name, overallGrade.grade, strongest, weakest, attendancePct, progress_flag
  );

  return {
    tenant_id:   `org-${orgId}`,
    student_id:  student.id,
    exam_name:   exam.name,
    exam_type:   exam.exam_type,
    exam_date:   exam.start_date,
    academic_year: exam.academic_year,
    generated_at: new Date().toISOString(),
    school: {
      // Uncustomised report-card fields fall back to the org's own branding, so a
      // school that never opened the Designer still gets its real name/logo/colour
      // (and the Designer preview matches, using the same org fallback).
      name:    settings?.school_name || org?.display_name || org?.name,
      address: settings?.school_address,
      phone:   settings?.school_phone,
      email:   settings?.school_email,
      logo:    settings?.school_logo_url || org?.logo_url || null,
      board:   settings?.board_name,
      principal: settings?.principal_name,
      header_color: settings?.header_color || org?.brand_color || org?.primary_color || '#1e40af',
      footer_text: settings?.footer_text,
    },
    display: {
      show_attendance: !!(settings?.show_attendance ?? 1),
      show_rank:       !!(settings?.show_rank ?? 1),
      show_remarks:    !!(settings?.show_remarks ?? 1),
    },
    // The full layout document — the on-screen card, the designer preview, and the
    // server PDF all render from this one object via packages/reportcard/render.js.
    layout,
    student: {
      id: student.id,
      name: `${student.first_name} ${student.last_name||''}`.trim(),
      admission_number: student.admission_number,
      class_name: student.class_name,
      section_name: student.section_name,
      dob: student.date_of_birth,
    },
    subjects,
    overall: {
      weighted_percent,   // already rounded by the shared rule (utils/examResult.js)
      grade: overallGrade.grade,
      remark: overallGrade.remark,
      rank,
      total_students: classResults.length,
      attendance_percent: attendancePct,
      attendance_status: attendanceStatus,
      progress_flag,
      previous_percent,
      strongest_subject: strongest,
      weakest_subject: weakest,
      overall_remark,
    },
    errors: [],
  };
};

router.get('/generate', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { exam_id, student_id } = req.query;
    if (!exam_id || !student_id) return error(res, 'exam_id and student_id required', 400);
    if (!(await canViewStudentReport(req.user, parseInt(student_id), o))) return error(res, 'Forbidden', 403);

    const card = await generateCard(o, parseInt(exam_id), parseInt(student_id));
    return success(res, card);
  } catch(e) { logger.error('Generate:', e); return error(res, e.message, 500); }
});

router.get('/bulk/:examId/section/:sectionId', requireReportStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { examId, sectionId } = req.params;

    // requireReportStaff includes teacher; a teacher may bulk-generate report cards
    // only for a section they actually teach (the single-student route is already
    // scoped via canViewStudentReport — the bulk route was not).
    if ((req.user.role_slug || '').toLowerCase() === 'teacher'
        && !(await teacherTeachesSection(o, req.user.user_id, sectionId))) {
      return error(res, 'You do not teach this section', 403);
    }

    const students = await query(
      `SELECT s.id FROM client_enrollments e
       JOIN client_students s ON s.id=e.student_id
       WHERE e.section_id=? AND e.status='active' AND e.org_id=?`,
      [sectionId, o]
    );

    // Generate cards in PARALLEL, capped at 5 at a time — a 40-student section was
    // hundreds of serial queries (could hit the axios timeout → "Failed to load").
    // The cap keeps the DB pool from being swamped.
    const cards = [];
    const CONCURRENCY = 5;
    for (let i = 0; i < students.length; i += CONCURRENCY) {
      const batch = await Promise.all(students.slice(i, i + CONCURRENCY).map(async (st) => {
        try { return await generateCard(o, parseInt(examId), st.id); }
        catch (err) { return { student_id: st.id, error: err.message }; }
      }));
      cards.push(...batch);
    }

    return success(res, { cards, count: cards.length });
  } catch(e) { logger.error('Bulk cards:', e); return error(res, 'Could not generate report cards', 500); }
});

// Publish status
router.post('/publish', requireRole('owner', 'admin', 'principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { exam_id, section_id, published = true } = req.body;
    await query(
      `INSERT INTO client_reportcard_publishes
       (org_id, exam_id, section_id, published, published_at, published_by)
       VALUES (?,?,?,?,NOW(),?)
       ON DUPLICATE KEY UPDATE
         published=VALUES(published), published_at=NOW(), published_by=VALUES(published_by)`,
      [o, exam_id, section_id, published?1:0, req.user.user_id]
    );

    if (published) {
      await audit(req, 'REPORTCARD_PUBLISH', 'reportcard', exam_id, { new_data: { exam_id, section_id, published } });
    }

    // Auto-notify parents and students when results are published
    if (published) {
      try {
        const exam = await queryOne('SELECT name FROM client_exams WHERE id=? AND org_id=?', [exam_id, o]);
        if (exam && section_id) {
          await notifSvc.sendToParentsOfSection(o, section_id, {
            type: 'exam_result',
            title: `Report card published: ${exam.name}`,
            body: "Your child's report card is now available. Tap to view.",
            action_url: '/parent/report-card',
            icon: 'Award',
            priority: 'high',
            sender_id: req.user.user_id,
            sender_role: 'admin',
            meta: {
              exam_name: exam.name,
              percentage: 'Available in portal',
              school_name: (await queryOne('SELECT name FROM client_organizations WHERE id=?',[req.user.org_id]).catch(()=>null))?.name || 'your school',
            },
          });
          await notifSvc.sendToSection(o, section_id, {
            type: 'exam_result',
            title: `${exam.name} result published`,
            body: 'Tap to view your report card.',
            action_url: '/student/report-card',
            icon: 'FileText',
            priority: 'high',
            sender_id: req.user.user_id,
            sender_role: 'admin',
            meta: {
              exam_name: exam.name,
              percentage: 'Available in portal',
              school_name: (await queryOne('SELECT name FROM client_organizations WHERE id=?',[req.user.org_id]).catch(()=>null))?.name || 'your school',
            },
          });
        }
      } catch(notifErr) { console.error('Report notif failed:', notifErr); }
    }

    return success(res, {}, `Report cards ${published?'published':'unpublished'}`);
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/publishes', async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query(
      `SELECT p.*, e.name AS exam_name, sec.name AS section_name, c.name AS class_name
       FROM client_reportcard_publishes p
       JOIN client_exams e ON e.id=p.exam_id
       JOIN client_sections sec ON sec.id=p.section_id
       JOIN client_classes c ON c.id=sec.class_id
       WHERE p.org_id=? ORDER BY p.published_at DESC`,
      [o]
    );
    return success(res, { publishes: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// Student portal — own report cards
router.get('/my', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const student = await queryOne(
      'SELECT id FROM client_students WHERE user_id=? AND org_id=?', [uid, o]
    );
    if (!student) return error(res, 'Student not found', 404);

    // Find all published exams for this student
    const exams = await query(
      `SELECT DISTINCT e.id, e.name, e.exam_type, e.start_date, e.academic_year
       FROM client_exams e
       JOIN client_exam_subjects es ON es.exam_id=e.id
       JOIN client_exam_marks m ON m.exam_subject_id=es.id AND m.student_id=?
       JOIN client_reportcard_publishes p ON p.exam_id=e.id AND p.published=1
       WHERE e.org_id=?
       ORDER BY e.start_date DESC`,
      [student.id, o]
    );

    return success(res, { exams, student_id: student.id });
  } catch(e) { return error(res, e.message, 500); }
});

// Parent portal — children's report cards
router.get('/parent/my-children', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    const parent = await queryOne(
      'SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, o]
    );
    if (!parent) return error(res, 'Parent not found', 404);

    const children = await query(
      `SELECT cs.id AS student_id, u.first_name, u.last_name, u.email,
        cl.name AS class_name, sec.name AS section_name
       FROM client_parent_students ps
       JOIN client_students cs ON cs.id=ps.student_id
       JOIN client_users u ON u.id=cs.user_id
       LEFT JOIN client_enrollments e ON e.student_id=cs.id AND e.status='active'
       LEFT JOIN client_sections sec ON sec.id=e.section_id
       LEFT JOIN client_classes cl ON cl.id=sec.class_id
       WHERE ps.parent_id=? AND ps.org_id=?`,
      [parent.id, o]
    );

    for (const child of children) {
      const exams = await query(
        `SELECT DISTINCT e.id, e.name, e.exam_type, e.start_date, e.academic_year
         FROM client_exams e
         JOIN client_exam_subjects es ON es.exam_id=e.id
         JOIN client_exam_marks m ON m.exam_subject_id=es.id AND m.student_id=?
         JOIN client_reportcard_publishes p ON p.exam_id=e.id AND p.published=1
         WHERE e.org_id=?
         ORDER BY e.start_date DESC`,
        [child.student_id, o]
      );
      child.exams = exams;
    }

    return success(res, { children });
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;

// ─── PDF Download ─────────────────────────────────────────────────────────────
router.get('/pdf/:examId/:studentId', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { examId, studentId } = req.params;
    if (!(await canViewStudentReport(req.user, parseInt(studentId), o))) return error(res, 'Forbidden', 403);
    const card = await generateCard(o, parseInt(examId), parseInt(studentId));
    if (card.errors && card.errors.length && !card.student) {
      return error(res, 'Could not generate card', 400);
    }

    const s = card.student;
    // ONE renderer for screen and PDF — the on-screen card, the designer preview and
    // this PDF all come from packages/reportcard/render.js, so they can never drift
    // (they used to be two hand-written layouts that already disagreed). Escaping and
    // header-colour validation live inside the renderer.
    const { renderReportCardDocument } = require('../../../../../packages/reportcard/render');
    const html = renderReportCardDocument(card, card.layout);

    // RC-6/D2: this endpoint is named /pdf — emit a REAL application/pdf via
    // the shared htmlToPdf service (system Chrome, same pipeline as worksheet
    // PDFs). ?format=html keeps the old inline-HTML behaviour; if Chrome is
    // unavailable (e.g. local dev without CHROME_PATH) we fall back to HTML
    // and say so honestly in the filename — never a mislabelled payload.
    const safeName = (s.name || 'student').replace(/\s+/g, '_');
    if (req.query.format !== 'html') {
      try {
        const { htmlToPdfBuffer } = require('../../services/pdf/htmlToPdf');
        const pdf = await htmlToPdfBuffer(html);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="reportcard_${safeName}.pdf"`);
        return res.send(pdf);
      } catch (pdfErr) {
        logger.error('PDF render failed, serving HTML fallback:', pdfErr.message);
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="reportcard_${safeName}.html"`);
    return res.send(html);
  } catch(e) { logger.error('PDF:', e); return error(res, e.message, 500); }
});
