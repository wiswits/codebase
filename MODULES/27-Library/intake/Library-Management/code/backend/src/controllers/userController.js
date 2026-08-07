const User = require("../models/User");
const { ok, fail } = require("../utils/response");

// GET /api/users/demo-users
// Public (no auth) - powers the dev-only role switcher on the frontend.
// This entire endpoint goes away once real WisWits login is integrated (PRD 11).
async function demoUsers(req, res) {
  try {
    const users = await User.find({ orgId: "demo-school" }).sort({ role: 1, name: 1 });
    return ok(res, "Demo users fetched", users);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

module.exports = { demoUsers };
