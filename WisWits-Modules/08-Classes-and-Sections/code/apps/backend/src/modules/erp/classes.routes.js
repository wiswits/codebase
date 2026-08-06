const express = require('express');
const router  = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error }  = require('../../utils/response');
const { activeEnrolment } = require('../../utils/headcount');
const { authenticate }    = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { getActiveSchool, getWriteSchool } = require('../../utils/activeSchool');
const { getSectionProfile, subjectTeachersForSections } = require('../../services/sectionProfile');
const { audit } = require('../../utils/audit');
const { classDeletionBlockers, describeBlockers } = require('../../services/classDeletion');
const { visibleClassIds, classFilter } = require('../../services/classVisibility');

router.use(authenticate);

/**
 * Resolve a class/section teacher id coming from a form.
 *   '' / null / undefined  → null (explicit "no teacher assigned")
 *   a number               → validated to belong to THIS org (never cross-tenant)
 * Throws a plain Error whose message is safe to show the user.
 */
async function resolveTeacherId(raw, orgId) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const id = parseInt(raw, 10);
  const bad = (m) => { const e = new Error(m); e.status = 400; return e; };
  if (isNaN(id)) throw bad('Invalid teacher selected');
  const u = await queryOne('SELECT id FROM client_users WHERE id=? AND org_id=?', [id, orgId]);
  if (!u) throw bad('Selected teacher was not found in this school');
  return id;
}

// ── MUST BE FIRST: static routes before :param routes ──

