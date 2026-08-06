/**
 * Controlled application error carrying an HTTP status code and a stable
 * machine-readable error code, so the central error middleware can translate
 * it into the standard { success:false, error:{code,message} } contract.
 */
class AppError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
