'use strict';
/*
 * Student groups — houses, clubs, teams, batches.
 *
 * WHY THEY EXIST. "The football team", "Blue House", "the Olympiad batch" are
 * audiences a school addresses constantly, and none of them is a class or a
 * section. Migration 049 gave them tables and the audience engine can already
 * resolve them; without this, a school could never CREATE one, so the selector
 * offered an empty list forever.
 *
 * WHERE THEY LIVE. In People, beside Students / Teachers / Staff. A group is a
 * group of children, not a feature of Events — and §9 says new surface area
 * goes into an existing module rather than growing the sidebar.
 *
 * PERMISSIONS follow students, because that is what a group is made of:
 * students.view to read, students.edit to change. A teacher can therefore see
 * the house lists they run their lessons around without being able to rewrite
 * them.
 *
 * DELETE IS ARCHIVE. §15 — mark, migrate, remove. A group that is deleted
 * outright takes its membership with it, and an event addressed to it silently
 * loses those recipients with no trace of why.
 */
const { Router } = require('express');
const Joi = require('joi');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const { activeStudent } = require('../../utils/headcount');
const { getActiveSchool, getWriteSchool, pushBranchFilter } = require('../../utils/activeSchool');

const router = Router();
router.use(authenticate);

const KINDS = ['house', 'club', 'team', 'batch', 'group'];

const groupBody = Joi.object({
  name: Joi.string().trim().min(2).max(120).required().messages({
    'string.empty': 'Give the group a name.',
    'string.min': 'The name needs at least 2 characters.',
  }),
  kind: Joi.string().valid(...KINDS).default('group'),
});

// Update carries NO defaults — an absent field on a PATCH means "leave it
// alone", and a default here would rename or re-kind a group nobody touched.
// See tests/update-schemas-carry-no-defaults.test.js.
const updateGroupBody = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  kind: Joi.string().valid(...KINDS),
  status: Joi.string().valid('active', 'archived'),
}).min(1).messages({ 'object.min': 'Nothing to change.' });

const membersBody = Joi.object({
  studentIds: Joi.array().items(Joi.number().integer().positive()).max(2000).required(),
});

const idParams = Joi.object({ id: Joi.number().integer().positive().required() });

const validate = (schema, part = 'body') => (req, res, next) => {
  const { error: verr, value } = schema.validate(req[part], { abortEarly: false, stripUnknown: true, convert: true });
  if (verr) return error(res, verr.details.map((d) => d.message).join(' '), 400);
  if (part === 'params') { req.validatedParams = value; } else { req[part] = value; }
  next();
};

/** The group, if it is ours and on our branch. Every write gates on this. */
async function mustSeeGroup(req) {
  const schoolId = await getActiveSchool(req);
  const conditions = ['id = ?', 'org_id = ?'];
  const params = [req.params.id, req.user.org_id];
  pushBranchFilter(conditions, params, schoolId);
  return queryOne(`SELECT * FROM client_student_groups WHERE ${conditions.join(' AND ')} LIMIT 1`, params);
}

// ── list ────────────────────────────────────────────────────────────────────
router.get('/', requirePermission('students.view'), async (req, res) => {
  try {
    const schoolId = await getActiveSchool(req);
    const conditions = ['g.org_id = ?'];
    const params = [req.user.org_id];
    pushBranchFilter(conditions, params, schoolId, 'g.school_id');
    if (req.query.status !== 'all') conditions.push("g.status = 'active'");

    // The member count composes activeStudent(), so a group does not claim
    // children the school has archived — the predicate seven tickets were
    // filed for missing elsewhere.
    const rows = await query(
      `SELECT g.id, g.name, g.kind, g.status, g.school_id AS schoolId, g.created_at AS createdAt,
              (SELECT COUNT(*) FROM client_student_group_members m
                WHERE m.group_id = g.id AND m.org_id = g.org_id
                  AND ${activeStudent('m.student_id')}) AS memberCount
         FROM client_student_groups g
        WHERE ${conditions.join(' AND ')}
        ORDER BY g.name`, params);
    return success(res, { groups: rows || [] }, 'Groups fetched');
  } catch (e) { logger.error('Groups list:', e); return error(res, e.message, 500); }
});

// ── create ──────────────────────────────────────────────────────────────────
router.post('/', requirePermission('students.edit'), validate(groupBody), async (req, res) => {
  try {
    const schoolId = await getWriteSchool(req);
    const r = await query(
      "INSERT INTO client_student_groups (org_id, school_id, name, kind, status) VALUES (?,?,?,?, 'active')",
      [req.user.org_id, schoolId, req.body.name, req.body.kind]);
    await audit(req, 'GROUP_CREATE', 'student_group', r.insertId, {
      new_data: { name: req.body.name, kind: req.body.kind },
    });
    const group = await queryOne('SELECT id, name, kind, status FROM client_student_groups WHERE id = ?', [r.insertId]);
    return success(res, { group }, 'Group created', 201);
  } catch (e) { logger.error('Group create:', e); return error(res, e.message, 500); }
});