// Academic Years
router.get('/academic-years', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(
      `SELECT ay.*,
        (SELECT COUNT(*) FROM client_classes WHERE academic_year_id=ay.id AND org_id=?) class_count
       FROM academic_years ay WHERE ay.org_id=? ORDER BY ay.start_date DESC`,
      [orgId, orgId]);
    return success(res, { academic_years: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/academic-years', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, start_date, end_date, is_current=0 } = req.body;
    if (!name || !start_date || !end_date) return error(res, 'name, start_date, end_date required', 400);
    if (is_current) await query('UPDATE academic_years SET is_current=0 WHERE org_id=?', [orgId]);
    const r = await query(
      'INSERT INTO academic_years (org_id,name,start_date,end_date,is_current) VALUES (?,?,?,?,?)',
      [orgId, name, start_date, end_date, is_current ? 1 : 0]);
    const row = await queryOne('SELECT * FROM academic_years WHERE id=?', [r.insertId]);
    return success(res, row, 'Academic year created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/academic-years/:id', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { name, start_date, end_date, is_current, status } = req.body;
    const ay = await queryOne('SELECT * FROM academic_years WHERE id=? AND org_id=?', [id, orgId]);
    if (!ay) return error(res, 'Not found', 404);
    if (is_current) await query('UPDATE academic_years SET is_current=0 WHERE org_id=?', [orgId]);
    await query(
      'UPDATE academic_years SET name=COALESCE(?,name), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), is_current=COALESCE(?,is_current), status=COALESCE(?,status) WHERE id=?',
      [name||null, start_date||null, end_date||null, is_current!==undefined?(is_current?1:0):null, status||null, id]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

// All sections flat (MUST be before /:classId)
// Every section picker in the product is fed from here — Fees, Students,
// Meetings, Exams, the teacher drawer, the Classes page.
//
// It used to filter `s.status='active'` only. A class that a school ARCHIVED
// still owns its sections, and those sections stay active, so an archived class
// kept appearing in every picker in the platform. JD PUBLIC archived Class 11
// and Class 12; both were still being offered on the Fees screen while the
// school was running Nursery to Class 10 (AK, 2026-07-30).
//
// A picker must offer what the school currently runs. Archiving a class is
// exactly the school saying "we do not run this any more", so the section
// belonging to it does not belong in a dropdown either.
router.get('/all-sections', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const params = [orgId];
    // multi-branch: scope to the active branch (null for single-branch orgs → unchanged)
    const activeSchool = await getActiveSchool(req);
    let branchFilter = '';
    if (activeSchool) { branchFilter = ' AND s.school_id=?'; params.push(activeSchool); }
    // Every section picker in the product is fed from here, so it carries the
    // same answer as the class list — a student must not be offered a section
    // of a class they are not in.
    const vf = classFilter(await visibleClassIds(req), 'c.id');
    params.push(...vf.params);
    const sections = await query(
      `SELECT s.*, c.name as class_name, c.standard,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as teacher_name,
        (SELECT COUNT(*) FROM client_enrollments e WHERE e.section_id=s.id AND ${activeEnrolment('e')}) student_count
       FROM client_sections s
       JOIN client_classes c ON c.id=s.class_id
       LEFT JOIN client_users u ON u.id=s.class_teacher_id
       WHERE s.org_id=? AND s.status='active' AND c.status='active'${branchFilter}${vf.clause}
       ORDER BY COALESCE(c.display_order, c.standard * 10), c.standard, s.name`,
      params);
    return success(res, { sections });
  } catch (e) { return error(res, e.message, 500); }
});

// The pool, shaped the way services/classDeletion.js wants an executor. Built
// from the destructured `query` so a stubbed db in tests flows through it.
const poolExec = { query: (sql, params) => query(sql, params) };

/**
 * The archived corner of the Classes page (MUST stay before /:classId).
 *
 * An archived class is invisible everywhere else in the product by design — it
 * is out of the pickers, off the register, gone from the card grid. Which also
 * meant a school could not SEE what it had archived, let alone tidy it up. This
 * is the one screen that shows them, and it carries the reason each one can or
 * cannot be permanently deleted, so the button in the UI can never offer
 * something the delete endpoint will refuse.
 */
/*
 * Arrange the classes in the order this school reads them.
 *
 * AK, 2026-07-30: "Classes ka order arrange kr skte hai, proper — like Nursery,
 * LKG, UKG, Class 1 to aage tk (mtlb khud se order set kr skte hai)."
 *
 * `standard` cannot answer this. It is the GRADE — report cards and promotion
 * read it — and a pre-primary class has no grade, so JD PUBLIC had LKG at 2
 * (colliding with Class 2) and UKG at 3. Ordering by it printed Class 2 between
 * Class 1 and LKG. So the position is its own column now, and the school owns it.
 *
 * Takes the ids in the order they should appear. Spaced by 10 so a later
 * insertion between two classes does not renumber the list. Every id is checked
 * to belong to THIS org before anything is written (§17) — a reorder is a cheap
 * place to smuggle in another tenant's id otherwise.
 * MUST stay above /:classId, or Express reads "reorder" as a class id.
 */
router.put('/reorder', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const ids = Array.isArray(req.body?.order) ? req.body.order.map(Number).filter(Boolean) : [];
    if (!ids.length) return error(res, 'Send the classes in the order you want them', 400);

    const ph = ids.map(() => '?').join(',');
    const owned = await query(
      `SELECT id FROM client_classes WHERE org_id=? AND id IN (${ph})`, [orgId, ...ids]);
    if (owned.length !== ids.length) {
      return error(res, 'One of those classes does not belong to this school', 400);
    }

    await transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.query('UPDATE client_classes SET display_order=? WHERE id=? AND org_id=?',
          [(i + 1) * 10, ids[i], orgId]);
      }
    });

    await audit(req, 'CLASS_REORDER', 'class', null, { new_data: { order: ids } });
    return success(res, { order: ids }, 'Order saved');
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/archived', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const params = [orgId];
    const activeSchool = await getActiveSchool(req);
    let branchFilter = '';
    if (activeSchool) { branchFilter = ' AND c.school_id=?'; params.push(activeSchool); }

    const classes = await query(
      `SELECT c.id, c.name, c.standard, c.room_no, c.capacity, c.status, c.academic_year_id,
              ay.name AS academic_year_name,
              (SELECT COUNT(*) FROM client_sections s WHERE s.class_id=c.id AND s.org_id=c.org_id) AS section_count,
              (SELECT COUNT(*) FROM client_enrollments e
                 JOIN client_sections s2 ON s2.id=e.section_id
                WHERE s2.class_id=c.id AND s2.org_id=c.org_id
                  AND ${activeEnrolment('e')}) AS student_count
         FROM client_classes c
         LEFT JOIN academic_years ay ON ay.id=c.academic_year_id
        WHERE c.org_id=? AND c.status='archived'${branchFilter}
        ORDER BY COALESCE(c.display_order, c.standard * 10), c.standard, c.name`,
      params);

    // No archived classes → not one reference query runs. The common case costs
    // this page nothing.
    if (classes.length) {
      const report = await classDeletionBlockers(poolExec, orgId, classes.map((c) => c.id));
      for (const c of classes) {
        const r = report.get(Number(c.id));
        c.blockers = r ? r.blockers : [];
        c.can_delete = r ? r.deletable : false;
      }
    }
    return success(res, { classes });
  } catch (e) { return error(res, e.message, 500); }
});

