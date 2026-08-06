const AppError = require('../utils/AppError');
const { error: sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Centralized Express error handler (Engineering Standards §22).
 * Never leaks internal SQL errors, stack traces, or secrets to clients.
 * Must be registered last, after all routes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, stack: err.stack });
    }
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Joi validation errors are handled by the validate() wrapper before they
  // reach here, but guard defensively in case one slips through.
  if (err.isJoi) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed.', err.details);
  }

  // Unknown/unexpected error: log full detail internally, return a generic
  // message externally.
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
}

function notFoundHandler(req, res) {
  return sendError(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`);
}

module.exports = { errorHandler, notFoundHandler };