// ── rename / re-kind / archive ──────────────────────────────────────────────
router.patch('/:id', requirePermission('students.edit'), validate(idParams, 'params'), validate(updateGroupBody), async (req, res) => {
  try {
    const existing = await mustSeeGroup(req);
    if (!existing) return error(res, 'Group not found.', 404);

    const cols = { name: 'name', kind: 'kind', status: 'status' };
    const sets = []; const params = [];
    for (const [key, col] of Object.entries(cols)) {
      if (req.body[key] !== undefined) { sets.push(`${col} = ?`); params.push(req.body[key]); }
    }
    if (!sets.length) return success(res, { group: existing }, 'Nothing to change');
    params.push(req.params.id, req.user.org_id);
    await query(`UPDATE client_student_groups SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`, params);
    await audit(req, 'GROUP_UPDATE', 'student_group', req.params.id, { new_data: req.body });
    const group = await queryOne('SELECT id, name, kind, status FROM client_student_groups WHERE id = ?', [req.params.id]);
    return success(res, { group }, 'Group updated');
  } catch (e) { logger.error('Group update:', e); return error(res, e.message, 500); }
});

// ── archive (never a hard delete — §15) ─────────────────────────────────────
router.delete('/:id', requirePermission('students.edit'), validate(idParams, 'params'), async (req, res) => {
  try {
    const existing = await mustSeeGroup(req);
    if (!existing) return error(res, 'Group not found.', 404);
    await query("UPDATE client_student_groups SET status = 'archived' WHERE id = ? AND org_id = ?",
      [req.params.id, req.user.org_id]);
    await audit(req, 'GROUP_ARCHIVE', 'student_group', req.params.id, { new_data: { name: existing.name } });
    // Membership is deliberately kept. An event addressed to this group in the
    // past should still be explicable a term later.
    return success(res, {}, 'Group archived');
  } catch (e) { logger.error('Group archive:', e); return error(res, e.message, 500); }
});

// ── members ─────────────────────────────────────────────────────────────────
router.get('/:id/members', requirePermission('students.view'), validate(idParams, 'params'), async (req, res) => {
  try {
    const existing = await mustSeeGroup(req);
    if (!existing) return error(res, 'Group not found.', 404);
    const rows = await query(
      `SELECT s.id AS studentId, s.admission_number AS admissionNumber,
              CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS name,
              c.name AS className, sec.name AS sectionName
         FROM client_student_group_members m
         JOIN client_students s ON s.id = m.student_id AND s.org_id = m.org_id
         JOIN client_users u ON u.id = s.user_id AND u.org_id = s.org_id
         LEFT JOIN client_enrollments e ON e.student_id = s.id AND e.org_id = s.org_id AND e.status = 'active'
         LEFT JOIN client_sections sec ON sec.id = e.section_id AND sec.org_id = s.org_id
         LEFT JOIN client_classes c ON c.id = sec.class_id AND c.org_id = s.org_id
        WHERE m.org_id = ? AND m.group_id = ?
          AND ${activeStudent('m.student_id')}
        ORDER BY c.name, sec.name, u.first_name`,
      [req.user.org_id, req.params.id]);
    return success(res, { members: rows || [] }, 'Members fetched');
  } catch (e) { logger.error('Group members:', e); return error(res, e.message, 500); }
});

/*
 * The membership is REPLACED in one call, in a transaction.
 *
 * A school edits a team sheet as one decision. Delete-then-insert without a
 * transaction would leave the group EMPTY if the insert failed — and an empty
 * group is not a visible failure: the next event addressed to it simply reaches
 * nobody, silently.
 */
router.put('/:id/members', requirePermission('students.edit'), validate(idParams, 'params'), validate(membersBody), async (req, res) => {
  try {
    const existing = await mustSeeGroup(req);
    if (!existing) return error(res, 'Group not found.', 404);

    const wanted = [...new Set(req.body.studentIds)];
    // Only children who are genuinely ours. An id from another org, or one that
    // no longer exists, is dropped here rather than becoming a member row that
    // resolves to nobody.
    const ours = wanted.length
      ? await query(
        `SELECT id FROM client_students
          WHERE org_id = ? AND id IN (${wanted.map(() => '?').join(',')})`,
        [req.user.org_id, ...wanted])
      : [];
    const valid = (ours || []).map((r) => r.id);

    await transaction(async (tx) => {
      await tx.query('DELETE FROM client_student_group_members WHERE org_id = ? AND group_id = ?',
        [req.user.org_id, req.params.id]);
      for (const studentId of valid) {
        await tx.query(
          'INSERT INTO client_student_group_members (org_id, group_id, student_id) VALUES (?,?,?)',
          [req.user.org_id, req.params.id, studentId]);
      }
    });

    await audit(req, 'GROUP_MEMBERS_SET', 'student_group', req.params.id, {
      new_data: { name: existing.name, members: valid.length },
    });
    return success(res, { members: valid.length, ignored: wanted.length - valid.length }, 'Members saved');
  } catch (e) { logger.error('Group members set:', e); return error(res, e.message, 500); }
});

module.exports = router;
