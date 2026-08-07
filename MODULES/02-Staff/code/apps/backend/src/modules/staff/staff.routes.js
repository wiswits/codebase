const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { hash } = require('../../core/auth/password');
const { tempPassword } = require('../../utils/tempPassword');
const { buildNameSearch } = require('../../utils/sqlBuild');
const { checkEmail } = require('../../utils/validate');
const logger = require('../../utils/logger');
// multi-branch: staff belong to branches via client_user_schools membership
const { getActiveSchool, getWriteSchool } = require('../../utils/activeSchool');
const customFields = require('../custom-fields/customFields.service');
const { needsAdminApproval } = require('../../middleware/destructiveApproval');
const lifecycle = require('../../services/personLifecycle');
const { audit } = require('../../utils/audit');

router.use(authenticate);
// Staff roster exposes org-wide PII (emails/phones): admin-only.
router.use(requireRole('owner', 'admin', 'principal'));

// POST /api/staff — onboard a staff member WITH a working login (accountant,
// office, reception, librarian, driver, or any custom role the school created).
// This was missing entirely, so an admin could not create non-teacher staff at all.
router.post('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { first_name, last_name, phone, role_id, designation, department } = req.body || {};
    if (!first_name || !req.body?.email || !role_id) return error(res, 'Name, email and role are required', 400);

    // This becomes their login — see checkEmail (WW-33).
    const em = checkEmail(req.body.email, 'Login email');
    if (!em.ok) return error(res, em.message, 400);
    const email = em.value;

    // Custom fields: validate before any write (staff entity_id = user id).
    const cf = await customFields.validateCustom(o, 'staff', req.body.custom || {}, { enforceRequired: true });
    if (!cf.ok) return error(res, cf.message, 400);

    // Email is unique PER TENANT.
    const dup = await queryOne('SELECT id FROM client_users WHERE email=? AND org_id=?', [email, o]);
    if (dup) return error(res, 'A user with this email already exists', 409);

    // The role must belong to THIS org and must not be a student/parent/owner role.
    const role = await queryOne('SELECT id, slug, base_role FROM client_roles WHERE id=? AND org_id=?', [role_id, o]);
    if (!role) return error(res, 'Selected role not found', 404);
    if (['student', 'parent', 'owner'].includes(role.slug)) return error(res, 'That role cannot be assigned to staff', 400);

    // The office creating the account may choose the password (they are the ones
    // who have to read it out); otherwise we mint one. Either way it is returned
    // once below so it can actually be handed over. The inline 'Wis@'+random
    // this replaced was the original of utils/tempPassword.js — one generator now.
    const issuedPassword = (req.body.password && String(req.body.password)) || tempPassword();
    const password_hash = await hash(issuedPassword);

    const r = await query(
      `INSERT INTO client_users (org_id, first_name, last_name, email, phone, password_hash, designation, department_id, is_active)
       VALUES (?,?,?,?,?,?,?,?,1)`,
      [o, first_name, last_name || null, email, phone || null, password_hash, designation || null, null]);

    // client_user_roles.org_id is NOT NULL — always include it (the documented trap).
    await query('INSERT IGNORE INTO client_user_roles (org_id, user_id, role_id) VALUES (?,?,?)', [o, r.insertId, role.id]);

    // multi-branch: attribute the new staff member to the active/primary branch
    const writeSchool = await getWriteSchool(req);
    if (writeSchool) await query('INSERT IGNORE INTO client_user_schools (org_id, user_id, school_id) VALUES (?,?,?)', [o, r.insertId, writeSchool]);

    await customFields.writeValues(o, 'staff', r.insertId, cf.cleaned);

    return success(res, { id: r.insertId, email, temp_password: issuedPassword, role: role.slug }, 'Staff member created', 201);
  } catch (e) { logger.error('Staff create:', e); return error(res, 'Could not create staff member', 500); }
});

