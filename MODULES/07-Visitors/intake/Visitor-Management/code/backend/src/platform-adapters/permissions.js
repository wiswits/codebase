/**
 * LOCAL INTEGRATION ADAPTER
 *
 * Production:
 * Replace with WisWits's shared requirePermission(permission).
 *
 * We deliberately DO NOT maintain a local permission catalog here.
 *
 * Routes still declare the exact permission string they require,
 * making them easy to connect to the host platform.
 */

export function requirePermission(permission) {
  if (!permission || typeof permission !== "string") {
    throw new Error("Permission string is required.");
  }

  return function localPermissionAdapter(req, res, next) {
    // Local integration environment only.
    //
    // Authentication context must exist before permission evaluation.
    if (!req.user?.id || !req.user?.org_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // The real platform permission catalog is unavailable locally.
    // Therefore this adapter does NOT pretend to authorize roles.
    req.requiredPermission = permission;

    next();
  };
}