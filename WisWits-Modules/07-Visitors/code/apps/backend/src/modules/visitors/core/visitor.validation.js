'use strict';
const Joi = require('joi');

// The register's three states. Both transitions out of checked_in are terminal:
// there is no re-open, no undo, no delete. Kept as a plain allowlist rather than
// a MySQL ENUM so the column and the code can never drift apart silently.
const STATUSES = ['checked_in', 'checked_out', 'cancelled'];

// visitor_type stays free text (VARCHAR 50) to match the column and to survive
// whatever a school already has on file. The UI offers the common six; it does
// not restrict what may be stored.
const COMMON_VISITOR_TYPES = ['guest', 'parent', 'vendor', 'staff', 'student', 'other'];

const checkInSchema = Joi.object({
  visitorName: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Visitor name is required.',
    'string.max': 'Visitor name cannot exceed 150 characters.',
  }),
  purpose: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Purpose is required.',
    'string.max': 'Purpose cannot exceed 255 characters.',
  }),
  hostId: Joi.number().integer().positive().required().messages({
    'any.required': 'A valid host ID is required.',
    'number.base': 'A valid host ID is required.',
    'number.positive': 'A valid host ID is required.',
  }),
  visitorPhone: Joi.string().trim().max(30).allow('', null),
  visitorEmail: Joi.string().trim().email({ tlds: false }).max(150).allow('', null).messages({
    'string.email': 'Visitor email is invalid.',
  }),
  visitorType: Joi.string().trim().max(50).allow('', null),
  hostName: Joi.string().trim().max(150).allow('', null),
});

const visitorIdParams = Joi.object({
  visitorId: Joi.number().integer().positive().required().messages({
    'number.base': 'Visitor ID must be a positive integer.',
    'number.positive': 'Visitor ID must be a positive integer.',
  }),
});

const listQuery = Joi.object({
  search: Joi.string().trim().max(150).allow(''),
  status: Joi.string().valid(...STATUSES),
  visitorType: Joi.string().trim().max(50).allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  STATUSES,
  COMMON_VISITOR_TYPES,
  checkInSchema,
  visitorIdParams,
  listQuery,
};
