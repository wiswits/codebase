/**
 * studentObservations.service.js  (Jatin's portion)
 *
 * Owner: Jatin
 * Scope: list business logic (filters/search/pagination/visibility) and
 *        controlled edit validation + update + update-audit call.
 *
 * Neha owns createObservation / getObservationById / the mapper foundation.
 * This file is written to be merged into her service module, not to replace it.
 *
 * TODO: Integrate with Neha's existing service/repository foundation.
 */

'use strict';

const repository = require('./studentObservations.repository');
const {
  validateListQuery,
  validateUpdateBody,
  validateIdParam,
} = require('./studentObservations.validator');

// TODO: confirm actual shared audit helper import path/signature.
// Contract Section 30 conceptual pattern: audit(req, eventName, entityType, entityId)
const audit = require('../../shared/audit');

// TODO: owned by Neha — assumed to export dbRowToApi(row) mapping
// snake_case DB columns to the camelCase canonical API model (Section 20).
const { dbRowToApi } = require('./studentObservations.mapper');

/**
 * Controlled, typed error for this module. The route-level error handler
 * (existing platform convention, Section 40) is expected to translate
 * `code` + `status` into the standard error envelope:
 * { success: false, error: { code, message } }
 *
 * TODO: confirm platform error-handling middleware already does this
 * translation, or if a local next(err) shape is required instead.
 */
class ObservationError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ObservationError';
    this.code = code;
    this.status = status;
  }
}

/**
 * GET /api/v1/student-observations
 * Returns a paginated, filtered, visibility-scoped list.
 *
 * @param {import('express').Request} req - authenticated request (req.user set by shared authenticate middleware)
 * @param {object} rawQuery - req.query
 */
async function listObservations(req, rawQuery) {
  const { valid, errors, data } = validateListQuery(rawQuery);
  if (!valid) {
    throw new ObservationError('VALIDATION_ERROR', errors.join('; '), 400);
  }

  // org_id and role always come from the authenticated context, never from
  // query params (Section 27/35) — requirePermission has already gated route access.
  const user = req.user;

  const { rows, total } = await repository.listObservations(user, data);

  return {
    items: rows.map(dbRowToApi),
    pagination: {
      page: data.page,
      limit: data.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / data.limit),
    },
  };
}

/**
 * Determines whether the authenticated user may edit a given record,
 * beyond the coarse-grained requirePermission('students.observations.edit')
 * route gate (Section 26/29: author, coordinator, or principal may edit).
 *
 * @param {object} user - req.user
 * @param {object} record - existing DB row (from findObservationForEdit)
 * @returns {boolean}
 */
function canEditRecord(user, record) {
  if (record.author_id === user.id) return true;

  const role = user.role; // TODO: confirm actual field name/shape from shared auth context
  if (role === 'principal' || role === 'coordinator') return true;

  return false;
}

/**
 * PATCH /api/v1/student-observations/:id
 * Enforces controlled edit rules before persisting, then calls the
 * existing platform audit helper.
 *
 * @param {import('express').Request} req - authenticated request
 * @param {string|number} idParam - req.params.id
 * @param {object} rawBody - req.body
 */
async function updateObservation(req, idParam, rawBody) {
  const { valid: validId, id } = validateIdParam(idParam);
  if (!validId) {
    throw new ObservationError('VALIDATION_ERROR', 'id must be a positive integer', 400);
  }

  const { valid, errors, data } = validateUpdateBody(rawBody);
  if (!valid) {
    throw new ObservationError('VALIDATION_ERROR', errors.join('; '), 400);
  }

  const user = req.user;

  // Org-scoped lookup: a record from another org is treated as NOT_FOUND,
  // never FORBIDDEN, so we don't leak cross-tenant existence (Section 40).
  const existing = await repository.findObservationForEdit(id, user.org_id);
  if (!existing) {
    throw new ObservationError('NOT_FOUND', 'Observation not found', 404);
  }

  if (!canEditRecord(user, existing)) {
    throw new ObservationError('FORBIDDEN', 'You are not allowed to edit this observation', 403);
  }

  // TODO: if the platform later defines an "editable window" or state-based
  // lock, enforce it here and throw:
  // new ObservationError('OBSERVATION_NOT_EDITABLE', '...', 409)

  const updated = await repository.updateObservation(id, user.org_id, data);

  // Existing platform audit helper only — do not build a second audit system.
  await audit(req, 'student_observation.updated', 'student_observation', id);

  return dbRowToApi(updated);
}

module.exports = {
  listObservations,
  updateObservation,
  canEditRecord,
  ObservationError,
};