// Classes list
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { academic_year_id, status='active' } = req.query;

    // ── A CLASS WITH NO YEAR SET BELONGS TO THE CURRENT YEAR (AK, 2026-07-29) ──
    // JD PUBLIC reported 12 classes reading "not linked to a year" (WW-60). The
    // seeder bug that created those rows is fixed and the rows are backfilled,
    // but neither of those helps the NEXT row that arrives NULL for some other
    // reason — an import, a restore, a path nobody has written yet.
    //
    // So unset is not a third state here. A school runs ONE year at a time; if a
    // class does not name one, it is in the year the school is currently in. The
    // rule is applied in the two places the old code could contradict itself:
    //   · the NAME shown on the card — no more "Not linked" while 2026-27 runs
    //   · the YEAR FILTER — a NULL class used to VANISH when you filtered by the
    //     very year it is really in, which is worse than the wrong label
    // Both now read COALESCE(c.academic_year_id, <current>), so the card and the
    // filter can never disagree about the same class again.
    //
    // Nothing is written here. The stored value stays NULL until an admin picks a
    // year (the tile is editable), and an explicit choice is never overridden.
    // If the org has no current year at all, currentYearId is null, COALESCE
    // changes nothing, and the old behaviour stands — which is correct, because
    // there is then no honest answer to imply.
    const currentYear = await queryOne(
      'SELECT id FROM academic_years WHERE org_id=? AND is_current=1', [orgId]);
    const currentYearId = currentYear?.id ?? null;

    let where = 'WHERE c.org_id=?';
    const whereParams = [orgId];
    if (academic_year_id) {
      where += ' AND COALESCE(c.academic_year_id,?)=?';
      whereParams.push(currentYearId, academic_year_id);
    }
    if (status) { where += ' AND c.status=?'; whereParams.push(status); }
    // multi-branch: scope to the active branch (null for single-branch orgs → unchanged)
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND c.school_id=?'; whereParams.push(activeSchool); }

    /*
     * WHO IS ASKING (AK, 2026-07-30): "student ko apna respective, teacher ko
     * assigned, parent ko apne bache ka."
     *
     * This route was behind `authenticate` and nothing else, so any logged-in
     * student or parent could ask for the whole school's class list. It was
     * never visible in the product because their screens called other endpoints
     * — but it was one fetch away, and it is the endpoint the shared Classes
     * console reads. Scoped here, in the query, where a client cannot get past it.
     */
    const visible = await visibleClassIds(req);
    const vf = classFilter(visible, 'c.id');
    where += vf.clause;
    whereParams.push(...vf.params);

    // The JOIN's parameter is bound BEFORE the WHERE's, because that is the order
    // the placeholders appear in the statement below.
    const params = [currentYearId, ...whereParams];

    const classes = await query(
      `SELECT c.*,
        ay.name as academic_year_name,
        (c.academic_year_id IS NULL) AS academic_year_implied,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as class_teacher_name,
        (SELECT COUNT(*) FROM client_sections WHERE class_id=c.id AND status='active') section_count,
        (SELECT COUNT(*) FROM client_enrollments e2
           JOIN client_sections s2 ON s2.id=e2.section_id
           WHERE s2.class_id=c.id AND ${activeEnrolment('e2')}) student_count
       FROM client_classes c
       LEFT JOIN academic_years ay ON ay.id=COALESCE(c.academic_year_id,?)
       LEFT JOIN client_users u ON u.id=c.class_teacher_id
       ${where}
       ORDER BY COALESCE(c.display_order, c.standard * 10), c.standard, c.name`,
      params);

    // Each card carries its own sections — who runs them and how many children
    // are in each — so an admin can see at a glance which room still has no
    // teacher, instead of opening thirteen drawers to find out. Two queries for
    // the whole page, never one per class.
    if (classes.length) {
      const classIds = classes.map(c => c.id);
      const sections = await query(
        `SELECT s.id, s.class_id, s.name, s.capacity, s.class_teacher_id,
                TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS teacher_name,
                (SELECT COUNT(*) FROM client_enrollments e
                  WHERE e.section_id=s.id AND e.org_id=s.org_id
                    AND ${activeEnrolment('e')}) AS student_count
           FROM client_sections s
           LEFT JOIN client_users u ON u.id=s.class_teacher_id
          WHERE s.org_id=? AND s.status='active'
            AND s.class_id IN (${classIds.map(() => '?').join(',')})
          ORDER BY s.name`,
        [orgId, ...classIds]);

      const teachersBySection = await subjectTeachersForSections(orgId, sections.map(s => s.id));
      const byClass = new Map(classIds.map(id => [id, []]));
      for (const s of sections) {
        const st = teachersBySection.get(Number(s.id)) || [];
        s.subject_teacher_count = new Set(st.map(x => x.teacher_id)).size;
        s.subject_count = new Set(st.map(x => x.subject_id)).size;
        byClass.get(Number(s.class_id))?.push(s);
      }
      for (const c of classes) {
        const list = byClass.get(Number(c.id)) || [];
        c.sections = list;
        // A class teacher belongs to a SECTION — 10-A and 10-B have different
        // ones. The person at class level is an INCHARGE, and an incharge must
        // NOT make a section without its own class teacher look covered; that
        // is exactly the gap an admin needs to see. (AK, 2026-07-29)
        c.sections_without_teacher = list.filter(s => !s.class_teacher_id).length;
        c.sections_without_subjects = list.filter(s => !s.subject_teacher_count).length;
      }
    }
    return success(res, { classes });
  } catch (e) { return error(res, e.message, 500); }
});

