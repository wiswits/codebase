// middleware/auth.js
//
// ⚠️ INTEGRATION POINT. In the full APEX OS platform, identity + permissions
//    come from the shared auth service (`requirePermission`). This module is a
//    thin, replaceable stand-in so the wellbeing routes can enforce role/org
//    scoping today. It reads a signed context off the request; wire it to the
//    real gateway before production.
//
// Every wellbeing request carries: { actor_id, role, org_id }.

const { Forbidden, BadRequest } = require('../modules/wellbeing/wellbeing.errors');

const KNOWN_ROLES = new Set([
  'student', 'teacher', 'counsellor', 'principal', 'parent', 'platform_owner', 'staff',
]);

// Dev/stand-in context extractor. Reads headers set by the platform gateway.
// Replace `extractContext` with the real token verification.
function extractContext(req) {
  const actor_id = Number(req.header('x-wb-actor-id'));
  const role = req.header('x-wb-role');
  const org_id = Number(req.header('x-wb-org-id'));
  if (!actor_id || !role || !org_id) return null;
  if (!KNOWN_ROLES.has(role)) return null;
  return { actor_id, role, org_id };
}

function attachContext(req, _res, next) {
  req.wb = extractContext(req);
  next();
}

// Guard: request must be authenticated.
function requireAuth(req, _res, next) {
  if (!req.wb) return next(new BadRequest('Missing or invalid wellbeing auth context.'));
  next();
}

// Guard: actor's role must be one of `roles`.
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.wb) return next(new BadRequest('Missing wellbeing auth context.'));
    if (!roles.includes(req.wb.role)) {
      return next(new Forbidden(`This action requires role: ${roles.join(' or ')}.`));
    }
    next();
  };
}

module.exports = { attachContext, requireAuth, requireRole, KNOWN_ROLES, extractContext };
