const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error }  = require('../../utils/response');
const { activeEnrolment } = require('../../utils/headcount');
const { authenticate }    = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');
const { getActiveSchool } = require('../../utils/activeSchool');
const { teacherTeachesSection, teacherAssignments } = require('../../middleware/teacherScope');
const logger = require('../../utils/logger');
const { visibleDays } = require('../../utils/timetableDays');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('timetable'));
const ELEVATED = ['owner','admin','principal','vice_principal','coordinator','academic_coordinator','hod','super_admin','system_admin'];

// Can this caller see this section's full timetable (incl. assigned teachers)?
// Elevated staff: any section. Teacher: only sections they teach. Student:
// only their own section. Parent: only a linked child's section.
async function canViewSectionTimetable(user, orgId, sectionId) {
  const role = (user.role_slug || '').toLowerCase();
  if (ELEVATED.includes(role)) return true;
  if (role === 'teacher' || role === 'class_teacher') {
    return teacherTeachesSection(orgId, user.user_id, sectionId);
  }
  if (role === 'student') {
    const row = await queryOne(
      `SELECT 1 FROM client_enrollments e JOIN client_students s ON s.id=e.student_id
        WHERE e.section_id=? AND e.org_id=? AND s.user_id=? AND e.status='active' LIMIT 1`,
      [sectionId, orgId, user.user_id]);
    return !!row;
  }
  if (role === 'parent') {
    const row = await queryOne(
      `SELECT 1 FROM client_enrollments e
         JOIN client_parent_students ps ON ps.student_id=e.student_id AND COALESCE(ps.status,'active')='active'
         JOIN client_parents p ON p.id=ps.parent_id
        WHERE e.section_id=? AND e.org_id=? AND p.user_id=? AND e.status='active' LIMIT 1`,
      [sectionId, orgId, user.user_id]);
    return !!row;
  }
  return false;
}

// ── helper: compute period times ─────────────────────────────────────────────
const getPeriodTimes = (config, periodNum) => {
  const [h, m] = (config.start_time || '08:00:00').split(':').map(Number);
  let mins = h * 60 + m;
  const dur = config.period_duration_mins || 45;
  const breakAfter = config.break_after_period || 4;
  const breakDur   = config.break_duration_mins || 15;

  for (let i = 1; i < periodNum; i++) {
    mins += dur;
    if (i === breakAfter) mins += breakDur;
  }
  const startH = Math.floor(mins / 60);
  const startM = mins % 60;
  const endMins = mins + dur;
  const endH = Math.floor(endMins / 60);
  const endM = endMins % 60;

  const pad = n => String(n).padStart(2,'0');
  return {
    start: `${pad(startH)}:${pad(startM)}`,
    end:   `${pad(endH)}:${pad(endM)}`
  };
};

// ── GET config ───────────────────────────────────────────────────────────────
router.get('/config', async (req, res) => {
  try {
    const o = req.user.org_id;
    let cfg = await queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]);
    if (!cfg) {
      await query(
        `INSERT INTO client_timetable_config (org_id) VALUES (?)`, [o]
      );
      cfg = await queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]);
    }
    const days = (cfg.working_days || 'Mon,Tue,Wed,Thu,Fri,Sat').split(',');
    const periods = [];
    for (let i = 1; i <= cfg.periods_per_day; i++) {
      periods.push({ period: i, ...getPeriodTimes(cfg, i) });
    }
    return success(res, { config: cfg, days, periods });
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/config', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { periods_per_day, working_days, period_duration_mins,
            start_time, break_after_period, break_duration_mins } = req.body;
    await query(
      `INSERT INTO client_timetable_config
       (org_id,periods_per_day,working_days,period_duration_mins,start_time,break_after_period,break_duration_mins)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
       periods_per_day=VALUES(periods_per_day),
       working_days=VALUES(working_days),
       period_duration_mins=VALUES(period_duration_mins),
       start_time=VALUES(start_time),
       break_after_period=VALUES(break_after_period),
       break_duration_mins=VALUES(break_duration_mins)`,
      [o, periods_per_day||8, working_days||'Mon,Tue,Wed,Thu,Fri,Sat',
       period_duration_mins||45, start_time||'08:00:00',
       break_after_period||4, break_duration_mins||15]
    );
    return success(res, {}, 'Config updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ── GET timetable for a section ───────────────────────────────────────────────
router.get('/section/:sectionId', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { sectionId } = req.params;
    if (!(await canViewSectionTimetable(req.user, o, sectionId))) return error(res, 'Forbidden', 403);

    const slots = await query(
      `SELECT ts.*,
        sub.name AS subject_name, sub.color AS subject_color,
        CONCAT(u.first_name,' ',u.last_name) AS teacher_name,
        u.avatar AS teacher_avatar
       FROM client_timetable_slots ts
       LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
       LEFT JOIN client_users u ON u.id=ts.teacher_id
       WHERE ts.section_id=? AND ts.org_id=?
       ORDER BY FIELD(ts.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), ts.period_number`,
      [sectionId, o]
    );

    const cfg = await queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]);
    const days = visibleDays(cfg, slots);

    // Build grid: day → period → slot
    const grid = {};
    days.forEach(d => { grid[d] = {}; });
    slots.forEach(s => {
      if (!grid[s.day_of_week]) grid[s.day_of_week] = {};
      grid[s.day_of_week][s.period_number] = s;
    });

    return success(res, { slots, grid, days, config: cfg });
  } catch(e) { return error(res, e.message, 500); }
});

