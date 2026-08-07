const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { rejectOrgIdInPayload } = require('../../middleware/tenant');
const { success, error } = require('../../utils/response');
const { buildSet } = require('../../utils/sqlBuild');
const { audit } = require('../../utils/audit');
const { employeeFor } = require('./shared');

/*
 * CMS — content work assignments (hr-cms module, Step 3).
 * assigned → in_progress → submitted → approved (overdue set by a future sweep).
 * Assignee transitions their own status; everything else needs cms.assign.
 */

router.use(authenticate);

const SCOPE_TABLES = { topic: 'client_cms_topics', chapter: 'client_cms_chapters', subject: 'client_cms_subjects' };

router.post('/', requirePermission('cms.assign'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { assignee_employee_id, scope_type, scope_id, content_type_id, due_date = null, priority = 'p1', instructions = null } = req.body;
    if (!assignee_employee_id || !scope_type || !scope_id || !content_type_id) {
      return error(res, 'assignee_employee_id, scope_type, scope_id, content_type_id required', 400);
    }
    if (!SCOPE_TABLES[scope_type]) return error(res, 'scope_type must be topic | chapter | subject', 400);
    if (!['p0', 'p1', 'p2'].includes(priority)) return error(res, 'priority must be p0 | p1 | p2', 400);
    const assignee = await queryOne("SELECT id FROM client_hr_employees WHERE id=? AND org_id=? AND status<>'exited'", [assignee_employee_id, orgId]);
    if (!assignee) return error(res, 'Assignee not found', 404);
    const scope = await queryOne(`SELECT id FROM ${SCOPE_TABLES[scope_type]} WHERE id=? AND org_id=?`, [scope_id, orgId]);
    if (!scope) return error(res, `${scope_type} not found`, 404);
    const ctype = await queryOne('SELECT id FROM client_cms_types WHERE id=? AND org_id=? AND is_active=1', [content_type_id, orgId]);
    if (!ctype) return error(res, 'content type not found', 404);
    const assigner = await employeeFor(orgId, req.user.user_id);
    const r = await query(
      `INSERT INTO client_cms_assignments (org_id, assignee_employee_id, assigned_by, scope_type, scope_id, content_type_id, due_date, priority, instructions)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [orgId, assignee.id, assigner ? assigner.id : 0, scope_type, scope.id, ctype.id, due_date, priority, instructions]);
    await audit(req, 'CMS_ASSIGN', 'cms_assignment', r.insertId, { new_data: { assignee_employee_id, scope_type, scope_id } });
    return success(res, { id: r.insertId }, 'Assigned', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// My queue
router.get('/me', requirePermission('cms.view'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp) return success(res, { assignments: [] });
    const params = [orgId, emp.id];
    let statusClause = '';
    if (req.query.status) { statusClause = 'AND ag.status=?'; params.push(req.query.status); }
    const rows = await query(
      `SELECT ag.*, ct.type_key, ct.label type_label,
              t.asset_code topic_code, t.name topic_name, c.name chapter_name
       FROM client_cms_assignments ag
       LEFT JOIN client_cms_types ct ON ct.id=ag.content_type_id AND ct.org_id=ag.org_id
       LEFT JOIN client_cms_topics t ON ag.scope_type='topic' AND t.id=ag.scope_id AND t.org_id=ag.org_id
       LEFT JOIN client_cms_chapters c ON ag.scope_type='chapter' AND c.id=ag.scope_id AND c.org_id=ag.org_id
       WHERE ag.org_id=? AND ag.assignee_employee_id=? ${statusClause}
       ORDER BY FIELD(ag.priority,'p0','p1','p2'), ag.due_date IS NULL, ag.due_date`,
      params);
    return success(res, { assignments: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Org list (assigners)
router.get('/', requirePermission('cms.assign'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const where = ['ag.org_id=?'];
    const params = [orgId];
    if (req.query.status) { where.push('ag.status=?'); params.push(req.query.status); }
    if (req.query.assignee_employee_id) { where.push('ag.assignee_employee_id=?'); params.push(req.query.assignee_employee_id); }
    const rows = await query(
      `SELECT ag.*, e.full_name assignee_name, ct.type_key, ct.label type_label
       FROM client_cms_assignments ag
       JOIN client_hr_employees e ON e.id=ag.assignee_employee_id AND e.org_id=ag.org_id
       LEFT JOIN client_cms_types ct ON ct.id=ag.content_type_id AND ct.org_id=ag.org_id
       WHERE ${where.join(' AND ')}
       ORDER BY FIELD(ag.priority,'p0','p1','p2'), ag.due_date IS NULL, ag.due_date LIMIT 500`,
      params);
    return success(res, { assignments: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Assignee: move own assignment forward (optionally link the created asset)
router.patch('/:id/status', requirePermission('cms.view'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const ag = await queryOne('SELECT * FROM client_cms_assignments WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!ag) return error(res, 'Not found', 404);
    const emp = await employeeFor(orgId, req.user.user_id);
    if (!emp || emp.id !== ag.assignee_employee_id) return error(res, 'Not your assignment', 403);
    const { status, asset_id = null } = req.body;
    if (!['in_progress', 'submitted'].includes(status)) return error(res, "status must be 'in_progress' or 'submitted'", 400);
    if (asset_id != null) {
      const asset = await queryOne('SELECT id FROM client_cms_assets WHERE id=? AND org_id=? AND created_by=?', [asset_id, orgId, emp.id]);
      if (!asset) return error(res, 'asset not found or not yours', 404);
    }
    await query(
      'UPDATE client_cms_assignments SET status=?, asset_id=COALESCE(?, asset_id) WHERE id=? AND org_id=?',
      [status, asset_id, ag.id, orgId]);
    return success(res, {}, 'Assignment updated');
  } catch (e) { return error(res, e.message, 500); }
});

// Assigner: edit / approve / reassign priority & dates
router.patch('/:id', requirePermission('cms.assign'), rejectOrgIdInPayload, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const ag = await queryOne('SELECT id FROM client_cms_assignments WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!ag) return error(res, 'Not found', 404);
    const sets = [], vals = [];
    if (req.body.status !== undefined) {
      if (!['assigned', 'in_progress', 'submitted', 'approved', 'overdue'].includes(req.body.status)) return error(res, 'invalid status', 400);
      sets.push('status=?'); vals.push(req.body.status);
    }
    const extra = buildSet(['due_date', 'priority', 'instructions'], req.body);
    if (extra.clause) { sets.push(extra.clause); vals.push(...extra.values); }
    if (!sets.length) return error(res, 'nothing to update', 400);
    await query(`UPDATE client_cms_assignments SET ${sets.join(', ')} WHERE id=? AND org_id=?`, [...vals, ag.id, orgId]);
    return success(res, {}, 'Assignment updated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
