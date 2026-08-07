/**
 * studentObservations.validator.js
 *
 * Owner: Jatin
 * Scope: query validation for the List endpoint, and body validation for
 *        the Update endpoint (Section 37 of the contract).
 *
 * This file only validates. It does not touch the DB, auth, or permissions.
 * Backend validation here is authoritative; frontend validation is UX-only.
 */

'use strict';

// Canonical observation type values (Section 10 of contract).
const OBSERVATION_TYPES = ['anecdotal', 'class_school'];

// The contract does not define a mandatory content length limit (Section 37).
// This is a conservative technical safety limit only, not a product rule.
// TODO: Confirm final content length limit with Team Lead / DB schema (Khushboo)
// before this is treated as permanent.
const MAX_CONTENT_LENGTH = 5000;
const MAX_SEARCH_LENGTH = 200;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Validates and normalizes list query params: page, limit, search,
 * studentId, observationType.
 *
 * @param {object} query - raw req.query
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
function validateListQuery(query = {}) {
  const errors = [];
  const data = {};

  // page: defaults to 1, must be a positive integer if provided
  let page = 1;
  if (query.page !== undefined && query.page !== '') {
    const parsedPage = Number(query.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      errors.push('page must be a positive integer');
    } else {
      page = parsedPage;
    }
  }
  data.page = page;

  // limit: defaults to 20, capped at MAX_LIMIT to prevent abuse
  let limit = DEFAULT_LIMIT;
  if (query.limit !== undefined && query.limit !== '') {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      errors.push('limit must be a positive integer');
    } else {
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }
  }
  data.limit = limit;

  // search: optional free-text, trimmed, length-capped
  if (query.search !== undefined && query.search !== '') {
    const search = String(query.search).trim();
    if (search.length > MAX_SEARCH_LENGTH) {
      errors.push(`search must be ${MAX_SEARCH_LENGTH} characters or fewer`);
    } else if (search.length > 0) {
      data.search = search;
    }
  }

  // studentId: optional, positive integer
  if (query.studentId !== undefined && query.studentId !== '') {
    const studentId = Number(query.studentId);
    if (!Number.isInteger(studentId) || studentId < 1) {
      errors.push('studentId must be a positive integer');
    } else {
      data.studentId = studentId;
    }
  }

  // observationType: optional, must be one of the canonical values
  if (query.observationType !== undefined && query.observationType !== '') {
    if (!OBSERVATION_TYPES.includes(query.observationType)) {
      errors.push(`observationType must be one of: ${OBSERVATION_TYPES.join(', ')}`);
    } else {
      data.observationType = query.observationType;
    }
  }

  return { valid: errors.length === 0, errors, data };
}

/**
 * Validates the PATCH /student-observations/:id body.
 * At least one editable field must be present.
 *
 * @param {object} body - raw req.body
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
function validateUpdateBody(body = {}) {
  const errors = [];
  const data = {};

  if (body.observationType !== undefined) {
    if (!OBSERVATION_TYPES.includes(body.observationType)) {
      errors.push(`observationType must be one of: ${OBSERVATION_TYPES.join(', ')}`);
    } else {
      data.observationType = body.observationType;
    }
  }

  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      errors.push('content must be a non-empty string');
    } else if (body.content.length > MAX_CONTENT_LENGTH) {
      errors.push(`content must be ${MAX_CONTENT_LENGTH} characters or fewer`);
    } else {
      data.content = body.content.trim();
    }
  }

  if (errors.length === 0 && Object.keys(data).length === 0) {
    errors.push('At least one of observationType or content must be provided');
  }

  return { valid: errors.length === 0, errors, data };
}

/**
 * Validates the :id route param as a positive integer.
 * @param {string|number} idParam
 * @returns {{ valid: boolean, id: number|null }}
 */
function validateIdParam(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return { valid: false, id: null };
  }
  return { valid: true, id };
}

module.exports = {
  validateListQuery,
  validateUpdateBody,
  validateIdParam,
  OBSERVATION_TYPES,
  MAX_CONTENT_LENGTH,
};