// ── GET teacher timetable ────────────────────────────────────────────────────
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const o = req.user.org_id;
    const role = (req.user.role_slug || '').toLowerCase();
    const isSelf = String(req.params.teacherId) === String(req.user.user_id);
    if (!ELEVATED.includes(role) && !isSelf) return error(res, 'Forbidden', 403);
    const slots = await query(
      `SELECT ts.*,
        sub.name AS subject_name, sub.color AS subject_color,
        sec.name AS section_name,
        c.name AS class_name, c.standard,
        (SELECT COUNT(*) FROM client_enrollments en
          WHERE en.section_id=ts.section_id AND ${activeEnrolment('en')}) AS section_strength
       FROM client_timetable_slots ts
       LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
       LEFT JOIN client_sections sec ON sec.id=ts.section_id
       LEFT JOIN client_classes c ON c.id=ts.class_id
       WHERE ts.teacher_id=? AND ts.org_id=? AND ts.slot_type='class'
       ORDER BY FIELD(ts.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), ts.period_number`,
      [req.params.teacherId, o]
    );

    const cfg = await queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]);
    const days = visibleDays(cfg, slots);
    const periodsPerDay = cfg?.periods_per_day || 8;
    // Count only slots the grid actually renders (working days, period range)
    // — legacy slots outside the config made the stat disagree with the grid.
    const visibleSlots = slots.filter(s =>
      days.includes(s.day_of_week) && s.period_number >= 1 && s.period_number <= periodsPerDay
    );
    const grid = {};
    days.forEach(d => { grid[d] = {}; });
    visibleSlots.forEach(s => {
      grid[s.day_of_week][s.period_number] = s;
    });

    // weekly load stats
    // What this teacher is responsible for, regardless of whether a timetable
    // has been drawn yet. The grid above is periods; THIS is the roster, and it
    // also counts subject assignments and class-teacher duty. Without it, a
    // school that has assigned its teachers but not yet built the timetable
    // shows every teacher an empty "My Classes" — which is exactly what JDPS
    // saw. — JDPS P-0, 2026-07-29
    const assignments = await teacherAssignments(o, req.params.teacherId);

    const stats = {
      total_periods: visibleSlots.length,
      unique_classes: [...new Set(assignments.map(a=>a.class_id).filter(Boolean))].length,
      unique_subjects: [...new Set(assignments.map(a=>a.subject_id).filter(Boolean))].length,
    };

    return success(res, { slots: visibleSlots, grid, days, config: cfg, stats, assignments });
  } catch(e) { return error(res, e.message, 500); }
});

