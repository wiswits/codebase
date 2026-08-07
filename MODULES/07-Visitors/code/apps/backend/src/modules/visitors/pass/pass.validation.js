'use strict';
const Joi = require('joi');

const issuePassSchema = Joi.object({
  // Optional. Upstream accepted any date at all and its UI told the operator
  // "leave empty to use the backend's default expiration" — there was no such
  // default, and a date in the past was accepted happily. A pass that has
  // already expired is not worth printing, so the past is refused here.
  expiresAt: Joi.date().iso().greater('now').allow(null).messages({
    'date.base': 'expiresAt must be a valid date.',
    'date.format': 'expiresAt must be a valid date.',
    'date.greater': 'A pass cannot expire in the past.',
  }),
});

const visitorIdParams = Joi.object({
  visitorId: Joi.number().integer().positive().required().messages({
    'number.base': 'Visitor ID must be a positive integer.',
    'number.positive': 'Visitor ID must be a positive integer.',
  }),
});

module.exports = { issuePassSchema, visitorIdParams };
