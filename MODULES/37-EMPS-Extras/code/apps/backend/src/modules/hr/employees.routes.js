const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error, paginated } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { userCan, employeeFor } = require('./shared');
const meters = require('../../services/meters');

/*
 * HR — employee directory, departments, pods (hr-cms module, Step 3).
 * client_hr_employees EXTENDS client_users (user_id) — no parallel identity.
 * Leave is NOT here: the existing /api/leaves module is reused.
 * Immutable via API: employee_code (assigned on create, permanent), user_id
 * (create-only), status (only via /deactivate). org_id: token only.
 */

router.use(authenticate);

const PROFILE_FIELDS = ['full_name', 'email', 'phone', 'designation', 'department_id', 'pod_id',
  'reporting_to', 'employment_type', 'date_of_joining', 'profile_photo_url', 'subjects', 'classes_taught'];
const pickProfile = (body) => {
  const out = {};
  for (const f of PROFILE_FIELDS) if (body[f] !== undefined) out[f] = (f === 'subjects' || f === 'classes_taught') ? JSON.stringify(body[f]) : body[f];
  return out;
};

// ── meta: departments & pods ──
router.get('/departments', requirePermission('hr.view'), async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, head_employee_id, is_active FROM client_hr_departments WHERE org_id=? AND is_active=1 ORDER BY name',
      [req.user.org_id]);
    return success(res, { departments: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/departments', requirePermission('hr.employee.create'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const { name, head_employee_id = null } = req.body;
    if (!name) return error(res, 'name required', 400);
    const r = await query(
      'INSERT INTO client_hr_departments (org_id, name, head_employee_id) VALUES (?,?,?)',
      [req.user.org_id, name, head_employee_id]);
    return success(res, { id: r.insertId }, 'Department created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/pods', requirePermission('hr.view'), async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, department_id, lead_employee_id, is_active FROM client_hr_pods WHERE org_id=? AND is_active=1 ORDER BY name',
      [req.user.org_id]);
    return success(res, { pods: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/pods', requirePermission('hr.employee.create'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const { name, department_id = null, lead_employee_id = null } = req.body;
    if (!name) return error(res, 'name required', 400);
    const r = await query(
      'INSERT INTO client_hr_pods (org_id, name, department_id, lead_employee_id) VALUES (?,?,?,?)',
      [req.user.org_id, name, department_id, lead_employee_id]);
    return success(res, { id: r.insertId }, 'Pod created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ── self & team (declared before /:id) ──
router.get('/me', requirePermission('hr.employee.view_self'), async (req, res) => {
  try {
    const emp = await employeeFor(req.user.org_id, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);
    return success(res, { employee: emp });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/team', requirePermission('hr.employee.view_team'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (emp && emp.pod_id) {
      const rows = await query(
        `SELECT id, employee_code, full_name, designation, department_id, pod_id, status, profile_photo_url
         FROM client_hr_employees WHERE org_id=? AND pod_id=? AND status<>'exited' ORDER BY full_name`,
        [orgId, emp.pod_id]);
      return success(res, { employees: rows, scope: 'pod' });
    }
    // No pod membership: org-level staff (needs view_all) see everyone; others see nothing.
    if (await userCan(req.user.user_id, 'hr.employee.view_all', req.user.org_id)) {
      const rows = await query(
        `SELECT id, employee_code, full_name, designation, department_id, pod_id, status, profile_photo_url
         FROM client_hr_employees WHERE org_id=? AND status<>'exited' ORDER BY full_name`, [orgId]);
      return success(res, { employees: rows, scope: 'org' });
    }
    return success(res, { employees: [], scope: 'none' });
  } catch (e) { return error(res, e.message, 500); }
});

// ── directory ──
router.get('/', requirePermission('hr.employee.view_all'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const where = ['org_id=?'];
    const params = [orgId];
    if (req.query.department_id) { where.push('department_id=?'); params.push(req.query.department_id); }
    if (req.query.pod_id) { where.push('pod_id=?'); params.push(req.query.pod_id); }
    if (req.query.status) { where.push('status=?'); params.push(req.query.status); }
    if (req.query.q) {
      where.push('(full_name LIKE ? OR employee_code LIKE ? OR email LIKE ?)');
      const like = `%${req.query.q}%`;
      params.push(like, like, like);
    }
    const total = (await queryOne(`SELECT COUNT(*) n FROM client_hr_employees WHERE ${where.join(' AND ')}`, params)).n;
    const rows = await query(
      `SELECT * FROM client_hr_employees WHERE ${where.join(' AND ')} ORDER BY full_name LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]);
    return paginated(res, { employees: rows }, total, page, limit);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:id', requirePermission('hr.employee.view_all'), async (req, res) => {
  try {
    const emp = await queryOne('SELECT * FROM client_hr_employees WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!emp) return error(res, 'Not found', 404);
    return success(res, { employee: emp });
  } catch (e) { return error(res, e.message, 500); }
});

// Scorecard: attendance % + content shipped + approval rate. Gate = view_team;
// scope = self, same pod, or org-level caller (no employee row) with view_all.
router.get('/:id/scorecard', requirePermission('hr.employee.view_team'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const target = await queryOne('SELECT * FROM client_hr_employees WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!target) return error(res, 'Not found', 404);
    const caller = await employeeFor(orgId, req.user.user_id);
    const allowed = (caller && (caller.id === target.id || (caller.pod_id && caller.pod_id === target.pod_id)))
      || (!caller || !caller.pod_id ? await userCan(req.user.user_id, 'hr.employee.view_all', req.user.org_id) : false);
    if (!allowed) return error(res, 'Outside your team scope', 403);

    const days = Math.min(90, parseInt(req.query.days) || 30);
    const [att, assets, approvals] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) marked, SUM(status='present' OR status='wfh') present, ROUND(AVG(total_hours),2) avg_hours
         FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [orgId, target.id, days]),
      queryOne(
        `SELECT COUNT(*) created, SUM(status='published') published
         FROM client_cms_assets WHERE org_id=? AND created_by=? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [orgId, target.id, days]),
      queryOne(
        `SELECT SUM(l.action='approve') approved, SUM(l.action IN ('request_changes','reject')) sent_back
         FROM client_cms_review_log l JOIN client_cms_assets a ON a.id=l.asset_id AND a.org_id=l.org_id
         WHERE l.org_id=? AND a.created_by=? AND l.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [orgId, target.id, days]),
    ]);
    const reviewed = Number(approvals.approved || 0) + Number(approvals.sent_back || 0);
    return success(res, {
      employee: { id: target.id, full_name: target.full_name, employee_code: target.employee_code },
      window_days: days,
      attendance: { days_marked: Number(att.marked || 0), days_present: Number(att.present || 0), avg_hours: att.avg_hours },
      content: { assets_created: Number(assets.created || 0), assets_published: Number(assets.published || 0) },
      review: { approved: Number(approvals.approved || 0), sent_back: Number(approvals.sent_back || 0),
        approval_rate: reviewed ? Math.round((Number(approvals.approved || 0) / reviewed) * 100) : null },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── create / update / deactivate ──
router.post('/', requirePermission('hr.employee.create'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { full_name, employee_code, user_id = null } = req.body;
    if (!full_name || !employee_code) return error(res, 'full_name and employee_code required', 400);
    if (req.body.status !== undefined) return error(res, 'status is server-managed (use /deactivate)', 400);
    const dupe = await queryOne('SELECT id FROM client_hr_employees WHERE org_id=? AND employee_code=?', [orgId, employee_code]);
    if (dupe) return error(res, 'employee_code already exists', 409);

    // PLAN LIMIT (KI-118). max_staff was enforced nowhere. Only an employee attached
    // to a LOGIN consumes a seat — staffCount() counts users holding a non-student/
    // parent role, so an employee record with user_id null is a personnel file, not a
    // billable seat, and must not be blocked by the cap.
    if (user_id) {
      const cap = await meters.checkHeadcount(orgId, 'staff', 1);
      if (!cap.ok) return error(res, cap.message, 402);
    }

    const p = pickProfile(req.body);
    const cols = ['org_id', 'user_id', 'employee_code', ...Object.keys(p).filter(k => k !== 'full_name'), 'full_name'];
    const vals = [orgId, user_id, employee_code, ...Object.keys(p).filter(k => k !== 'full_name').map(k => p[k]), full_name];
    const r = await query(`INSERT INTO client_hr_employees (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
    await audit(req, 'HR_EMPLOYEE_CREATE', 'hr_employee', r.insertId, { new_data: { employee_code, full_name } });
    return success(res, { id: r.insertId }, 'Employee created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/:id', requirePermission('hr.employee.update'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await queryOne('SELECT id FROM client_hr_employees WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!emp) return error(res, 'Not found', 404);
    if (req.body.employee_code !== undefined) return error(res, 'employee_code is immutable', 400);
    if (req.body.user_id !== undefined) return error(res, 'user_id is set on create only', 400);
    if (req.body.status !== undefined) return error(res, 'status is server-managed (use /deactivate)', 400);
    const p = pickProfile(req.body);
    if (!Object.keys(p).length) return error(res, 'nothing to update', 400);
    await query(
      `UPDATE client_hr_employees SET ${Object.keys(p).map(k => `${k}=?`).join(', ')} WHERE id=? AND org_id=?`,
      [...Object.values(p), req.params.id, orgId]);
    return success(res, {}, 'Employee updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/:id/deactivate', requirePermission('hr.employee.deactivate'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const r = await query(
      "UPDATE client_hr_employees SET status='exited' WHERE id=? AND org_id=?",
      [req.params.id, req.user.org_id]);
    if (!r.affectedRows) return error(res, 'Not found', 404);
    await audit(req, 'HR_EMPLOYEE_DEACTIVATE', 'hr_employee', req.params.id, {});
    return success(res, {}, 'Employee deactivated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
