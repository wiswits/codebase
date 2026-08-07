'use strict';
/*
 * OWNER GOVERNANCE meta-switch (CONTROL_PLANE §4). The platform (owner) decides,
 * per org, which control dimensions the org's own ADMIN may self-serve:
 *   modules · features · menu · roles
 *
 * Stored as per-org rows in client_feature_flags under keys
 * `platform.admin_can.<dim>` — reusing the same override table the rest of the
 * control plane resolves through. DEFAULT is ALLOWED (no row → self-serve), so
 * every existing org keeps full control and nothing changes until an owner
 * explicitly locks a dimension (is_enabled=0 → "Managed by WisWits", read-only).
 *
 * Fail-OPEN to the default (allowed): a DB blip must never lock an admin out of
 * their own settings. Locking is an explicit owner action, never an accident.
 */
const { queryOne } = require('../../config/db');

const DIMENSIONS = ['modules', 'features', 'menu', 'roles', 'fields'];
const flagKey = (dim) => `platform.admin_can.${dim}`;

async function adminCan(orgId, dim) {
  if (!DIMENSIONS.includes(dim)) return true;
  try {
    const row = await queryOne(
      'SELECT is_enabled FROM client_feature_flags WHERE org_id=? AND feature_key=? LIMIT 1',
      [orgId, flagKey(dim)]);
    if (!row) return true;                 // no row → default self-serve
    return Number(row.is_enabled) === 1;   // explicit 0 → locked
  } catch { return true; }                 // fail-open: never break settings
}

async function governanceFor(orgId) {
  const out = {};
  for (const d of DIMENSIONS) out[d] = await adminCan(orgId, d);
  return out;
}

module.exports = { adminCan, governanceFor, DIMENSIONS, flagKey };
