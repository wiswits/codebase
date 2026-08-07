/**
 * LOCAL INTEGRATION ADAPTER
 *
 * Production:
 * Replace this adapter with WisWits's shared authenticate middleware.
 *
 * WisWits production authentication owns:
 * - access_token cookie
 * - token verification
 * - user resolution
 * - req.user
 *
 * Visitor Management itself does NOT parse or verify JWTs.
 */

export function authenticate(req, res, next) {
  const userId = Number(process.env.LOCAL_USER_ID || 1);
  const orgId = Number(process.env.LOCAL_ORG_ID || 1);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(500).json({
      success: false,
      message: "Invalid LOCAL_USER_ID configuration.",
    });
  }

  if (!Number.isInteger(orgId) || orgId <= 0) {
    return res.status(500).json({
      success: false,
      message: "Invalid LOCAL_ORG_ID configuration.",
    });
  }

  req.user = {
    id: userId,
    org_id: orgId,
  };

  next();
}