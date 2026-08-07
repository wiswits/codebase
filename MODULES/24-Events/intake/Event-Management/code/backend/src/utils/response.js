/**
 * Standard API response helpers (Engineering Standards §22, §26).
 *
 * Success: { success: true, data: {} }
 * Failure: { success: false, error: { code, message, details? } }
 */

function success(res, data = {}, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta !== undefined) {
    body.meta = meta;
  }
  return res.status(statusCode).json(body);
}

function error(res, statusCode, code, message, details = undefined) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) {
    body.error.details = details;
  }
  return res.status(statusCode).json(body);
}

module.exports = { success, error };
