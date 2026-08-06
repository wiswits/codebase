'use strict';
/**
 * planGate — THE single answer to "what may this organization use?"
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Plan gating used to live entirely inside `features.controller.myFeatures`,
 * where it decided which MENU ITEMS an org sees. The routes behind those menu
 * items answered regardless, so a school on the cheapest plan could type the
 * URL (or keep an old bookmark) and use a module it had not bought. A hidden
 * feature whose page still opens is not a locked module; it is a free one.
 *
 * The fix is NOT a second copy of the plan logic in a middleware — two answers
 * to "what can this org see" drift, and when they drift you get the two worst
 * outcomes in the product: a module that vanishes from the menu but still opens
 * (revenue leak), or a module that is shown and then 403s (a support ticket
 * from a paying customer). So the resolution lives here, once, and both the
 * menu (`myFeatures`) and the lock (`middleware/moduleGate.requireModule`)
 * call it. `scripts/prove_module_lock.js` asserts they agree for every module.
 *
 * THE RESOLUTION (unchanged from what myFeatures already implemented)
 * ------------------------------------------------------------------
 *   gating   = per-org `platform.plan_gating` flag — DEFAULT OFF (dormant).
 *   granted  = platform_plan_modules (org's plan)
 *              ∩ platform_institution_modules (org's institution type, minus 'off')
 *   open(M)  = the module has a feature row that is enabled AND
 *              (explicitly add-on granted for this org  OR  M ∈ granted)
 *
 * An explicit OFF (client_feature_flags.is_enabled = 0, or the per-branch
 * override) always wins — it hides the menu item AND locks the route.
 *
 * Every query here is parameterized and scoped by org_id (§6, §17).
 */
const { query, queryOne } = require('../../config/db');

const PLAN_GATING_FLAG = 'platform.plan_gating';
const DEFAULT_PLAN_SLUG = 'starter';
// WisWits HQ. Org 1 is the team's own tenant and sees everything at every
// stage (FEATURE_FLAGS_SPEC §1) — it is never plan-gated.
const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);

// ── cache ──────────────────────────────────────────────────────────────────
// The gate runs on every request of a gated router, so the plan lookup is
// cached per org for 30s (same shape as rbac.js's legacy-flag cache). Writes
// that change entitlement call _cacheClear() so a toggle bites immediately;
// the TTL is the backstop for changes made by another process/script.
const TTL = 30 * 1000;
const planCache = new Map();   // org_id → { at, value }
const _cacheClear = () => { planCache.clear(); moduleMetaCache = null; };

/**
 * The org's commercial entitlement.
 * @returns {{gating:boolean, granted:Set<string>, orgType:string, planSlug:string}}
 */
async function resolveOrgPlan(orgId) {
  const hit = planCache.get(orgId);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const gateRow = await queryOne(
    'SELECT is_enabled FROM client_feature_flags WHERE org_id=? AND feature_key=? LIMIT 1',
    [orgId, PLAN_GATING_FLAG]
  ).catch(() => null);
  const gating = !!(gateRow && gateRow.is_enabled);

  const org = await queryOne('SELECT type FROM client_organizations WHERE id=?', [orgId]).catch(() => null);
  const orgType = (org && org.type) || 'school';
  const planRow = await queryOne(
    `SELECT csp.slug FROM client_subscriptions cs
       JOIN client_subscription_plans csp ON csp.id = cs.plan_id
      WHERE cs.org_id = ? ORDER BY cs.id DESC LIMIT 1`, [orgId]).catch(() => null);
  const planSlug = (planRow && planRow.slug) || DEFAULT_PLAN_SLUG;

  // The COLLATE pair is deliberate: the two registries were created with
  // different default collations and the join fails without it on MariaDB.
  const rows = gating ? await query(
    `SELECT pm.module_key FROM platform_plan_modules pm
       LEFT JOIN platform_institution_modules im
         ON im.module_key COLLATE utf8mb4_unicode_ci = pm.module_key COLLATE utf8mb4_unicode_ci
        AND im.institution_type = ?
      WHERE pm.plan_slug = ? AND pm.granted = 1 AND COALESCE(im.status,'core') <> 'off'`,
    [orgType, planSlug]
  ).catch(() => []) : [];

  const value = { gating, granted: new Set(rows.map((r) => r.module_key)), orgType, planSlug };
  planCache.set(orgId, { at: Date.now(), value });
  return value;
}

