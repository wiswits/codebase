'use strict';
/**
 * Self-contained helpers for the events module (ported from EduSuite via the
 * intake pipeline). Kept module-local so the port does not touch shared
 * middleware. Wiring to the platform's own auth/rbac/db/response/audit is done
 * in the routes/controllers — this file only holds the small utilities the
 * EduSuite code assumed (AppError, asyncHandler, a Joi validate() wrapper).
 */
const { error } = require('../../utils/response');

class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Wraps an async handler; on AppError → error(res, msg, status); else 500.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    const status = err instanceof AppError ? err.statusCode : 500;
    return error(res, err.message, status, err.details || undefined);
  });

/**
 * Joi validate middleware for a request part. Express 5's `req.query` is a
 * getter re-derived on every access, so the validated value must be reinstalled
 * via defineProperty (plain assignment is a silent no-op).
 */
const validate = (schema, part = 'body') => (req, res, next) => {
  const { error: verr, value } = schema.validate(req[part], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (verr) {
    const details = verr.details.map((d) => ({ message: d.message, path: d.path.join('.') }));
    return error(res, 'Request validation failed.', 400, details);
  }
  if (part === 'query') {
    Object.defineProperty(req, 'query', { value, writable: true, configurable: true, enumerable: true });
  } else {
    req[part] = value;
  }
  next();
};

module.exports = { AppError, asyncHandler, validate };
