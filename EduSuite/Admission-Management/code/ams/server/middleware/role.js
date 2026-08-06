const ApiError = require('../utils/ApiError');

/**
 * Role-based access control. Usage: authorize('admin', 'admission_officer')
 * Staff-facing screens are role-gated per NFR Access control.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

module.exports = { authorize };
