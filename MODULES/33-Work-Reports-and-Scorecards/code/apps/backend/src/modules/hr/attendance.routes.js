const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { userCan, employeeFor } = require('./shared');

/*
 * HR — geofenced employee check-in/out, policy, holidays (hr-cms module, Step 3).
 * Distinct from /api/attendance (student/class marking) — different workflow.
 * Server-computed, never client-supplied: att_date, check_in_at/out_at, method,
 * late_by_minutes, total_hours, approved_by. Geofence validated SERVER-side.
 */

router.use(authenticate);

const DEFAULT_POLICY = {
  shift_start: '09:00:00', shift_end: '17:30:00', grace_minutes: 10,
  half_day_threshold_hours: 4.0, geofence_lat: null, geofence_lng: null,
  geofence_radius_m: null, working_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], require_geo: 0,
};
const getPolicy = async (orgId) => {
  const row = await queryOne('SELECT * FROM client_hr_attendance_policy WHERE org_id=?', [orgId]);
  if (!row) return { ...DEFAULT_POLICY, is_default: true };
  try { row.working_days = JSON.parse(row.working_days || 'null') || DEFAULT_POLICY.working_days; } catch { row.working_days = DEFAULT_POLICY.working_days; }
  return row;
};

// Haversine distance in meters — geofence is enforced here, never on the client.
const distanceM = (lat1, lng1, lat2, lng2) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const lateMinutes = (policy) => {
  const now = new Date();
  const [h, m] = String(policy.shift_start).split(':').map(Number);
  const cutoff = new Date(now); cutoff.setHours(h, m + Number(policy.grace_minutes || 0), 0, 0);
  return Math.max(0, Math.round((now - cutoff) / 60000));
};

// ── check-in / check-out ──
router.post('/check-in', requirePermission('hr.attendance.mark_self'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);
    const open = await queryOne(
      'SELECT id, check_in_at FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date=CURDATE()',
      [orgId, emp.id]);
    if (open && open.check_in_at) return error(res, 'Already checked in today', 409);

    const policy = await getPolicy(orgId);
    const lat = req.body.lat != null ? Number(req.body.lat) : null;
    const lng = req.body.lng != null ? Number(req.body.lng) : null;
    if (policy.require_geo) {
      if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return error(res, 'Location required to check in', 400);
      if (policy.geofence_lat != null && policy.geofence_radius_m != null) {
        const d = distanceM(lat, lng, Number(policy.geofence_lat), Number(policy.geofence_lng));
        if (d > Number(policy.geofence_radius_m)) return error(res, 'Outside the allowed check-in area', 403);
      }
    }
    const method = lat != null && lng != null ? 'geo' : 'web';
    const late = lateMinutes(policy);
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim() || null;
    if (open) {
      await query(
        `UPDATE client_hr_attendance SET check_in_at=NOW(), check_in_method=?, check_in_lat=?, check_in_lng=?, check_in_ip=?, late_by_minutes=?, status='present'
         WHERE id=? AND org_id=?`,
        [method, lat, lng, ip, late, open.id, orgId]);
    } else {
      await query(
        `INSERT INTO client_hr_attendance (org_id, employee_id, att_date, check_in_at, check_in_method, check_in_lat, check_in_lng, check_in_ip, late_by_minutes, status)
         VALUES (?,?,CURDATE(),NOW(),?,?,?,?,?,'present')`,
        [orgId, emp.id, method, lat, lng, ip, late]);
    }
    return success(res, { checked_in: true, late_by_minutes: late }, 'Checked in', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/check-out', requirePermission('hr.attendance.mark_self'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);
    const row = await queryOne(
      'SELECT id, check_in_at, check_out_at FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date=CURDATE()',
      [orgId, emp.id]);
    if (!row || !row.check_in_at) return error(res, 'Not checked in today', 409);
    if (row.check_out_at) return error(res, 'Already checked out', 409);
    await query(
      `UPDATE client_hr_attendance
       SET check_out_at=NOW(), total_hours=ROUND(TIMESTAMPDIFF(SECOND, check_in_at, NOW())/3600, 2)
       WHERE id=? AND org_id=?`,
      [row.id, orgId]);
    const done = await queryOne('SELECT check_out_at, total_hours FROM client_hr_attendance WHERE id=? AND org_id=?', [row.id, orgId]);
    return success(res, { checked_out: true, total_hours: done.total_hours }, 'Checked out');
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/me', requirePermission('hr.attendance.mark_self'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : null;
    const rows = month
      ? await query(
          `SELECT * FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND DATE_FORMAT(att_date,'%Y-%m')=? ORDER BY att_date`,
          [orgId, emp.id, month])
      : await query(
          `SELECT * FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date >= DATE_SUB(CURDATE(), INTERVAL 31 DAY) ORDER BY att_date`,
          [orgId, emp.id]);
    const today = await queryOne(
      'SELECT * FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date=CURDATE()', [orgId, emp.id]);
    return success(res, { records: rows, today });
  } catch (e) { return error(res, e.message, 500); }
});

