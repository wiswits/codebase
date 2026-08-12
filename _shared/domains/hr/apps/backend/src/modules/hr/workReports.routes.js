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
 * HR — daily work reports (hr-cms module, Step 3). The module's thesis:
 * the employee writes narrative; the SYSTEM writes numbers. auto_metrics is
 * computed here, server-side, from client_cms_assets + client_cms_review_log +
 * client_hr_attendance scoped to (org, employee, report_date). Any
 * client-supplied auto_metrics is stripped UNCONDITIONALLY — never merged.
 */

router.use(authenticate);

// ── the coupling payoff: system-computed metrics ──
async function computeAutoMetrics(orgId, employeeId, reportDate) {
  const [created, submitted, verdicts, topics, reviews, att] = await Promise.all([
    queryOne(
      'SELECT COUNT(*) n FROM client_cms_assets WHERE org_id=? AND created_by=? AND DATE(created_at)=?',
      [orgId, employeeId, reportDate]),
    queryOne(
      'SELECT COUNT(*) n FROM client_cms_assets WHERE org_id=? AND submitted_by=? AND DATE(submitted_at)=?',
      [orgId, employeeId, reportDate]),
    queryOne(
      `SELECT SUM(l.action='approve') approved, SUM(l.action IN ('request_changes','reject')) sent_back
       FROM client_cms_review_log l JOIN client_cms_assets a ON a.id=l.asset_id AND a.org_id=l.org_id
       WHERE l.org_id=? AND a.created_by=? AND DATE(l.created_at)=?`,
      [orgId, employeeId, reportDate]),
    query(
      `SELECT DISTINCT t.asset_code FROM client_cms_assets a
       JOIN client_cms_topics t ON t.id=a.topic_id AND t.org_id=a.org_id
       WHERE a.org_id=? AND (a.created_by=? OR a.updated_by=?) AND DATE(a.updated_at)=?`,
      [orgId, employeeId, employeeId, reportDate]),
    queryOne(
      'SELECT COUNT(*) n FROM client_cms_review_log WHERE org_id=? AND reviewer_id=? AND DATE(created_at)=?',
      [orgId, employeeId, reportDate]),
    queryOne(
      'SELECT check_in_at, check_out_at, total_hours FROM client_hr_attendance WHERE org_id=? AND employee_id=? AND att_date=?',
      [orgId, employeeId, reportDate]),
  ]);
  return {
    assets_created: Number(created.n || 0),
    assets_submitted_for_review: Number(submitted.n || 0),
    assets_approved: Number(verdicts.approved || 0),
    assets_sent_back: Number(verdicts.sent_back || 0),
    topics_touched: topics.map(t => t.asset_code),
    review_actions_performed: Number(reviews.n || 0),
    attendance: att ? { check_in_at: att.check_in_at, check_out_at: att.check_out_at, total_hours: att.total_hours } : null,
  };
}

// Assets the employee touched that day — the "auto-detected tasks" list.
const touchedAssets = (orgId, employeeId, reportDate) => query(
  `SELECT a.id, a.title, a.status, a.content_type_id, t.asset_code
   FROM client_cms_assets a
   LEFT JOIN client_cms_topics t ON t.id=a.topic_id AND t.org_id=a.org_id
   WHERE a.org_id=? AND (a.created_by=? OR a.updated_by=?) AND DATE(a.updated_at)=?
   ORDER BY a.updated_at DESC LIMIT 20`,
  [orgId, employeeId, employeeId, reportDate]);

const isoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

// ── prefilled draft ──
router.get('/me/today', requirePermission('hr.workreport.submit'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);
    const date = isoDate(req.query.date) ? req.query.date : new Date().toISOString().slice(0, 10);
    const report = await queryOne(
      'SELECT * FROM client_wr_reports WHERE org_id=? AND employee_id=? AND report_date=?', [orgId, emp.id, date]);
    const items = report
      ? await query('SELECT * FROM client_wr_report_items WHERE org_id=? AND report_id=? ORDER BY sort_order, id', [orgId, report.id])
      : [];
    const [auto_metrics, suggested_items] = await Promise.all([
      computeAutoMetrics(orgId, emp.id, date),
      touchedAssets(orgId, emp.id, date),
    ]);
    return success(res, { report, items, auto_metrics, suggested_items });
  } catch (e) { return error(res, e.message, 500); }
});

