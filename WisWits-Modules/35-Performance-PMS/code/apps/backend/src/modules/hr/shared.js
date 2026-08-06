// hr module — shared in-module helpers (not a route file; registry ignores it).
const { queryOne } = require('../../config/db');
// In-handler tier check (e.g. view_all vs view_team scoping), delegating to rbac's
// own userCan so it reads the SAME permission store as the route gate. This file
// used to carry its own copy of the roles query, which read the legacy JSON column
// only — so a Role Builder grant took effect at the gate and not in the handler
// (KI-100's split-brain, in miniature). Scoping on top of the gate, never instead.
const { userCan } = require('../../middleware/rbac');

// The caller's employee profile. client_hr_employees EXTENDS client_users via
// user_id — identity always resolves from the token, never from the payload.
const employeeFor = (orgId, userId) =>
  queryOne('SELECT * FROM client_hr_employees WHERE org_id=? AND user_id=?', [orgId, userId]);

module.exports = { userCan, employeeFor };