router.get('/', async (req, res) => {
  try {
    const o = req.user.org_id;
    const search = req.query.search || '';

    // Simpler: list all users with non-student/parent roles
    let whereSearch = '';
    const params = [o];
    if (search) {
      // full-name ("First Last") search — see buildNameSearch
      const ns = buildNameSearch(search, 'u', ['u.email']);
      if (ns.clause) { whereSearch = ` AND ${ns.clause}`; params.push(...ns.values); }
    }
    // branch scope: only staff who are members of the active branch (appended
    // after the search clause so the trailing ...params.slice(1) order holds)
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { whereSearch += ' AND u.id IN (SELECT user_id FROM client_user_schools WHERE org_id=? AND school_id=?)'; params.push(o, activeSchool); }

    // Mirrors students/teachers: default active, ?status=inactive|all to widen.
    const status = String(req.query.status || '').toLowerCase();
    const statusWhere = status === 'inactive' ? 'AND u.is_active=0'
      : status === 'all' ? ''
        : 'AND u.is_active=1';

    /* WW-38, reopened.
     *
     * The tiles were fixed to count the rows this query returns. They still read
     * wrong to the school, because the ROWS were wrong: designation, employee id
     * and department were selected from `client_teachers`, a legacy table that
     * holds ZERO rows on every live org (the /stats query below already says so
     * in a comment). Everything a school actually types lives on client_users —
     * `designation`, `employee_code`, `department_id`. So JD PUBLIC filled in
     * "TGT SCIENCE", "PGT MATHS", "MOTHER TEACHER" for all thirteen of their
     * staff and the page showed the generic word "Teacher" on every card: the
     * data they filled in was not reflected underneath. Read the real columns.
     *
     * The role join is also pinned to ONE row per user. It is a plain LEFT JOIN
     * on client_user_roles, so a user holding two roles came back twice — two
     * cards, a duplicate React key, and a Total tile counting them both. The
     * tiles cannot be right if a person can be two rows.
     */
    const staff = await query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
        u.is_active, u.created_at as joined_date,
        r.name as role, r.slug as role_slug, r.base_role,
        u.id as teacher_id, u.employee_code as employee_id, u.designation,
        d.name as department,
        CASE
          WHEN r.base_role='teacher' THEN 'teacher'
          ELSE 'admin'
        END as staff_type
      FROM client_users u
      LEFT JOIN client_user_roles ur
             ON ur.user_id=u.id AND ur.org_id=u.org_id
            AND ur.id=(SELECT MIN(ur2.id) FROM client_user_roles ur2
                        WHERE ur2.user_id=u.id AND ur2.org_id=u.org_id)
      LEFT JOIN client_roles r ON r.id=ur.role_id
      LEFT JOIN client_departments d ON d.id=u.department_id AND d.org_id=u.org_id
      WHERE u.org_id=?
        AND (r.slug NOT IN ('student','parent') OR r.slug IS NULL)
        AND u.id NOT IN (SELECT user_id FROM client_students WHERE org_id=?)
        AND u.id NOT IN (SELECT user_id FROM client_parents WHERE org_id=? AND user_id IS NOT NULL)
        -- WW-95: this roster was the ONE that never applied the platform's soft
        -- delete. Students, parents and teachers all hide is_active=0; staff
        -- listed everyone who had ever been added, so DEMO SCHOOL read "13 total
        -- staff members" on this page against 7 on the dashboard.
        --
        -- Active by DEFAULT, not always: ?status=inactive shows who was removed
        -- and ?status=all shows both, exactly like the students and teachers
        -- lists. Without this, "Mark active" would be an action you can never
        -- reach — a removed person would be invisible and therefore permanently
        -- removed, which is not what a soft delete means.
        ${statusWhere}
        ${whereSearch}
      ORDER BY u.first_name, u.last_name
    `, [...params.slice(0,1), o, o, ...params.slice(1)]);

    const teachers = staff.filter(s => s.staff_type === 'teacher').length;
    const admins = staff.filter(s => s.staff_type === 'admin').length;

    return success(res, { staff, total: staff.length, teachers, admins });
  // A failing roster query used to be swallowed into an empty array, so a broken
  // query and a school with no staff looked identical on screen — "No staff
  // members found", no error, nothing to retry. Let it surface: the page has an
  // error state with a Retry, and §12 requires it be used.
  } catch (e) { logger.error('Staff list:', e); return error(res, e.message, 500); }
});

router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    // Count from base_role (the real source everything else uses) — client_teachers
    // is a legacy/empty table, so the old count always showed 0.
    const activeSchool = await getActiveSchool(req);
    const mp = activeSchool ? ' AND u.id IN (SELECT user_id FROM client_user_schools WHERE org_id=? AND school_id=?)' : '';
    const mpa = () => activeSchool ? [o, activeSchool] : [];
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(DISTINCT u.id) FROM client_users u
          JOIN client_user_roles ur ON ur.user_id=u.id
          JOIN client_roles r ON r.id=ur.role_id
          WHERE u.org_id=? AND r.base_role='teacher' AND u.is_active=1${mp}) as teachers,
        (SELECT COUNT(DISTINCT u.id) FROM client_users u
          JOIN client_user_roles ur ON ur.user_id=u.id
          JOIN client_roles r ON r.id=ur.role_id
          WHERE u.org_id=? AND r.base_role NOT IN ('teacher','student','parent') AND u.is_active=1${mp}) as admin_staff
    `, [o, ...mpa(), o, ...mpa()]);
    
    const total = (stats?.teachers || 0) + (stats?.admin_staff || 0);
    return success(res, { ...stats, total });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Remove a staff member — soft, routed by who is asking, and guarded.
 *
 * The staff roster had no remove at all: an admin could add an accountant and
 * never take them off, so "removed" staff simply stayed on the list forever
 * (which is half of why WW-95 counted 13 people against the dashboard's 7).
 *
 * Two guards that are not optional here, because staff are the people who hold
 * the keys:
 *   · you cannot remove YOURSELF. An admin who does is locked out of the
 *     product with no way back in — the restore endpoint needs an admin.
 *   · you cannot remove the LAST active admin/owner/principal for the school,
 *     for the same reason one step removed: it leaves a school with nobody who
 *     can approve anything, including putting that person back.
 * Both are cheap to check and impossible to recover from.
 */
router.delete('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const id = Number(req.params.id);

    if (id === Number(req.user.user_id)) {
      return error(res, 'You cannot remove your own account', 400);
    }

    const person = await queryOne(
      'SELECT id, first_name, last_name, email, is_active FROM client_users WHERE id=? AND org_id=?', [id, o]);
    if (!person) return error(res, 'Staff member not found', 404);

    // Is this one of the last people who can run the school?
    const leaders = await queryOne(
      `SELECT COUNT(DISTINCT u.id) AS n
         FROM client_users u
         JOIN client_user_roles ur ON ur.user_id=u.id AND ur.org_id=u.org_id
         JOIN client_roles r ON r.id=ur.role_id
        WHERE u.org_id=? AND u.is_active=1 AND r.slug IN ('owner','admin','principal')`, [o]);
    const isLeader = await queryOne(
      `SELECT 1 AS yes FROM client_user_roles ur
         JOIN client_roles r ON r.id=ur.role_id
        WHERE ur.user_id=? AND ur.org_id=? AND r.slug IN ('owner','admin','principal') LIMIT 1`, [id, o]);
    if (isLeader && Number(leaders?.n || 0) <= 1) {
      return error(res, 'This is the only administrator left — add another before removing this one', 400);
    }

    await lifecycle.deactivate(o, id);

    if (needsAdminApproval(req)) {
      const { alreadyPending } = await lifecycle.requestDeletion(req, 'staff', id, person);
      await audit(req, 'STAFF_DELETE_REQUESTED', 'staff', id, {});
      return success(res, { pending_approval: true }, alreadyPending
        ? 'Already waiting for an admin to approve'
        : 'Removed from the lists — an admin will confirm the deletion');
    }

    await audit(req, 'STAFF_DEACTIVATED', 'staff', id, {});
    return success(res, { pending_approval: false }, 'Staff member removed');
  } catch (e) { logger.error('Staff delete:', e); return error(res, e.message, 500); }
});

// Undo / reactivate — one endpoint for both, as everywhere else.
router.post('/:id/activate', async (req, res) => {
  try {
    const o = req.user.org_id;
    const person = await queryOne('SELECT id FROM client_users WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!person) return error(res, 'Staff member not found', 404);
    await lifecycle.activate(o, req.params.id);
    await query(
      `UPDATE client_student_change_requests SET status='cancelled'
        WHERE org_id=? AND entity_type='staff' AND student_id=? AND change_type='delete' AND status='pending'`,
      [o, req.params.id]);
    await audit(req, 'STAFF_REACTIVATED', 'staff', Number(req.params.id), {});
    return success(res, {}, 'Staff member restored');
  } catch (e) { logger.error('Staff activate:', e); return error(res, e.message, 500); }
});

router.get('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    // Same legacy-table read as the list above (WW-38): designation, employee id,
    // department and joining date all live on client_users, not client_teachers.
    const member = await queryOne(`
      SELECT u.*, r.name as role, r.slug as role_slug,
        u.id as teacher_id, u.employee_code as employee_id, d.name as department
      FROM client_users u
      LEFT JOIN client_user_roles ur
             ON ur.user_id=u.id AND ur.org_id=u.org_id
            AND ur.id=(SELECT MIN(ur2.id) FROM client_user_roles ur2
                        WHERE ur2.user_id=u.id AND ur2.org_id=u.org_id)
      LEFT JOIN client_roles r ON r.id=ur.role_id
      LEFT JOIN client_departments d ON d.id=u.department_id AND d.org_id=u.org_id
      WHERE u.id=? AND u.org_id=?`, [req.params.id, o]);
    if (!member) return error(res, 'Staff member not found', 404);
    delete member.password_hash;
    delete member.reset_token;
    delete member.reset_token_expiry;
    member.custom = await customFields.readValues(o, 'staff', member.id);
    return success(res, member);
  } catch (e) { return error(res, e.message, 500); }
});