// ── GET all sections list (for admin picker) ─────────────────────────────────
router.get('/sections', async (req, res) => {
  try {
    const o = req.user.org_id;
    const activeSchool = await getActiveSchool(req);
    const sections = await query(
      `SELECT sec.id, sec.name AS section_name, c.id AS class_id,
        c.name AS class_name, c.standard,
        (SELECT COUNT(*) FROM client_timetable_slots ts
         WHERE ts.section_id=sec.id AND ts.org_id=? AND ts.slot_type='class') AS slots_filled
       FROM client_sections sec
       JOIN client_classes c ON c.id=sec.class_id
       WHERE sec.org_id=?${activeSchool ? ' AND sec.school_id=?' : ''}
       ORDER BY COALESCE(c.display_order, c.standard*10), c.standard, sec.name`,
      activeSchool ? [o, o, activeSchool] : [o, o]
    );
    return success(res, { sections });
  } catch(e) { return error(res, e.message, 500); }
});

// ── GET subjects + teachers for slot editor ───────────────────────────────────
router.get('/resources', async (req, res) => {
  try {
    const o = req.user.org_id;
    // multi-branch: only offer this branch's teachers in the slot editor (null → all)
    const activeSchool = await getActiveSchool(req);
    const teacherParams = [o];
    let teacherBranch = '';
    if (activeSchool) { teacherBranch = ' AND u.id IN (SELECT user_id FROM client_user_schools WHERE org_id=? AND school_id=?)'; teacherParams.push(o, activeSchool); }
    const [subjects, teachers] = await Promise.all([
      query(
        'SELECT id, name, color FROM client_subjects WHERE org_id=? ORDER BY COALESCE(display_order, 900), name',
        [o]
      ),
      query(
        `SELECT u.id, u.first_name, u.last_name, u.avatar,
          d.name AS department_name
         FROM client_users u
         LEFT JOIN client_departments d ON d.id=u.department_id
         WHERE u.org_id=?
           AND EXISTS (
             SELECT 1 FROM client_user_roles ur
             JOIN client_roles r ON r.id=ur.role_id
             WHERE ur.user_id=u.id AND r.base_role='teacher'
           )${teacherBranch}
         ORDER BY u.first_name`,
        teacherParams
      )
    ]);
    return success(res, { subjects, teachers });
  } catch(e) { return error(res, e.message, 500); }
});

// ── CLASH CHECK ──────────────────────────────────────────────────────────────
router.post('/clash-check', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { teacher_id, section_id, day_of_week, period_number, exclude_slot_id } = req.body;
    const clashes = [];

    if (teacher_id) {
      // teacher already assigned elsewhere at this time?
      let q = `SELECT ts.*, sec.name AS section_name, c.name AS class_name
               FROM client_timetable_slots ts
               JOIN client_sections sec ON sec.id=ts.section_id
               JOIN client_classes c ON c.id=ts.class_id
               WHERE ts.teacher_id=? AND ts.day_of_week=?
                 AND ts.period_number=? AND ts.org_id=?
                 AND ts.slot_type='class'`;
      const params = [teacher_id, day_of_week, period_number, o];
      if (exclude_slot_id) { q += ' AND ts.id!=?'; params.push(exclude_slot_id); }
      const teacherClash = await query(q, params);
      if (teacherClash.length > 0) {
        clashes.push({
          type: 'teacher',
          message: `Teacher already assigned to ${teacherClash[0].class_name} ${teacherClash[0].section_name} on ${day_of_week} period ${period_number}`
        });
      }
    }

    return success(res, { clashes, has_clash: clashes.length > 0 });
  } catch(e) { return error(res, e.message, 500); }
});