// Team view: pod scope; org-level callers (no pod) need view_all for org-wide.
router.get('/team', requirePermission('hr.attendance.view_team'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : null;
    const emp = await employeeFor(orgId, req.user.user_id);
    let podClause = '';
    const params = [date, orgId];
    if (emp && emp.pod_id) { podClause = 'AND e.pod_id=?'; params.push(emp.pod_id); }
    else if (!(await userCan(req.user.user_id, 'hr.attendance.view_all', req.user.org_id))) {
      return success(res, { records: [], scope: 'none' });
    }
    const rows = await query(
      `SELECT e.id employee_id, e.full_name, e.employee_code, e.pod_id,
              a.check_in_at, a.check_out_at, a.status, a.total_hours, a.late_by_minutes
       FROM client_hr_employees e
       LEFT JOIN client_hr_attendance a ON a.employee_id=e.id AND a.org_id=e.org_id AND a.att_date=COALESCE(?, CURDATE())
       WHERE e.org_id=? ${podClause} AND e.status<>'exited'
       ORDER BY e.full_name`,
      params);
    return success(res, { records: rows, scope: podClause ? 'pod' : 'org' });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/', requirePermission('hr.attendance.view_all'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : null;
    const extra = [];
    const params = [date, orgId];
    if (req.query.pod_id) { extra.push('AND e.pod_id=?'); params.push(req.query.pod_id); }
    if (req.query.department_id) { extra.push('AND e.department_id=?'); params.push(req.query.department_id); }
    const rows = await query(
      `SELECT e.id employee_id, e.full_name, e.employee_code, e.department_id, e.pod_id,
              a.id, a.check_in_at, a.check_out_at, a.status, a.total_hours, a.late_by_minutes, a.notes
       FROM client_hr_employees e
       LEFT JOIN client_hr_attendance a ON a.employee_id=e.id AND a.org_id=e.org_id AND a.att_date=COALESCE(?, CURDATE())
       WHERE e.org_id=? ${extra.join(' ')} AND e.status<>'exited'
       ORDER BY e.full_name`,
      params);
    return success(res, { records: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/:id/override', requirePermission('hr.attendance.override'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const row = await queryOne('SELECT id FROM client_hr_attendance WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!row) return error(res, 'Not found', 404);
    const ALLOWED_STATUS = ['present', 'absent', 'half_day', 'wfh', 'leave', 'holiday'];
    const { status, notes } = req.body;
    if (status !== undefined && !ALLOWED_STATUS.includes(status)) return error(res, 'invalid status', 400);
    if (status === undefined && notes === undefined) return error(res, 'nothing to update', 400);
    const caller = await employeeFor(orgId, req.user.user_id);
    await query(
      `UPDATE client_hr_attendance SET status=COALESCE(?,status), notes=COALESCE(?,notes),
              check_in_method='manual_override', approved_by=?, approved_at=NOW()
       WHERE id=? AND org_id=?`,
      [status ?? null, notes ?? null, caller ? caller.id : null, req.params.id, orgId]);
    await audit(req, 'HR_ATTENDANCE_OVERRIDE', 'hr_attendance', req.params.id, { new_data: { status, notes } });
    return success(res, {}, 'Attendance overridden');
  } catch (e) { return error(res, e.message, 500); }
});

