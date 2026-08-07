const User = require("../models/User");
const { fail } = require("../utils/response");

// NOTE (PRD section 11): real authentication/login is not built yet.
// The frontend's dev-only role switcher sends the chosen demo user's id
// in the `x-user-id` header. This middleware resolves that into
// req.currentUser so controllers can apply the same role checks that
// will later run against WisWits's real session/JWT data.
async function attachUser(req, res, next) {
  try {
    const userId = req.header("x-user-id");
    if (!userId) {
      return fail(res, "Missing x-user-id header (dev auth). Pick a demo user first.", 401);
    }
    const user = await User.findById(userId);
    if (!user) {
      return fail(res, "Demo user not found. Pick a valid demo user.", 401);
    }
    req.currentUser = user;
    next();
  } catch (err) {
    return fail(res, "Auth error: " + err.message, 401);
  }
}

module.exports = { attachUser };