// ── UPSERT slot ───────────────────────────────────────────────────────────────
router.put('/slot', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      class_id, section_id, day_of_week, period_number,
      subject_id, teacher_id, room, slot_type, academic_year
    } = req.body;

    if (!class_id||!section_id||!day_of_week||!period_number)
      return error(res, 'class_id, section_id, day_of_week, period_number required', 400);

    // clash check for teacher
    if (teacher_id && slot_type === 'class') {
      const clash = await query(
        `SELECT id FROM client_timetable_slots
         WHERE teacher_id=? AND day_of_week=? AND period_number=?
           AND org_id=? AND section_id!=? AND slot_type='class'`,
        [teacher_id, day_of_week, period_number, o, section_id]
      );
      if (clash.length > 0) {
        return error(res, 'CLASH: Teacher already assigned to another class at this time', 409);
      }
    }

    // clash check for room
    if (room && slot_type === 'class') {
      const roomClash = await query(
        `SELECT id FROM client_timetable_slots
         WHERE room=? AND day_of_week=? AND period_number=?
           AND org_id=? AND section_id!=? AND slot_type='class'`,
        [room, day_of_week, period_number, o, section_id]
      );
      if (roomClash.length > 0) {
        return error(res, 'CLASH: That room is already booked at this time', 409);
      }
    }

    await query(
      `INSERT INTO client_timetable_slots
       (org_id,class_id,section_id,subject_id,teacher_id,day_of_week,period_number,room,slot_type,academic_year)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         subject_id=VALUES(subject_id),
         teacher_id=VALUES(teacher_id),
         room=VALUES(room),
         slot_type=VALUES(slot_type),
         academic_year=VALUES(academic_year)`,
      [o, class_id, section_id, subject_id||null, teacher_id||null,
       day_of_week, period_number, room||null,
       slot_type||'class', academic_year||'2025-26']
    );

    return success(res, {}, 'Slot saved');
  } catch(e) { logger.error('Slot upsert:',e); return error(res, e.message, 500); }
});

// ── DELETE slot (clear it) ────────────────────────────────────────────────────
router.delete('/slot', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { section_id, day_of_week, period_number } = req.body;
    await query(
      `DELETE FROM client_timetable_slots
       WHERE section_id=? AND day_of_week=? AND period_number=? AND org_id=?`,
      [section_id, day_of_week, period_number, o]
    );
    return success(res, {}, 'Slot cleared');
  } catch(e) { return error(res, e.message, 500); }
});

