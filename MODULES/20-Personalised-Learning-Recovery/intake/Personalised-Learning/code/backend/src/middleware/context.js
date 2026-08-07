'use strict';

/**
 * Request context middleware.
 *   • Resolves org_id (multi-tenant) — every downstream query must use it.
 *   • Resolves the acting user's role.
 *
 * In the real platform these come from a verified JWT. Here we accept headers
 * (x-org-id, x-user-id, x-role) for local dev, defaulting to a demo org.
 */

function context(req, _res, next) {
  req.ctx = {
    org_id: Number(req.header('x-org-id') || 1),
    user_id: Number(req.header('x-user-id') || 0) || null,
    role: req.header('x-role') || 'teacher',
  };
  next();
}

/**
 * requirePermission — every route must be gated (CONTRACT: "Every route has
 * requirePermission"). Roles allowed to hit the route are passed in.
 */
function requirePermission(...roles) {
  return (req, res, next) => {
    if (roles.length === 0) return next();
    if (roles.includes(req.ctx.role) || req.ctx.role === 'admin') return next();
    return res.status(403).json({ error: 'forbidden', need: roles, have: req.ctx.role });
  };
}

module.exports = { context, requirePermission };
