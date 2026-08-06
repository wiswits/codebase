const { fail } = require("../utils/response");

// Every write action is server-side role-checked (PRD section 9),
// not just hidden in the UI. Usage: requireRole("admin", "teacher")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.currentUser) {
      return fail(res, "Not authenticated", 401);
    }
    if (!allowedRoles.includes(req.currentUser.role)) {
      return fail(res, `Forbidden: requires role ${allowedRoles.join(" or ")}`, 403);
    }
    next();
  };
}

module.exports = { requireRole };
