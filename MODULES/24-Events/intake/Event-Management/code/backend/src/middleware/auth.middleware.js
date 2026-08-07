const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication middleware (Engineering Standards §14).
 *
 * This repository did not yet contain an authentication mechanism, so this
 * is a minimal, self-contained JWT verifier. It expects an
 * `Authorization: Bearer <token>` header and a token payload shaped like:
 *
 *   { sub: <userId>, orgId: <tenantId>, roles: [...], permissions: [...] }
 *
 * IMPORTANT: If WisWits already has (or later introduces) a canonical
 * authentication module elsewhere in the system, this middleware should be
 * replaced with that implementation rather than run alongside it. Module
 * developers must not maintain a second, independent auth system
 * long-term (Engineering Standards §14).
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token.');
  }

  if (!payload || !payload.sub || !payload.orgId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Token payload is missing required claims.');
  }

  req.user = {
    id: payload.sub,
    orgId: payload.orgId,
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
  };

  next();
});

module.exports = authenticate;