// Create class
router.post('/', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, academic_year_id, room_no, capacity=40, class_teacher_id } = req.body;
    if (!name) return error(res, 'name required', 400);

    /*
     * AK, 2026-07-30: "standard ya order ki bhi i think required nhi h."
     *
     * Right — a school should never type "-2" to mean Nursery, which is exactly
     * what JD had to do. Position is now display_order and it is DRAGGED, and
     * `standard` is an internal grade number that report cards and promotion
     * read. So we derive it instead of asking: the digits in the name if there
     * are any ("Class 10" -> 10), 0 otherwise. A school that genuinely needs a
     * different grade number can still send one; the form simply stops asking.
     */
    const standard = req.body.standard != null && req.body.standard !== ''
      ? Number(req.body.standard)
      : (String(name).match(/\d+/) ? Number(String(name).match(/\d+/)[0]) : 0);

    // New classes land at the END of the school's arrangement, never in the
    // middle of it. Spaced by 10 to match the migration's numbering.
    const last = await queryOne(
      'SELECT MAX(display_order) AS mx FROM client_classes WHERE org_id=?', [orgId]);
    const displayOrder = (Number(last?.mx) || 0) + 10;
    let ayId = academic_year_id;
    if (!ayId) {
      const ay = await queryOne('SELECT id FROM academic_years WHERE org_id=? AND is_current=1', [orgId]);
      ayId = ay?.id;
    }
    const writeSchool = await getWriteSchool(req);
    const teacherId = await resolveTeacherId(class_teacher_id, orgId);
    const r = await query(
      'INSERT INTO client_classes (org_id,name,standard,display_order,academic_year_id,room_no,capacity,class_teacher_id,status,school_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [orgId, name, standard, displayOrder, ayId||null, room_no||null, capacity, teacherId, 'active', writeSchool]);
    const cls = await queryOne(`
      SELECT c.*, ay.name as academic_year_name, 0 section_count, 0 student_count
      FROM client_classes c LEFT JOIN academic_years ay ON ay.id=c.academic_year_id
      WHERE c.id=?`, [r.insertId]);
    return success(res, cls, 'Class created', 201);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Update class
router.put('/:id', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    if (isNaN(parseInt(id))) return error(res, 'Invalid id', 400);
    const cls = await queryOne('SELECT * FROM client_classes WHERE id=? AND org_id=?', [id, orgId]);
    if (!cls) return error(res, 'Not found', 404);
    const { name, standard, room_no, capacity, class_teacher_id, status, academic_year_id } = req.body;
    // COALESCE(?, class_teacher_id) + `||null` made "no teacher assigned" a
    // silent no-op — a wrong class teacher could never be removed. Assign the
    // column explicitly whenever the form actually sent the field.
    const touchTeacher = Object.prototype.hasOwnProperty.call(req.body, 'class_teacher_id');
    const teacherId = touchTeacher ? await resolveTeacherId(class_teacher_id, orgId) : null;

    // Same explicit-assignment rule for the academic year, and the same tenant
    // check as the teacher: a year id is a global autoincrement, so it must be
    // proven to belong to THIS org before it can be written to this class.
    // (The field was simply absent here, which is why a class could be created
    // against a year but never re-linked to one — every card then read
    // "No academic year linked" with no way to fix it from the screen.)
    const touchYear = Object.prototype.hasOwnProperty.call(req.body, 'academic_year_id');
    let yearId = null;
    if (touchYear && academic_year_id !== '' && academic_year_id !== null && academic_year_id !== undefined) {
      const y = await queryOne('SELECT id FROM academic_years WHERE id=? AND org_id=?', [academic_year_id, orgId]);
      if (!y) return error(res, 'That academic year was not found in this school', 400);
      yearId = y.id;
    }

    // room_no is explicit for the same reason: under COALESCE a cleared room
    // silently kept its old value, so a room typed by mistake could never be
    // removed from the screen that shows it.
    const touchRoom = Object.prototype.hasOwnProperty.call(req.body, 'room_no');

    await query(
      `UPDATE client_classes SET name=COALESCE(?,name), standard=COALESCE(?,standard), ${touchRoom ? 'room_no=?' : 'room_no=COALESCE(?,room_no)'}, capacity=COALESCE(?,capacity)${touchTeacher ? ', class_teacher_id=?' : ''}${touchYear ? ', academic_year_id=?' : ''}, status=COALESCE(?,status) WHERE id=? AND org_id=?`,
      [name||null, standard||null,
       touchRoom ? (String(room_no).trim() || null) : (room_no||null),
       capacity||null,
       ...(touchTeacher ? [teacherId] : []),
       ...(touchYear ? [yearId] : []), status||null, id, orgId]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Delete/archive class
router.delete('/:id', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const cls = await queryOne('SELECT * FROM client_classes WHERE id=? AND org_id=?', [id, orgId]);
    if (!cls) return error(res, 'Not found', 404);
    const count = await queryOne('SELECT COUNT(*) as cnt FROM client_sections WHERE class_id=?', [id]);
    if (count.cnt > 0) {
      await query('UPDATE client_classes SET status=? WHERE id=?', ['archived', id]);
      return success(res, {}, 'Class archived');
    }
    await query('DELETE FROM client_classes WHERE id=?', [id]);
    return success(res, {}, 'Class deleted');
  } catch (e) { return error(res, e.message, 500); }
});

/**
 * PERMANENT delete — the class row goes, and its empty sections with it.
 *
 * Deliberately a SEPARATE endpoint from DELETE /:id (which archives). Archiving
 * and destroying are not two outcomes of one button; the second one has to be
 * asked for by name. Everything here is fail-closed:
 *
 *   1. the class must exist IN THIS ORG                          → 404
 *   2. the class must already be ARCHIVED                        → 409
 *      Deleting straight off the live grid is not what was asked and is the
 *      easiest thing in the world to do by accident.
 *   3. NOTHING may still reference the class or its sections     → 409, naming
 *      what and how many. §15's spirit is that history outlives the structure:
 *      a class that carries a register, a receipt or a report card is not
 *      deletable at any price, and the answer says why rather than just "no".
 *   4. the checks are re-run INSIDE the transaction, under a row lock, so the
 *      answer that authorised the delete is the answer that was still true when
 *      it ran.
 *
 * Note on the lock: `SELECT … FOR UPDATE` on the section rows is a real barrier
 * for the two tables that have a foreign key into them — an INSERT into
 * client_enrollments / client_attendance_sessions takes a shared lock on the
 * parent section row and therefore waits. For the tables with no FK it is the
 * re-count, not the lock, that does the work; that window is one statement wide
 * and this is a rare, admin-only action.
 */
router.delete('/:id/permanent', requirePermission('classes.manage'), async (req, res) => {
  const { id } = req.params;
  const orgId = req.user.org_id;
  if (!/^[0-9]+$/.test(String(id))) return error(res, 'Invalid id', 400);
  try {
    const cls = await queryOne('SELECT * FROM client_classes WHERE id=? AND org_id=?', [id, orgId]);
    if (!cls) return error(res, 'Not found', 404);
    if (cls.status !== 'archived') {
      return error(res, `${cls.name} is still in use. Archive it first, then it can be deleted.`, 409);
    }

    const pre = (await classDeletionBlockers(poolExec, orgId, [cls.id])).get(Number(cls.id));
    if (!pre.deletable) {
      return error(
        res,
        `${cls.name} still holds ${describeBlockers(pre.blockers)}. That record is kept, so ${cls.name} cannot be deleted — it stays archived.`,
        409, { blockers: pre.blockers });
    }

    const removed = await transaction(async (conn) => {
      const exec = { query: async (sql, params = []) => { const [rows] = await conn.execute(sql, params); return rows; } };
      const [[locked]] = await conn.execute(
        'SELECT * FROM client_classes WHERE id=? AND org_id=? FOR UPDATE', [id, orgId]);
      if (!locked || locked.status !== 'archived') { const e = new Error('Not found'); e.status = 404; throw e; }
      const sections = await exec.query(
        'SELECT id, name, capacity, status FROM client_sections WHERE class_id=? AND org_id=? FOR UPDATE', [id, orgId]);

      const now = (await classDeletionBlockers(exec, orgId, [locked.id])).get(Number(locked.id));
      if (!now.deletable) {
        const e = new Error(`${locked.name} still holds ${describeBlockers(now.blockers)} — nothing was deleted.`);
        e.status = 409; throw e;
      }

      await exec.query('DELETE FROM client_sections WHERE class_id=? AND org_id=?', [id, orgId]);
      // `status='archived'` is repeated in the WHERE on purpose: the rule that
      // authorises this delete is also the last thing the statement asserts.
      const r = await exec.query(
        "DELETE FROM client_classes WHERE id=? AND org_id=? AND status='archived'", [id, orgId]);
      if (!r.affectedRows) { const e = new Error('Not found'); e.status = 404; throw e; }
      return { class: locked, sections };
    });

    // §12 audit — a class delete is the same weight as a student delete, and the
    // payload carries the whole row plus the sections that went with it, so what
    // was destroyed can be read back off the trail.
    await audit(req, 'CLASS_DELETE', 'class', Number(id), { old_data: removed });
    return success(res, { deleted_sections: removed.sections.length }, `${cls.name} deleted`);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Sections for a class
router.get('/:classId/sections', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId } = req.params;
    const params = [classId, orgId];
    // multi-branch: defence-in-depth — a branch-locked admin cannot read another
    // branch's sections even by supplying that branch's classId in the URL.
    const activeSchool = await getActiveSchool(req);
    let branchFilter = '';
    if (activeSchool) { branchFilter = ' AND s.school_id=?'; params.push(activeSchool); }
    // Everything an admin needs to manage a section at a glance: who owns it,
    // how full it is, and who teaches what in it — not just a name.
    const sections = await query(
      `SELECT s.*,
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as teacher_name,
        u.email as teacher_email, u.phone as teacher_phone, u.avatar as teacher_avatar,
        (SELECT COUNT(*) FROM client_enrollments e WHERE e.section_id=s.id AND ${activeEnrolment('e')}) student_count
       FROM client_sections s
       LEFT JOIN client_users u ON u.id=s.class_teacher_id
       WHERE s.class_id=? AND s.org_id=?${branchFilter} ORDER BY s.name`,
      params);

    // One extra query for ALL sections, not one per section — the class card
    // opens on a 13-class school and an N+1 here is felt immediately.
    const byId = await subjectTeachersForSections(orgId, sections.map(s => s.id));
    for (const s of sections) {
      const list = byId.get(Number(s.id)) || [];
      s.subject_teachers = list;
      s.subject_teacher_count = new Set(list.map(t => t.teacher_id)).size;
      s.subject_names = [...new Set(list.map(t => t.subject_name))].sort().join(', ') || null;
    }
    return success(res, { sections });
  } catch (e) { return error(res, e.message, 500); }
});

// Section roster — the students in one section, each with their linked parent.
// The admin's "who is actually in 10-A, and can I reach their family" view.
// (JDPS asked for exactly this: strength, class teacher, and a student list
// that shows whether a parent is linked. — 2026-07-29)
router.get('/:classId/sections/:sectionId/students', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId, sectionId } = req.params;

    // The section must belong to this class AND this org — never trust the URL.
    const sec = await queryOne(
      'SELECT id, name, capacity, class_teacher_id FROM client_sections WHERE id=? AND class_id=? AND org_id=?',
      [sectionId, classId, orgId]);
    if (!sec) return error(res, 'Section not found', 404);

    const students = await query(
      `SELECT st.id, st.admission_number, st.date_of_birth, st.gender, st.lifecycle_status,
              TRIM(CONCAT(COALESCE(su.first_name,''),' ',COALESCE(su.last_name,''))) AS full_name,
              su.email, su.phone, su.avatar,
              e.enrollment_date,
              p.id AS parent_id, ps.relation AS parent_relation,
              TRIM(CONCAT(COALESCE(pu.first_name,''),' ',COALESCE(pu.last_name,''))) AS parent_name,
              pu.phone AS parent_phone, pu.email AS parent_email
         FROM client_enrollments e
         JOIN client_students st ON st.id=e.student_id
         LEFT JOIN client_users su ON su.id=st.user_id
         LEFT JOIN client_parent_students ps
                ON ps.student_id=st.id AND ps.org_id=e.org_id AND ps.status='active' AND ps.is_primary=1
         LEFT JOIN client_parents p ON p.id=ps.parent_id
         LEFT JOIN client_users pu ON pu.id=p.user_id
        WHERE e.section_id=? AND e.org_id=? AND e.status='active'
        ORDER BY su.first_name, su.last_name`,
      [sectionId, orgId]);

    return success(res, {
      section: sec,
      students,
      summary: {
        strength: students.length,
        capacity: sec.capacity,
        without_parent: students.filter(s => !s.parent_id).length,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

/* ── WHO TEACHES THIS SECTION ──────────────────────────────────────────────
 *
 * A school's most ordinary sentence is "Sunita takes Maths in 5-B". Until now
 * the only place to say it was Staff → open the teacher → assign a subject —
 * i.e. from the teacher's side, one teacher at a time. An admin setting up a
 * class thinks the other way round: this room, these subjects, these teachers.
 * These three routes are that same relation, entered from the class.
 *
 * The homeroom/class teacher is NOT here: that is a column on the section and
 * is set by PUT /:classId/sections/:sectionId (class_teacher_id), which the
 * same card uses.
 *
 * Assigning a subject teacher is also how a subject BECOMES part of a class —
 * there is no separate class-subjects list to maintain (see services/sectionProfile).
 * — JD PUBLIC SCHOOL, 2026-07-29
 */

// The section must belong to this class AND this org. Never trust the URL.
async function assertSectionInClass(sectionId, classId, orgId) {
  const sec = await queryOne(
    'SELECT id, name, class_id FROM client_sections WHERE id=? AND class_id=? AND org_id=?',
    [sectionId, classId, orgId]);
  if (!sec) { const e = new Error('Section not found'); e.status = 404; throw e; }
  return sec;
}

// Read: class teacher + every subject taught here and by whom.
router.get('/:classId/sections/:sectionId/teachers', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId, sectionId } = req.params;
    await assertSectionInClass(sectionId, classId, orgId);
    const profile = await getSectionProfile(orgId, sectionId);
    return success(res, profile);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Assign a subject teacher to this section.
router.post('/:classId/sections/:sectionId/teachers', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId, sectionId } = req.params;
    const { subject_id, teacher_id, is_primary = 0 } = req.body;
    if (!subject_id) return error(res, 'Choose a subject', 400);
    if (!teacher_id) return error(res, 'Choose a teacher', 400);

    const sec = await assertSectionInClass(sectionId, classId, orgId);

    const subject = await queryOne(
      'SELECT id, name FROM client_subjects WHERE id=? AND org_id=?', [subject_id, orgId]);
    if (!subject) return error(res, 'That subject was not found in this school', 400);
    const teacherId = await resolveTeacherId(teacher_id, orgId);
    if (!teacherId) return error(res, 'Choose a teacher', 400);

    // Idempotent: assigning the same teacher to the same subject twice is a
    // double-click, not a second assignment.
    const dupe = await queryOne(
      `SELECT id FROM client_teacher_subjects
        WHERE org_id=? AND teacher_id=? AND subject_id=?
          AND (section_id=? OR (section_id IS NULL AND class_id=?))`,
      [orgId, teacherId, subject_id, sectionId, classId]);
    if (dupe) return error(res, 'That teacher already takes this subject here', 409);

    const r = await query(
      `INSERT INTO client_teacher_subjects (org_id, teacher_id, subject_id, class_id, section_id, is_primary)
       VALUES (?,?,?,?,?,?)`,
      [orgId, teacherId, subject_id, classId, sectionId, is_primary ? 1 : 0]);

    await audit(req, 'TEACHER_ASSIGNED', 'section', Number(sectionId), {
      new_data: { assignment_id: r.insertId, teacher_id: teacherId, subject_id: Number(subject_id), section: sec.name },
    });
    return success(res, { id: r.insertId }, `${subject.name} assigned`, 201);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Unassign. Only rows that belong to THIS section (or to its class) can go —
// and only real assignment rows: a teacher who appears here because of a
// timetable period has no assignment id and must be removed in the timetable.
router.delete('/:classId/sections/:sectionId/teachers/:assignmentId', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId, sectionId, assignmentId } = req.params;
    await assertSectionInClass(sectionId, classId, orgId);

    const row = await queryOne(
      `SELECT id, teacher_id, subject_id FROM client_teacher_subjects
        WHERE id=? AND org_id=? AND (section_id=? OR (section_id IS NULL AND class_id=?))`,
      [assignmentId, orgId, sectionId, classId]);
    if (!row) return error(res, 'Assignment not found', 404);

    await query('DELETE FROM client_teacher_subjects WHERE id=? AND org_id=?', [assignmentId, orgId]);
    await audit(req, 'TEACHER_UNASSIGNED', 'section', Number(sectionId), {
      old_data: { assignment_id: row.id, teacher_id: row.teacher_id, subject_id: row.subject_id },
    });
    return success(res, {}, 'Teacher removed from this subject');
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Create section
router.post('/:classId/sections', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { classId } = req.params;
    const { name, capacity=40, class_teacher_id } = req.body;
    if (!name) return error(res, 'name required', 400);
    const cls = await queryOne('SELECT id, school_id FROM client_classes WHERE id=? AND org_id=?', [classId, orgId]);
    if (!cls) return error(res, 'Class not found', 404);
    const teacherId = await resolveTeacherId(class_teacher_id, orgId);
    const r = await query(
      'INSERT INTO client_sections (org_id,class_id,name,capacity,class_teacher_id,status,school_id) VALUES (?,?,?,?,?,?,?)',
      [orgId, classId, name, capacity, teacherId, 'active', cls.school_id || null]);
    const sec = await queryOne(`
      SELECT s.*, CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as teacher_name, 0 student_count
      FROM client_sections s LEFT JOIN client_users u ON u.id=s.class_teacher_id WHERE s.id=?`, [r.insertId]);
    return success(res, sec, 'Section created', 201);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Update section
router.put('/:classId/sections/:sectionId', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { sectionId } = req.params;
    const { name, capacity, class_teacher_id, status } = req.body;
    const sec = await queryOne('SELECT * FROM client_sections WHERE id=? AND org_id=?', [sectionId, orgId]);
    if (!sec) return error(res, 'Not found', 404);
    // Same unassign fix as the class update above.
    const touchTeacher = Object.prototype.hasOwnProperty.call(req.body, 'class_teacher_id');
    const teacherId = touchTeacher ? await resolveTeacherId(class_teacher_id, orgId) : null;
    await query(
      `UPDATE client_sections SET name=COALESCE(?,name), capacity=COALESCE(?,capacity)${touchTeacher ? ', class_teacher_id=?' : ''}, status=COALESCE(?,status) WHERE id=? AND org_id=?`,
      [name||null, capacity||null, ...(touchTeacher ? [teacherId] : []), status||null, sectionId, orgId]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, e.status || 500); }
});

// Delete section
router.delete('/:classId/sections/:sectionId', requirePermission('classes.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { sectionId } = req.params;
    // Validate-then-write (same gate as the PUT above): section ids are global
    // autoincrements, so an unscoped archive UPDATE let any org archive any
    // other org's section.
    const sec = await queryOne('SELECT id FROM client_sections WHERE id=? AND org_id=?', [sectionId, orgId]);
    if (!sec) return error(res, 'Not found', 404);
    const count = await queryOne('SELECT COUNT(*) as cnt FROM client_enrollments WHERE section_id=? AND status=?', [sectionId, 'active']);
    if (count.cnt > 0) {
      await query('UPDATE client_sections SET status=? WHERE id=? AND org_id=?', ['archived', sectionId, orgId]);
      return success(res, {}, 'Section archived (has students)');
    }
    await query('DELETE FROM client_sections WHERE id=? AND org_id=?', [sectionId, orgId]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
