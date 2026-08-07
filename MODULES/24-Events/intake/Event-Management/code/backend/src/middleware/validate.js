const AppError = require('../utils/AppError');

/**
 * Wraps a Joi schema into Express middleware. Validates the given request
 * part (`body`, `params`, or `query`) and replaces it with the validated
 * value (so defaults/coercions from the schema are applied downstream).
 *
 * Engineering Standards §13: backend validation is mandatory and must use
 * the project's approved validation library (Joi).
 *
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'params'|'query'} part
 */
function validate(schema, part = 'body') {
  return function validateRequest(req, res, next) {
    const { error, value } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        message: d.message,
        path: d.path.join('.'),
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed.', details);
    }

    if (part === 'query') {
      // Express 5: `req.query` is defined via a getter that re-derives the
      // query object from the raw query string on EVERY access - it is not
      // a cached/stored value. Both `req.query = value` (silent no-op, no
      // setter) and mutating the object returned by one access (lost on the
      // next access, since a new object is computed) fail to propagate
      // Joi's validated/defaulted values to the controller. Redefining the
      // property itself is the only reliable way to override it for the
      // rest of this request.
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[part] = value;
    }
    next();
  };
}

module.exports = validate;