// ── save draft / submit (upsert by UNIQUE(org, employee, date)) ──
router.post('/', requirePermission('hr.workreport.submit'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return error(res, 'No employee profile', 404);

    // ANTI-TAMPER (the module's thesis): auto_metrics is server-computed ONLY.
    // Strip unconditionally — never merge, never trust. Same for review fields.
    delete req.body.auto_metrics;
    delete req.body.reviewer_id; delete req.body.reviewer_note; delete req.body.reviewed_at;
    delete req.body.submitted_at; delete req.body.employee_id;

    const date = isoDate(req.body.report_date) ? req.body.report_date : new Date().toISOString().slice(0, 10);
    const submitting = req.body.status === 'submitted';
    if (req.body.status !== undefined && !['draft', 'submitted'].includes(req.body.status)) {
      return error(res, "status must be 'draft' or 'submitted'", 400);
    }
    const existing = await queryOne(
      'SELECT id, status FROM client_wr_reports WHERE org_id=? AND employee_id=? AND report_date=?', [orgId, emp.id, date]);
    if (existing && ['submitted', 'reviewed'].includes(existing.status)) {
      return error(res, `Report already ${existing.status} — ask your reviewer to reopen it`, 409);
    }

    const auto = submitting ? JSON.stringify(await computeAutoMetrics(orgId, emp.id, date)) : null;
    const fields = {
      planned_summary: req.body.planned_summary ?? null,
      actual_summary: req.body.actual_summary ?? null,
      blockers: req.body.blockers ?? null,
      tomorrow_plan: req.body.tomorrow_plan ?? null,
      self_rated_hours: req.body.self_rated_hours ?? null,
    };
    let reportId;
    if (existing) {
      await query(
        `UPDATE client_wr_reports SET planned_summary=?, actual_summary=?, blockers=?, tomorrow_plan=?, self_rated_hours=?,
                status=?, submitted_at=${submitting ? 'NOW()' : 'NULL'}, auto_metrics=COALESCE(?, auto_metrics)
         WHERE id=? AND org_id=?`,
        [...Object.values(fields), submitting ? 'submitted' : 'draft', auto, existing.id, orgId]);
      reportId = existing.id;
    } else {
      const r = await query(
        `INSERT INTO client_wr_reports (org_id, employee_id, report_date, planned_summary, actual_summary, blockers, tomorrow_plan,
                self_rated_hours, status, submitted_at, auto_metrics)
         VALUES (?,?,?,?,?,?,?,?,?,${submitting ? 'NOW()' : 'NULL'},?)`,
        [orgId, emp.id, date, ...Object.values(fields), submitting ? 'submitted' : 'draft', auto]);
      reportId = r.insertId;
    }

    if (Array.isArray(req.body.items)) {
      await query('DELETE FROM client_wr_report_items WHERE org_id=? AND report_id=?', [orgId, reportId]);
      let sort = 0;
      for (const it of req.body.items.slice(0, 50)) {
        if (!it || !it.task_title) continue;
        await query(
          `INSERT INTO client_wr_report_items (org_id, report_id, task_title, task_type, linked_asset_id, linked_assignment_id, hours_spent, status, notes, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [orgId, reportId, String(it.task_title).slice(0, 300), it.task_type ?? null, it.linked_asset_id ?? null,
            it.linked_assignment_id ?? null, it.hours_spent ?? null,
            ['done', 'in_progress', 'blocked'].includes(it.status) ? it.status : 'done', it.notes ?? null, sort++]);
      }
    }
    if (submitting) await audit(req, 'HR_WORKREPORT_SUBMIT', 'wr_report', reportId, { new_data: { report_date: date } });
    return success(res, { id: reportId, status: submitting ? 'submitted' : 'draft' }, submitting ? 'Report submitted' : 'Draft saved', existing ? 200 : 201);
  } catch (e) { return error(res, e.message, 500); }
});

// Team review queue: pod scope; org-level callers need view_all for org-wide.
router.get('/team', requirePermission('hr.workreport.view_team'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    const date = isoDate(req.query.date) ? req.query.date : new Date().toISOString().slice(0, 10);
    const params = [orgId, date];
    let podClause = '';
    if (emp && emp.pod_id) { podClause = 'AND e.pod_id=?'; params.push(emp.pod_id); }
    else if (!(await userCan(req.user.user_id, 'hr.employee.view_all', req.user.org_id))) {
      return success(res, { reports: [], scope: 'none' });
    }
    if (req.query.status) { params.push(req.query.status); }
    const rows = await query(
      `SELECT r.*, e.full_name, e.employee_code, e.pod_id
       FROM client_wr_reports r JOIN client_hr_employees e ON e.id=r.employee_id AND e.org_id=r.org_id
       WHERE r.org_id=? AND r.report_date=? ${podClause} ${req.query.status ? 'AND r.status=?' : ''}
       ORDER BY e.full_name`,
      params);
    return success(res, { reports: rows, scope: podClause ? 'pod' : 'org' });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:id', requirePermission('hr.workreport.view_team'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const report = await queryOne('SELECT * FROM client_wr_reports WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!report) return error(res, 'Not found', 404);
    const items = await query('SELECT * FROM client_wr_report_items WHERE org_id=? AND report_id=? ORDER BY sort_order, id', [orgId, report.id]);
    return success(res, { report, items });
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/:id/review', requirePermission('hr.workreport.review'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const report = await queryOne('SELECT * FROM client_wr_reports WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!report) return error(res, 'Not found', 404);
    if (report.status !== 'submitted') return error(res, 'Only submitted reports can be reviewed', 409);
    const { decision, reviewer_note = null } = req.body;
    if (!['reviewed', 'needs_revision'].includes(decision)) return error(res, "decision must be 'reviewed' or 'needs_revision'", 400);
    const caller = await employeeFor(orgId, req.user.user_id);
    if (caller && caller.id === report.employee_id) return error(res, 'You cannot review your own report', 403);
    await query(
      'UPDATE client_wr_reports SET status=?, reviewer_id=?, reviewer_note=?, reviewed_at=NOW() WHERE id=? AND org_id=?',
      [decision, caller ? caller.id : null, reviewer_note, report.id, orgId]);
    await audit(req, 'HR_WORKREPORT_REVIEW', 'wr_report', report.id, { new_data: { decision } });
    return success(res, {}, decision === 'reviewed' ? 'Report reviewed' : 'Revision requested');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