/**
 * THE decision. One function, called by the menu per feature row and by the
 * route lock per module. If this returns false the item is not in the sidebar
 * AND the route refuses — by construction, not by convention.
 *
 * @param {{is_enabled:*, explicit_flag:*, module_key:?string}} row
 * @param {Set<string>} granted
 */
const isGranted = (row, granted) => {
  if (!row.is_enabled) return false;                                   // explicit/branch OFF
  if (row.explicit_flag != null && Number(row.explicit_flag) === 1) return true;  // add-on grant
  return !!(row.module_key && granted.has(row.module_key));            // in the plan bundle
};

/**
 * Is this MODULE usable by this org right now? Reads the same three columns
 * myFeatures reads (branch override → org flag → feature default) and runs
 * them through the same `isGranted`.
 *
 * A module is open when ANY of its features resolves open — the mirror of the
 * menu, where that same feature would be the visible entry.
 */
async function isModuleOpen(orgId, moduleKey, granted, schoolId = null) {
  const rows = await query(
    `SELECT f.module_key,
            COALESCE(sf.is_enabled, cf.is_enabled, f.is_default_on) AS is_enabled,
            cf.is_enabled AS explicit_flag
       FROM platform_features f
       LEFT JOIN client_feature_flags cf
              ON cf.feature_key = f.feature_key AND cf.org_id = ?
       LEFT JOIN client_school_feature_flags sf
              ON sf.feature_key = f.feature_key AND sf.school_id = ?
      WHERE f.module_key = ?`,
    [orgId, schoolId, moduleKey]
  );
  // A module with no catalogued feature can only be answered by the bundle.
  if (!rows.length) return granted.has(moduleKey);
  return rows.some((r) => isGranted(r, granted));
}

// ── copy for the refusal message ───────────────────────────────────────────
let moduleMetaCache = null;
async function moduleName(moduleKey) {
  if (!moduleMetaCache) {
    const rows = await query('SELECT module_key, name FROM platform_modules').catch(() => []);
    moduleMetaCache = Object.fromEntries(rows.map((r) => [r.module_key, r.name]));
  }
  return moduleMetaCache[moduleKey] || moduleKey;
}

/**
 * The cheapest plan for this institution type that includes the module — the
 * one thing an administrator actually needs to know. Returns the plan's NAME
 * ("Prakhar"), never its slug: slugs are internal (§1 "never expose technical
 * implementation").
 */
async function requiredPlanName(orgType, moduleKey) {
  try {
    const plans = await query(
      `SELECT csp.slug, csp.name, csp.institution_types, csp.sort_order
         FROM client_subscription_plans csp
         JOIN platform_plan_modules pm
           ON pm.plan_slug COLLATE utf8mb4_unicode_ci = csp.slug COLLATE utf8mb4_unicode_ci
        WHERE csp.is_active = 1 AND pm.module_key = ? AND pm.granted = 1
        ORDER BY csp.sort_order, csp.id`, [moduleKey]);
    if (!plans.length) return null;
    const forType = plans.filter((p) => {
      if (!p.institution_types) return false;
      try {
        const t = typeof p.institution_types === 'string' ? JSON.parse(p.institution_types) : p.institution_types;
        return Array.isArray(t) && t.includes(orgType);
      } catch { return false; }
    });
    return (forType[0] || plans[0]).name || null;
  } catch { return null; }
}

module.exports = {
  resolveOrgPlan, isGranted, isModuleOpen, moduleName, requiredPlanName,
  // Exported so the SuperAdmin add-on screen can REPORT the same two constants
  // it is reasoning about. A screen that retypes 'platform.plan_gating' or
  // 'starter' is a second source of truth waiting to drift from this one.
  PLAN_GATING_FLAG, DEFAULT_PLAN_SLUG, PLATFORM_ORG_ID, _cacheClear,
};