// ── COPY timetable from one section to another ────────────────────────────────
router.post('/copy', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { from_section_id, to_section_id, to_class_id } = req.body;
    if (!from_section_id||!to_section_id) return error(res,'from_section_id and to_section_id required',400);

    const sourceSlots = await query(
      'SELECT * FROM client_timetable_slots WHERE section_id=? AND org_id=?',
      [from_section_id, o]
    );

    // delete existing target
    await query('DELETE FROM client_timetable_slots WHERE section_id=? AND org_id=?',[to_section_id,o]);

    for (const s of sourceSlots) {
      await query(
        `INSERT INTO client_timetable_slots
         (org_id,class_id,section_id,subject_id,teacher_id,day_of_week,period_number,room,slot_type,academic_year)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [o, to_class_id||s.class_id, to_section_id, s.subject_id, null,
         s.day_of_week, s.period_number, s.room, s.slot_type, s.academic_year]
      ).catch(()=>{});
    }

    return success(res, { copied: sourceSlots.length }, `Copied ${sourceSlots.length} slots`);
  } catch(e) { return error(res, e.message, 500); }
});

// ── CLEAR entire section timetable ───────────────────────────────────────────
router.delete('/section/:sectionId', requirePermission('timetable.manage'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { rows } = await query(
      'DELETE FROM client_timetable_slots WHERE section_id=? AND org_id=?',
      [req.params.sectionId, o]
    );
    return success(res, {}, 'Timetable cleared');
  } catch(e) { return error(res, e.message, 500); }
});

// ── STUDENT portal: get own timetable ────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const o  = req.user.org_id;
    const uid = req.user.user_id;

    // get student's section
    const enrollment = await queryOne(
      `SELECT e.section_id, e.student_id,
        sec.name AS section_name, c.name AS class_name, c.id AS class_id
       FROM client_students s
       JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
       JOIN client_sections sec ON sec.id=e.section_id
       JOIN client_classes c ON c.id=sec.class_id
       WHERE s.user_id=? AND s.org_id=?
       LIMIT 1`,
      [uid, o]
    );

    if (!enrollment) return error(res, 'Not enrolled in any class', 404);

    const slots = await query(
      `SELECT ts.*,
        sub.name AS subject_name, sub.color AS subject_color,
        CONCAT(u.first_name,' ',u.last_name) AS teacher_name
       FROM client_timetable_slots ts
       LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
       LEFT JOIN client_users u ON u.id=ts.teacher_id
       WHERE ts.section_id=? AND ts.org_id=?
       ORDER BY FIELD(ts.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), ts.period_number`,
      [enrollment.section_id, o]
    );

    const cfg  = await queryOne('SELECT * FROM client_timetable_config WHERE org_id=?', [o]);
    const days = visibleDays(cfg, slots);
    const grid = {};
    days.forEach(d => { grid[d] = {}; });
    slots.forEach(s => {
      if (!grid[s.day_of_week]) grid[s.day_of_week] = {};
      grid[s.day_of_week][s.period_number] = s;
    });

    // today's schedule — IST, not server TZ (UTC servers flip the day at odd hours)
    const dayMap = {0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat'};
    const todayKey = dayMap[new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDay()];
    const todaySlots = slots.filter(s => s.day_of_week === todayKey && s.slot_type === 'class');

    return success(res, { slots, grid, days, config: cfg, enrollment, todaySlots });
  } catch(e) { return error(res, e.message, 500); }
});


// Root: list all timetable slots for org (filterable). No frontend caller
// found for this route — it's an unfiltered org-wide dump, so lock it to
// elevated staff rather than leave it open to any authenticated user.
router.get('/', async (req, res) => {
  try {
    const role = (req.user.role_slug || '').toLowerCase();
    if (!ELEVATED.includes(role)) return error(res, 'Forbidden', 403);
    const o = req.user.org_id;
    const { section_id, day, class_id } = req.query;
    let where = 'ts.org_id=?';
    const params = [o];
    if (section_id) { where += ' AND ts.section_id=?'; params.push(section_id); }
    if (class_id) { where += ' AND sec.class_id=?'; params.push(class_id); }
    if (day) { where += ' AND ts.day_of_week=?'; params.push(day); }
    // multi-branch: scope to the active branch via the slot's section (null → unchanged)
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND sec.school_id=?'; params.push(activeSchool); }

    const sql = `SELECT ts.id, ts.day_of_week, ts.period_number, ts.room, ts.slot_type,
      ts.section_id, ts.subject_id, ts.teacher_id, ts.class_id,
      sec.name as section_name, c.name as class_name,
      sub.name as subject_name,
      CONCAT(u.first_name, ' ', COALESCE(u.last_name,'')) as teacher_name
      FROM client_timetable_slots ts
      LEFT JOIN client_sections sec ON sec.id=ts.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_subjects sub ON sub.id=ts.subject_id
      LEFT JOIN client_users u ON u.id=ts.teacher_id
      WHERE ${where}
      ORDER BY FIELD(ts.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), ts.period_number`;
    
    const slots = await query(sql, params);
    return success(res, { slots: slots || [], count: (slots||[]).length });
  } catch (e) { 
    if (typeof logger !== 'undefined') logger.error('Timetable list:', e); 
    return error(res, e.message, 500); 
  }
});


// /me alias for current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orgId = req.user.org_id;
    const role = (req.user.role_slug || '').toLowerCase();
    const { query: q } = require('../../config/db');
    let rows = [];
    if (role === 'teacher') {
      rows = await q(`SELECT tt.* FROM client_timetable tt LEFT JOIN client_teachers t ON t.id = tt.teacher_id WHERE tt.org_id = ? AND t.user_id = ?`, [orgId, userId]);
    } else if (role === 'student') {
      rows = await q(`SELECT tt.* FROM client_timetable tt LEFT JOIN client_enrollments e ON e.section_id = tt.section_id AND e.status='active' LEFT JOIN client_students s ON s.id = e.student_id WHERE tt.org_id = ? AND s.user_id = ?`, [orgId, userId]);
    } else if (ELEVATED.includes(role)) {
      rows = await q(`SELECT * FROM client_timetable WHERE org_id = ? LIMIT 100`, [orgId]);
    } else {
      // Previously fell through to an unfiltered org-wide dump for any other
      // role (e.g. parent) — no frontend caller uses this legacy route
      // (student/teacher clients use /my and /teacher/:id instead), so reject
      // rather than guess at scoping for a dead code path.
      rows = [];
    }
    return res.json({ status: 'success', data: rows });
  } catch (e) {
    console.error('timetable/me:', e.message);
    return res.json({ status: 'success', data: [] });
  }
});

module.exports = router;
