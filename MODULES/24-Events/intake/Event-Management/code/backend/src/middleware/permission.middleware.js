const AppError = require('../utils/AppError');

/**
 * Permission-based authorization middleware (Engineering Standards §15).
 * Roles are never hardcoded in route/controller logic; routes declare the
 * *permission* they require, and this checks it against the authenticated
 * user's resolved permission set.
 *
 * @param {string} permission - a value from constants/permissions.js
 */
function requirePermission(permission) {
  return function permissionCheck(req, res, next) {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.');
    }

    const hasPermission = req.user.permissions.includes(permission);
    if (!hasPermission) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You do not have permission to perform this action.'
      );
    }

    next();
  };
}

module.exports = requirePermission;
