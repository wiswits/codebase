/**
 * studentObservations.repository.js  (Jatin's portion)
 *
 * Owner: Jatin
 * Scope: list query (search/filter/pagination/visibility), and the update
 *        query used by the controlled edit flow.
 *
 * Neha owns the repository foundation (insert for create, findById for
 * get-by-id, base mapping helpers). This file is written to be merged into
 * that foundation file rather than replacing it.
 *
 * TODO: Integrate with Neha's existing service/repository foundation.
 * TODO: Confirm the actual shared DB helper import path used by the repo
 *       (this assumes a platform module exporting { query, withTransaction }).
 */

'use strict';

const { query } = require('../../shared/db'); // TODO: confirm real shared DB helper path

const TABLE = 'client_student_observations';

/**
 * Builds the SQL WHERE clause + params that enforce tenant isolation and
 * role-scoped visibility (Section 29 of the contract).
 *
 * org_id is ALWAYS enforced, regardless of role, per Section 35 (tenant
 * isolation) — never trust a frontend-supplied organizationId.
 *
 * Role handling:
 * - principal: full visibility within own org (no extra restriction)
 * - coordinator: broader visibility per platform permission grant
 * - teacher / default: own-authored records only, until class-scope
 *   assignment data is available (see TODO below) — this is a deliberately
 *   conservative (fail-closed) default rather than over-granting access.
 *
 * TODO: "applicable class scoped observations" for teachers requires a
 * class/teacher assignment relationship that is not defined anywhere in
 * this contract (likely a platform table such as client_class_teachers,
 * owned by Khushboo / the platform team). Until that join is confirmed,
 * teachers only see their own-authored records here. Do not widen this to
 * "all class_school records" as a placeholder — that would over-expose
 * sensitive student data.
 *
 * TODO: "coordinator: according to platform permissions" is intentionally
 * vague in the contract. This assumes req.user carries a resolved role,
 * e.g. req.user.role — confirm the actual shared auth-context shape
 * (could be req.user.roles: string[], or a permission-scope object).
 *
 * @param {{ id: number, org_id: number, role?: string }} user - req.user
 * @returns {{ clause: string, params: any[] }}
 */
function buildVisibilityClause(user) {
  const clauses = ['org_id = ?'];
  const params = [user.org_id];

  const role = user.role; // TODO: confirm actual field name/shape from shared auth context

  if (role === 'principal') {
    return { clause: clauses.join(' AND '), params };
  }

  if (role === 'coordinator') {
    // TODO: replace with the real scoped-permission check once the platform
    // grant shape is confirmed. requirePermission(...) upstream already
    // gates route access; this is the row-level narrowing.
    return { clause: clauses.join(' AND '), params };
  }

  // Default / teacher: own-authored only (conservative default).
  clauses.push('author_id = ?');
  params.push(user.id);
  return { clause: clauses.join(' AND '), params };
}

/**
 * Fetches a paginated, filtered, visibility-scoped list of observations.
 *
 * @param {object} user - req.user (must contain id, org_id, role)
 * @param {object} filters - validated output of validateListQuery()
 * @param {number} filters.page
 * @param {number} filters.limit
 * @param {string} [filters.search]
 * @param {number} [filters.studentId]
 * @param {string} [filters.observationType]
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listObservations(user, filters) {
  const { page, limit, search, studentId, observationType } = filters;
  const offset = (page - 1) * limit;

  const { clause: visibilityClause, params: visibilityParams } = buildVisibilityClause(user);

  const whereParts = [visibilityClause];
  const params = [...visibilityParams];

  if (studentId !== undefined) {
    whereParts.push('student_id = ?');
    params.push(studentId);
  }

  if (observationType !== undefined) {
    whereParts.push('observation_type = ?');
    params.push(observationType);
  }

  if (search !== undefined) {
    whereParts.push('content LIKE ?');
    params.push(`%${search}%`);
  }

  const whereClause = whereParts.join(' AND ');

  const countSql = `SELECT COUNT(*) AS total FROM ${TABLE} WHERE ${whereClause}`;
  const countRows = await query(countSql, params);
  const total = Number(countRows[0] && countRows[0].total ? countRows[0].total : 0);

  const listSql = `
    SELECT id, org_id, student_id, author_id, observation_type, content, created_at, updated_at
    FROM ${TABLE}
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await query(listSql, [...params, limit, offset]);

  return { rows, total };
}

/**
 * Fetches a single observation scoped to the caller's org, for use by the
 * controlled-edit flow only (NOT the public GET-by-id endpoint, which is
 * Neha's).
 *
 * @param {number} id
 * @param {number} orgId
 * @returns {Promise<object|null>}
 */
async function findObservationForEdit(id, orgId) {
  const sql = `
    SELECT id, org_id, student_id, author_id, observation_type, content, created_at, updated_at
    FROM ${TABLE}
    WHERE id = ? AND org_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [id, orgId]);
  return rows[0] || null;
}

/**
 * Applies a validated partial update to an observation.
 * Always re-scopes by org_id — never trust a frontend-supplied org context.
 *
 * @param {number} id
 * @param {number} orgId
 * @param {{ observationType?: string, content?: string }} fields
 * @returns {Promise<object|null>} the updated row
 */
async function updateObservation(id, orgId, fields) {
  const sets = [];
  const params = [];

  if (fields.observationType !== undefined) {
    sets.push('observation_type = ?');
    params.push(fields.observationType);
  }

  if (fields.content !== undefined) {
    sets.push('content = ?');
    params.push(fields.content);
  }

  sets.push('updated_at = NOW()');

  const sql = `UPDATE ${TABLE} SET ${sets.join(', ')} WHERE id = ? AND org_id = ?`;
  params.push(id, orgId);

  await query(sql, params);

  return findObservationForEdit(id, orgId);
}

module.exports = {
  buildVisibilityClause,
  listObservations,
  findObservationForEdit,
  updateObservation,
};