/* Correct a staff member's details after they were created.
 *
 * WW-113: there was no way to. The row menu offered only "Mark inactive" and
 * "Remove", so a typo in a name, a wrong email, or the wrong role picked from
 * the dropdown could only be undone by removing the person and creating them
 * again — which mints a new password and hands them a second login. Students,
 * teachers and parents have all had an update endpoint for months; staff simply
 * never got one.
 *
 * The guards mirror POST / exactly, because the same values are being written:
 *   · email is the LOGIN, so it goes through checkEmail and must stay unique
 *     per tenant (WW-33)
 *   · a role must belong to THIS org, and student/parent/owner roles are not
 *     assignable to staff
 *   · changing your OWN role is refused — an admin who demotes themselves is
 *     locked out with nobody able to put them back, the same reasoning that
 *     guards self-deletion above
 *   · the last owner/admin/principal cannot be demoted, for the same reason one
 *     step removed
 * Nothing here touches password_hash: a password change is its own deliberate
 * act, not a side effect of fixing a spelling.
 */
router.put('/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const id = Number(req.params.id);
    const { first_name, last_name, phone, designation, role_id } = req.body || {};

    const member = await queryOne(
      'SELECT id, email, is_active FROM client_users WHERE id=? AND org_id=?', [id, o]);
    if (!member) return error(res, 'Staff member not found', 404);
    if (first_name !== undefined && !String(first_name).trim()) {
      return error(res, 'First name is required', 400);
    }

    // Email — only when it actually changes, and it is their way back in.
    let email = member.email;
    if (req.body?.email !== undefined && String(req.body.email).trim() !== member.email) {
      const em = checkEmail(req.body.email, 'Login email');
      if (!em.ok) return error(res, em.message, 400);
      const dup = await queryOne(
        'SELECT id FROM client_users WHERE email=? AND org_id=? AND id<>?', [em.value, o, id]);
      if (dup) return error(res, 'A user with this email already exists', 409);
      email = em.value;
    }

    // Custom fields validate before any write, as on create.
    const cf = await customFields.validateCustom(o, 'staff', req.body?.custom || {}, { enforceRequired: false });
    if (!cf.ok) return error(res, cf.message, 400);

    // Role change, with the two locks that are impossible to recover from.
    let role = null;
    if (role_id !== undefined && role_id !== null && String(role_id) !== '') {
      role = await queryOne('SELECT id, slug FROM client_roles WHERE id=? AND org_id=?', [role_id, o]);
      if (!role) return error(res, 'Selected role not found', 404);
      if (['student', 'parent', 'owner'].includes(role.slug)) {
        return error(res, 'That role cannot be assigned to staff', 400);
      }
      if (id === Number(req.user.user_id)) {
        return error(res, 'You cannot change your own role', 400);
      }
      const wasLeader = await queryOne(
        `SELECT 1 AS yes FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id
          WHERE ur.user_id=? AND ur.org_id=? AND r.slug IN ('owner','admin','principal') LIMIT 1`, [id, o]);
      if (wasLeader && !['owner', 'admin', 'principal'].includes(role.slug)) {
        const leaders = await queryOne(
          `SELECT COUNT(DISTINCT u.id) AS n FROM client_users u
             JOIN client_user_roles ur ON ur.user_id=u.id AND ur.org_id=u.org_id
             JOIN client_roles r ON r.id=ur.role_id
            WHERE u.org_id=? AND u.is_active=1 AND r.slug IN ('owner','admin','principal')`, [o]);
        if (Number(leaders?.n || 0) <= 1) {
          return error(res, 'This is the last person who can run the school — give someone else an admin role first', 400);
        }
      }
    }

    await query(
      `UPDATE client_users
          SET first_name=COALESCE(?,first_name), last_name=COALESCE(?,last_name),
              phone=COALESCE(?,phone), designation=COALESCE(?,designation), email=?
        WHERE id=? AND org_id=?`,
      [first_name ?? null, last_name ?? null, phone ?? null, designation ?? null, email, id, o]);

    if (role) {
      await query('DELETE FROM client_user_roles WHERE user_id=? AND org_id=?', [id, o]);
      // client_user_roles.org_id is NOT NULL — always include it (the documented trap).
      await query('INSERT IGNORE INTO client_user_roles (org_id, user_id, role_id) VALUES (?,?,?)', [o, id, role.id]);
    }

    await customFields.writeValues(o, 'staff', id, cf.cleaned);
    await audit(req, 'STAFF_UPDATED', 'staff', id, { role: role?.slug || null });
    return success(res, { id }, 'Staff member updated');
  } catch (e) { logger.error('Staff update:', e); return error(res, 'Could not update staff member', 500); }
});

module.exports = router;
