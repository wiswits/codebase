const AppError = require('../utils/AppError');

/**
 * Tenant context middleware (Engineering Standards §16).
 *
 * Tenant identity always comes from the authenticated user (set by
 * auth.middleware.js), never from the request body, query string, or route
 * params. This must run after `authenticate`.
 */
function tenantContext(req, res, next) {
  if (!req.user || !req.user.orgId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Tenant context requires an authenticated user.');
  }

  req.tenant = { orgId: req.user.orgId };
  next();
}

module.exports = tenantContext;