// ── policy & holidays ──
router.get('/policy', requirePermission('hr.attendance.mark_self'), async (req, res) => {
  try { return success(res, { policy: await getPolicy(req.user.org_id) }); }
  catch (e) { return error(res, e.message, 500); }
});

router.put('/policy', requirePermission('hr.attendance.policy_manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const p = { ...DEFAULT_POLICY, ...(await queryOne('SELECT * FROM client_hr_attendance_policy WHERE org_id=?', [orgId]) || {}) };
    const FIELDS = ['shift_start', 'shift_end', 'grace_minutes', 'half_day_threshold_hours',
      'geofence_lat', 'geofence_lng', 'geofence_radius_m', 'working_days', 'require_geo'];
    for (const f of FIELDS) if (req.body[f] !== undefined) p[f] = req.body[f];
    const wd = JSON.stringify(Array.isArray(p.working_days) ? p.working_days : DEFAULT_POLICY.working_days);
    await query(
      `INSERT INTO client_hr_attendance_policy
         (org_id, shift_start, shift_end, grace_minutes, half_day_threshold_hours, geofence_lat, geofence_lng, geofence_radius_m, working_days, require_geo)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE shift_start=VALUES(shift_start), shift_end=VALUES(shift_end), grace_minutes=VALUES(grace_minutes),
         half_day_threshold_hours=VALUES(half_day_threshold_hours), geofence_lat=VALUES(geofence_lat), geofence_lng=VALUES(geofence_lng),
         geofence_radius_m=VALUES(geofence_radius_m), working_days=VALUES(working_days), require_geo=VALUES(require_geo)`,
      [orgId, p.shift_start, p.shift_end, p.grace_minutes, p.half_day_threshold_hours,
        p.geofence_lat, p.geofence_lng, p.geofence_radius_m, wd, p.require_geo ? 1 : 0]);
    await audit(req, 'HR_ATTENDANCE_POLICY_UPDATE', 'hr_attendance_policy', null, { new_data: req.body });
    return success(res, {}, 'Policy saved');
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/holidays', requirePermission('hr.attendance.mark_self'), async (req, res) => {
  try {
    const year = /^\d{4}$/.test(req.query.year || '') ? req.query.year : new Date().getFullYear();
    const rows = await query(
      'SELECT * FROM client_hr_holidays WHERE org_id=? AND YEAR(holiday_date)=? ORDER BY holiday_date',
      [req.user.org_id, year]);
    return success(res, { holidays: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/holidays', requirePermission('hr.attendance.policy_manage'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const { holiday_date, name, applies_to_departments = null } = req.body;
    if (!holiday_date || !name) return error(res, 'holiday_date and name required', 400);
    const r = await query(
      'INSERT INTO client_hr_holidays (org_id, holiday_date, name, applies_to_departments) VALUES (?,?,?,?)',
      [req.user.org_id, holiday_date, name, applies_to_departments ? JSON.stringify(applies_to_departments) : null]);
    return success(res, { id: r.insertId }, 'Holiday added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/holidays/:id', requirePermission('hr.attendance.policy_manage'), async (req, res) => {
  try {
    const r = await query('DELETE FROM client_hr_holidays WHERE id=? AND org_id=?', [req.params.id, req.user.org_id]);
    if (!r.affectedRows) return error(res, 'Not found', 404);
    return success(res, {}, 'Holiday removed');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
