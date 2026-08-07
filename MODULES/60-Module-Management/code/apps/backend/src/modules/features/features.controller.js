const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { getActiveSchool } = require('../../utils/activeSchool');
const { audit } = require('../../utils/audit');
const { adminCan, governanceFor, DIMENSIONS, flagKey } = require('./governance');
// ONE resolution for "what may this org use" — shared with the route lock
// (middleware/moduleGate.js). See planGate.js for why it is not duplicated.
const {
  resolveOrgPlan, isGranted, _cacheClear: clearPlanCache,
  PLAN_GATING_FLAG, DEFAULT_PLAN_SLUG,
} = require('./planGate');

/*
 * HIDDEN FEATURES (migration 027). Some features are per-org gates but must
 * never be sidebar entries — the Report-an-Issue widget is chrome mounted in
 * DashLayout, plan-gating and the admin-can.* switches are policy. They are
 * catalogued so they can be SEEN and toggled in /superadmin/features, and
 * `is_hidden = 1` keeps them out of every MENU.
 *
 * The column is checked once and cached, so this file keeps working on a
 * database where migration 027 has not been applied yet (deploys and migrations
 * are separate steps here — code must never assume the migration ran first).
 */
let hiddenColumn = null;                 // null = not checked yet
async function menuFilter() {
  if (hiddenColumn === null) {
    try {
      const r = await queryOne(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE table_schema = DATABASE() AND table_name = 'platform_features'
            AND column_name = 'is_hidden'`);
      hiddenColumn = !!(r && r.n);
    } catch { hiddenColumn = false; }
  }
  return hiddenColumn ? ' AND f.is_hidden = 0' : '';
}

// Map custom roles to base roles for menu rendering
const BASE_ROLE_MAP = {
  'system_admin': 'owner',
  'super_admin':  'owner',
  'owner':        'owner',
  'admin':        'admin',
  'sub_admin':    'admin',
  'principal':    'admin',
  'hod':          'admin',
  'coordinator':  'admin',
  'teacher':      'teacher',
  'student':      'student',
  'parent':       'parent',
  // WisWits Academics Team — get their OWN scoped menu (Content Studio), never admin
  'content_dev':  'content_dev',
  'content_lead': 'content_lead',
};

// Master accounts see ALL features regardless of status.
// Phase 2B (009): the list is now DB-backed (platform_superusers) but SAFELY —
// DEFAULT_MASTER is a synchronous hardcoded floor and the DB layer is UNION-only
// (can add a superuser, never remove one), with fail-safe fallback. So behavior
// is identical to the old array until someone adds a row.
const DEFAULT_MASTER = ['master@wiswits.com', 'ak@wiswits.com', 'cofounder@wiswits.com', 'wiswits.official@gmail.com'];
let masterSet = new Set(DEFAULT_MASTER);
async function refreshMasters() {
  try {
    const rows = await query('SELECT email FROM platform_superusers');
    if (Array.isArray(rows)) {
      const next = new Set(DEFAULT_MASTER);
      for (const r of rows) if (r.email) next.add(String(r.email).toLowerCase());
      masterSet = next;
    }
  } catch { /* table absent / blip → keep defaults */ }
}
refreshMasters();
setInterval(refreshMasters, 5 * 60 * 1000).unref?.();
const isMasterEmail = (email) => masterSet.has(String(email || '').toLowerCase());
// SECURITY: an email match alone is an identity bypass — any tenant user who
// registers a matching address would get master menus, view-as, and plan-gating
// bypass. Master status therefore also requires membership in the WisWits
// platform org (org 1). Customer-org users can NEVER be masters.
const isMasterUser = (user) =>
  Number(user && user.org_id) === PLATFORM_ORG_ID && isMasterEmail(user && user.email);

const getBaseRole = (slug) => BASE_ROLE_MAP[slug] || 'admin';

// Special orgs (FEATURE_FLAGS_SPEC §1): platform HQ sees every stage; the pilot
// org is where 'pilot' features dogfood before beta/live.
// WisWits internal. Was a hardcoded `1` here while planGate.js and
// libraryScope.js both read PLATFORM_ORG_ID from the environment — three
// definitions of the same thing, two of which would move together and one of
// which would not. §17 says never hardcode an organization id; this is why.
const { PLATFORM_ORG_ID, LIBRARY_FLAG, _cacheClear: clearLibraryCache } = require('../qbank/libraryScope');
const PILOT_ORG_ID = 40;     // WISWITS QA LAB

// Principal-tier roles share the admin feature rows (base_role='admin') but run
// in the SCHOOL-scoped /principal namespace with NO money/business control.
// Per the IA (LOCKED): Principal cannot see Fees, Payments, Billing, CRM,
// WhatsApp, Roles, Org Settings, Branding, Staff, or ERP/HRMS/Org tools.
const PRINCIPAL_TIER = new Set(['principal', 'vice_principal', 'hod', 'coordinator', 'academic_coordinator']);
const PRINCIPAL_HIDDEN_KEYS = new Set([
  'admin.fees', 'admin.payments.online', 'admin.billing',
  'admin.crm', 'admin.whatsapp',
  'admin.roles', 'admin.settings',
  'admin.staff', 'admin.principals', 'admin.institutions',
  'admin.departments', 'admin.alerts', 'admin.broadcast',
  'mod15.feegateway.admin', 'mod15.feereminder.admin',
  'mod15.biometric.admin', 'mod15.payroll.admin',
]);

const myFeatures = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const roleSlug = req.user.role_slug || 'admin';
    const isMaster = isMasterUser(req.user);

    // ── IS THIS PERSON DRIVING A BUS TODAY? ────────────────────────────────
    // The live-bus screen (/bus-driver) had no sidebar entry, no link and no
    // catalogue row anywhere in the product: the ONLY way to reach the one
    // screen a driver needs was to type its URL. A school could add a driver,
    // link their login and put them on a route — and the driver still had no
    // way in. A fully built feature, unreachable.
    //
    // It cannot be answered from the role, and that was the trap. A school
    // names the role whatever it likes ("Driver", "Bus Staff", or none at all —
    // one org put their driver on the plain Admin role), so no list of role
    // slugs is ever going to be right. The DATA holds the truth: a driver is
    // whoever a route points at. Asked here because the sidebar is built from
    // this one response — no extra request, and it re-answers on every load, so
    // assigning or clearing a route changes the driver's menu without them
    // signing out.
    //
    // Computed BEFORE the branches and returned by all of them: this function
    // has three exits, and the first attempt set it on only one, so the master
    // path silently kept the old behaviour. A value every exit must carry does
    // not belong inside any single branch.
    let isBusDriver = false;
    try {
      const d = await queryOne(
        "SELECT 1 AS x FROM client_transport_routes WHERE org_id=? AND driver_user_id=? AND status='active' LIMIT 1",
        [orgId, req.user.user_id]);
      isBusDriver = !!d;
    } catch { isBusDriver = false; }   // never let this break the menu

    // ── VIEW-AS (SuperAdmin/master role switcher) ──────────────────────────
    // A master can preview any base role's menu, including `private` pages
    // (which normal users never receive). Items keep their status so the UI
    // can badge coming_soon ("SOON") and private ("Private").
    const VALID_ROLES = ['owner', 'admin', 'teacher', 'student', 'parent'];
    const asRole = VALID_ROLES.includes(req.query.as) ? req.query.as : null;
    if (isMaster && asRole) {
      const feats = await query(
        `SELECT f.feature_key, f.name, f.description, f.icon, f.href,
                f.role, f.status, f.sort_order, f.menu_group,
                COALESCE(cf.is_enabled, f.is_default_on) AS is_enabled
           FROM platform_features f
           LEFT JOIN client_feature_flags cf ON cf.feature_key = f.feature_key AND cf.org_id = ?
          WHERE f.role = ? AND f.status IN ('live','beta','coming_soon','private')
                ${await menuFilter()}
          ORDER BY f.menu_group, f.sort_order, f.name`,
        [orgId, asRole]
      );
      const grouped = {}, order = [];
      for (const f of feats) {
        if (!f.is_enabled) continue;
        const grp = f.menu_group || 'General';
        if (!grouped[grp]) { grouped[grp] = []; order.push(grp); }
        grouped[grp].push({ ...f, is_enabled: true });
      }
      const menu = order.map((name) => ({ name, items: grouped[name] })).filter((g) => g.items.length > 0);
      return success(res, { role: asRole, base_role: asRole, is_master: true, viewing_as: asRole, menu, features: feats, is_bus_driver: false });
    }

    // Master sees ALL roles, all features
    // Normal users see only their base role
    let sqlWhere, sqlParams;
    // Which lifecycle stages this caller may see at all. Set by the stage gate
    // below; a master sees every stage, so nothing is ever hidden from them.
    let visibleStages = null;
    if (isMaster) {
      // Master sees everything across all base roles
      sqlWhere = `WHERE f.role IN ('owner','admin','teacher','student','parent')`;
      sqlParams = [orgId];
    } else {
      const baseRole = getBaseRole(roleSlug);
      // ── STAGE-GATED VISIBILITY (FEATURE_FLAGS_SPEC §1/§5) ──────────────────
      // Everyone sees live/beta/coming_soon. WisWits org 1 (internal HQ) also
      // sees planned + pilot; the QA LAB pilot org also sees pilot. suspended/
      // inactive are hidden from all (kill-switch) — one module's flag never
      // affects another. CLIENTS' view is unchanged.
      const stages = ['live', 'beta', 'coming_soon'];
      if (orgId === PLATFORM_ORG_ID) stages.push('planned', 'pilot');
      else if (orgId === PILOT_ORG_ID) stages.push('pilot');
      visibleStages = stages;
      const stageIn = stages.map(() => '?').join(',');
      // ── DYNAMIC ROLE: if this role has an explicit feature selection
      //    (client_roles.menu_config = JSON array of feature_keys), the menu is
      //    EXACTLY those features — any combination across the whole catalog,
      //    not the base_role's fixed menu. Empty menu_config → base_role (legacy,
      //    so owner/admin/teacher/student/parent stay exactly as before).
      let featureKeys = [];
      try {
        const rr = await queryOne('SELECT menu_config FROM client_roles WHERE org_id=? AND slug=? LIMIT 1', [orgId, roleSlug]);
        const parsed = JSON.parse(rr && rr.menu_config ? rr.menu_config : '[]');
        if (Array.isArray(parsed)) featureKeys = parsed.filter(Boolean);
      } catch { /* malformed menu_config → fall back to base_role */ }
      if (featureKeys.length) {
        sqlWhere = `WHERE f.feature_key IN (${featureKeys.map(() => '?').join(',')}) AND f.status IN (${stageIn})`;
        sqlParams = [orgId, ...featureKeys, ...stages];
      } else {
        sqlWhere = `WHERE f.role = ? AND f.status IN (${stageIn})`;
        sqlParams = [orgId, baseRole, ...stages];
      }
    }

    // ── PER-BRANCH OVERLAY (P1e) — when the caller is scoped to a branch of a
    // multi-branch group, that branch's explicit flag WINS over the org flag.
    // Resolution: branch flag → org flag → feature default. Single-branch orgs +
    // masters (platform org) → getActiveSchool null → no branch join → unchanged.
    const activeSchool = isMaster ? null : await getActiveSchool(req);
    const params = [...sqlParams];
    let branchJoin = '';
    let enabledCoalesce = 'COALESCE(cf.is_enabled, f.is_default_on)';
    if (activeSchool) {
      branchJoin = 'LEFT JOIN client_school_feature_flags sf ON sf.feature_key = f.feature_key AND sf.school_id = ?';
      enabledCoalesce = 'COALESCE(sf.is_enabled, cf.is_enabled, f.is_default_on)';
      params.splice(1, 0, activeSchool); // right after the cf-join org_id param
    }

    const features = await query(
      `SELECT f.feature_key, f.name, f.description, f.icon, f.href,
              f.role, f.status, f.sort_order, f.menu_group, f.module_key,
              ${enabledCoalesce} AS is_enabled,
              cf.is_enabled AS explicit_flag
         FROM platform_features f
         LEFT JOIN client_feature_flags cf ON cf.feature_key = f.feature_key AND cf.org_id = ?
         ${branchJoin}
        ${sqlWhere}
        ${await menuFilter()}
        ORDER BY f.menu_group, f.sort_order, f.name`,
      params
    );

    // ── PLAN GATING (FEATURE_FLAGS_SPEC §3/§5) — DORMANT unless the org opts in
    // via the per-org `platform.plan_gating` flag. When on: a feature shows only
    // if its module is in the org's plan bundle (∩ institution relevance) OR it
    // has an explicit add-on grant (client_feature_flags is_enabled=1). Explicit
    // OFF always hides. When the flag is off (default) → behavior is UNCHANGED.
    //
    // The resolution itself now lives in ./planGate.js, because the ROUTES have
    // to reach the same verdict. Hiding a menu item never stopped anyone typing
    // the URL, so `middleware/moduleGate.requireModule` locks the route using
    // these exact same two values (`granted` + `isGranted`). Two answers to
    // "what may this org use" would drift into either a module that is hidden
    // but open, or one that is shown and then 403s.
    let gatedModules = null;
    if (!isMaster && orgId !== PLATFORM_ORG_ID) {
      const plan = await resolveOrgPlan(orgId);
      if (plan.gating) gatedModules = plan.granted;
    }
    // Visibility: default = is_enabled; when gated, module must be in the bundle
    // unless explicitly add-on'd. One module's gate never affects another.
    const isVisible = (f) => (gatedModules === null ? !!f.is_enabled : isGranted(f, gatedModules));

    // For master, group by role + menu_group
    if (isMaster) {
      const roleSections = {};
      for (const f of features) {
        if (f.status === 'inactive') continue;
        const roleKey = f.role.toUpperCase();
        const grp = f.menu_group || 'General';
        if (!roleSections[roleKey]) roleSections[roleKey] = { role: roleKey, groups: {}, groupOrder: [] };
        if (!roleSections[roleKey].groups[grp]) {
          roleSections[roleKey].groups[grp] = [];
          roleSections[roleKey].groupOrder.push(grp);
        }
        roleSections[roleKey].groups[grp].push({ ...f, is_enabled: !!f.is_enabled });
      }
      const menu = [];
      for (const role of ['OWNER']) {
        if (!roleSections[role]) continue;
        for (const grpName of roleSections[role].groupOrder) {
          menu.push({
            name: `${role} · ${grpName}`,
            items: roleSections[role].groups[grpName].filter(f => f.is_enabled),
          });
        }
      }
      return success(res, {
        role: roleSlug,
        base_role: 'master',
        is_master: true,
        menu: menu.filter(g => g.items.length > 0),
        features,
        is_bus_driver: isBusDriver,
      });
    }

    // Normal user grouping
    const trimPrincipal = PRINCIPAL_TIER.has(roleSlug);
    const grouped = {};
    const groupOrder = [];
    for (const f of features) {
      if (trimPrincipal && PRINCIPAL_HIDDEN_KEYS.has(f.feature_key)) continue;
      const grp = f.menu_group || 'General';
      if (!grouped[grp]) { grouped[grp] = []; groupOrder.push(grp); }
      grouped[grp].push({ ...f, is_enabled: !!f.is_enabled });
    }
    const menu = groupOrder
      .map(name => ({ name, items: grouped[name].filter(isVisible) }))
      .filter(g => g.items.length > 0);

    // ── NAV GATING (per-org opt-in, default OFF) ───────────────────────────
    // The sidebar is built from navConfig, which is identical for every org, so
    // until now switching a module off for an org did NOT remove it from their
    // menu — they still saw the entry and the page behind it then 403'd or came
    // up empty. That is worse than not showing it.
    //
    // Turning this on for an org makes its sidebar honour its feature flags.
    // It is OFF unless the org has `platform.nav_flags` explicitly enabled,
    // because switching it on changes what every user of that org sees — so it
    // is rolled out one org at a time, not shipped to everyone at once. Same
    // pattern as platform.plan_gating above.
    //
    // `nav_modules` is matched by NAME, not key: 7 admin menus were already
    // catalogued under older keys, and the generator dedupes on role+name, so
    // name is the one identifier guaranteed unique per role and stable across
    // both. Empty/absent → the frontend leaves the sidebar exactly as it is.
    let navGating = false;
    try {
      const g = await queryOne(
        "SELECT is_enabled FROM client_feature_flags WHERE org_id=? AND feature_key='platform.nav_flags' LIMIT 1",
        [orgId]);
      navGating = !!(g && g.is_enabled);
    } catch { navGating = false; }

    // ── MODULES THE PLATFORM HAS TAKEN OFF THE BOARD ──────────────────────────
    //
    // `planned` / `suspended` / `inactive` are already excluded from everything
    // above: the stage gate never selects them, so they cannot reach `menu` or
    // `nav_modules`. That was enough while the sidebar was built from the DB menu.
    // It is not enough now, because the sidebar the user actually sees is built
    // from navConfig — a static plan that knows nothing about the catalogue — and
    // it consults `nav_modules` ONLY when the org has opted into `platform.nav_flags`.
    // Most orgs have not. So marking a module Planned in the Console removed it
    // from precisely nobody's sidebar.
    //
    // This is the missing half: the NAMES of the modules this caller may not see,
    // sent unconditionally. The sidebar honours them for every org with no opt-in,
    // because "the platform has not released this yet" is an owner's decision and
    // must not wait on a per-tenant rollout flag.
    //
    // It is stage-derived rather than a hardcoded list, so org 1 (internal HQ),
    // which is allowed to see `planned`, is correctly told to hide nothing.
    let hiddenModules = [];
    if (visibleStages) {
      const offBoard = ['planned', 'pilot', 'suspended', 'inactive'].filter((s) => !visibleStages.includes(s));
      if (offBoard.length) {
        const all = await query('SELECT DISTINCT name, feature_key, status FROM platform_features');
        const hidden = all.filter((r) => offBoard.includes(r.status));
        const shown = all.filter((r) => !offBoard.includes(r.status));

        const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        // Catalogue keys are ROLE-SCOPED: admin.fees, student.fees, owner.fees.
        const tailOf = (k) => {
          const t = String(k || '').toLowerCase();
          return t.includes('.') ? t.slice(t.lastIndexOf('.') + 1) : t;
        };

        /*
         * ── WHY A BARE TAIL IS NOT ENOUGH TO HIDE A MENU ────────────────────
         *
         * The first cut of this emitted the last dotted segment of every hidden
         * key so a label like "WhatsApp" would match `admin.whatsapp`. It also
         * matched `student.fees` — a PLANNED "My Fees" for students — down to
         * "fees", which is the sidebar label every admin uses to reach the money.
         * One planned student feature took the Fees menu off every school's
         * sidebar, in every org. It reached production.
         *
         * The tail is only safe when NOTHING VISIBLE shares it. `admin.fees` is
         * live, so "fees" can never be a hide instruction; no whatsapp feature is
         * live anywhere, so "whatsapp" still is. Same for names — a hidden "My
         * Fees" must not hide a visible "Fees".
         *
         * The full feature_key is always safe: it names exactly one row.
         */
        const shownTails = new Set(shown.map((r) => norm(tailOf(r.feature_key))).filter(Boolean));
        const shownNames = new Set(shown.map((r) => norm(r.name)).filter(Boolean));

        hiddenModules = hidden.flatMap((r) => {
          const out = [r.feature_key];
          if (r.name && !shownNames.has(norm(r.name))) out.push(r.name);
          const tail = norm(tailOf(r.feature_key));
          if (tail && !shownTails.has(tail)) out.push(tail);
          return out;
        }).filter(Boolean);
      }

      /*
       * ── AND WHAT THIS ONE SCHOOL HAS BEEN SWITCHED OFF ────────────────────
       *
       * Everything above is platform lifecycle: released or not, the same answer
       * for everybody. This is the other half — a module a school does not get.
       *
       * Turning one off per org was already possible and already worked for the
       * DB-driven menu (client_feature_flags.is_enabled=0 → isVisible false), but
       * the sidebar people actually see is built from navConfig and consulted the
       * per-org list ONLY when that org had opted into `platform.nav_flags`.
       * Almost none have. So "switch Billing off for this school" silently did
       * nothing, exactly as marking a module Planned once did.
       *
       * Concretely: JD PUBLIC SCHOOL is on a negotiated custom plan, and showing
       * them the standard subscription screen shows a price that is not theirs.
       *
       * EXPLICIT off only — `is_enabled = 0` is a decision somebody made. A
       * feature merely absent from the flags table is not switched off, it is
       * simply undecided, and treating those the same would blank sidebars
       * wholesale.
       */
      try {
        const offForOrg = await query(
          `SELECT f.feature_key, f.name
             FROM client_feature_flags cf
             JOIN platform_features f ON f.feature_key = cf.feature_key
            WHERE cf.org_id = ? AND cf.is_enabled = 0`, [orgId]);
        for (const r of offForOrg) {
          // The org-specific list does NOT emit bare tails. A tail is shared
          // across roles (admin.billing / owner.billing), and one school's
          // decision must not read as a word the whole platform retired.
          hiddenModules.push(r.feature_key);
          if (r.name) hiddenModules.push(r.name);
        }
      } catch { /* flags table unreachable → hide nothing extra, never blank a sidebar */ }
    }

    return success(res, {
      role: roleSlug,
      base_role: getBaseRole(roleSlug),
      is_master: false,
      menu,
      features: features.filter(isVisible),
      nav_gating: navGating,
      nav_modules: navGating ? features.filter(isVisible).map((f) => f.name) : [],
      hidden_modules: hiddenModules,
      is_bus_driver: isBusDriver,
    });
  } catch (err) {
    logger.error('myFeatures error:', err);
    return error(res, 'Failed to get features', 500);
  }
};

const allFeatures = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const features = await query(
      `SELECT f.*, COALESCE(cf.is_enabled, f.is_default_on) AS is_enabled
         FROM platform_features f
         LEFT JOIN client_feature_flags cf ON cf.feature_key = f.feature_key AND cf.org_id = ?
        ORDER BY f.role, f.menu_group, f.sort_order`,
      [orgId]
    );
    const stats = {
      total: features.length,
      live: features.filter(f => f.status === 'live').length,
      beta: features.filter(f => f.status === 'beta').length,
      coming_soon: features.filter(f => f.status === 'coming_soon').length,
      enabled_for_org: features.filter(f => f.is_enabled).length,
    };
    return success(res, {
      features: features.map(f => ({ ...f, is_enabled: !!f.is_enabled })),
      stats,
    });
  } catch (err) {
    return error(res, 'Failed', 500);
  }
};

const toggleFeature = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { feature_key, is_enabled } = req.body;
    if (!feature_key) return error(res, 'feature_key required', 400);
    // Governance: `platform.*` control keys are owner-only — never let a tenant
    // admin flip their own governance/plan flags via the generic toggle.
    if (String(feature_key).startsWith('platform.')) return error(res, 'This setting is managed by WisWits', 403);
    if (!(await adminCan(orgId, 'features'))) return error(res, 'Features are managed by WisWits for your organization', 403);
    await query(
      `INSERT INTO client_feature_flags (org_id, feature_key, is_enabled)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
      [orgId, feature_key, is_enabled ? 1 : 0]
    );
    clearPlanCache();   // entitlement changed → the route lock must see it now
    await audit(req, 'FEATURE_TOGGLE', 'feature', null, { new_data: { feature_key, is_enabled: !!is_enabled } });
    return success(res, { feature_key, is_enabled: !!is_enabled }, 'Updated');
  } catch (err) {
    return error(res, 'Failed', 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { feature_key, status, note, global } = req.body;
    // Lifecycle stages (FEATURE_FLAGS_SPEC §1): planned → pilot → beta → live;
    // coming_soon (teaser); suspended (kill-switch); inactive (archived).
    //
    // ⚠ These SEVEN must all exist in the platform_features.status ENUM. They did not
    // until migration 036 — the column held four, so 'pilot', 'suspended' and
    // 'inactive' were rejected by the database and the Console's buttons for them
    // silently failed. If a status is ever added here, add it to the column too.
    if (!['live','beta','coming_soon','planned','pilot','suspended','inactive'].includes(status)) return error(res, 'Invalid status', 400);
    // A missing key used to fall through to the lookup, return no row, and then throw
    // on `prev.status` — surfacing as a masked 500 instead of saying what was wrong.
    if (!feature_key) return error(res, 'feature_key is required', 400);
    const prev = await queryOne('SELECT status FROM platform_features WHERE feature_key=?', [feature_key]);
    if (!prev) return error(res, 'Unknown feature', 404);
    // Scope on promote (FEATURE_FLAGS_SPEC §2): when the Console sends `global`,
    // set is_default_on. global=true → every org sees it by default; global=false
    // → hidden by default, shown only to orgs explicitly granted (Pilot toggle /
    // plan bundle). Omitted → is_default_on unchanged.
    const setDefault = (global === true || global === false) ? ', is_default_on=?' : '';
    const params = setDefault
      ? [status, (status === 'live' || status === 'beta') ? 1 : 0, global ? 1 : 0, feature_key]
      : [status, (status === 'live' || status === 'beta') ? 1 : 0, feature_key];
    await query(
      `UPDATE platform_features SET status=?, is_released=?${setDefault} WHERE feature_key=?`,
      params
    );
    // Append-only release record (SUG-0076) — powers SuperAdmin history + org
    // What's New. Never blocks the flip if the table isn't migrated yet.
    if (prev.status !== status) {
      await query(
        'INSERT INTO platform_feature_releases (feature_key, from_status, to_status, note, changed_by) VALUES (?,?,?,?,?)',
        [feature_key, prev.status, status, (note || '').slice(0, 255) || null, req.user.email || null]
      ).catch(() => {});
    }
    await audit(req, 'FEATURE_STATUS', 'feature', null, { old_data: { status: prev.status }, new_data: { feature_key, status } });
    return success(res, {}, 'Updated');
  } catch (err) {
    // THIS LINE IS WHY THE BROKEN KILL-SWITCH WENT UNNOTICED. Every other handler in
    // this file logs; this one returned a bare 500. So three Console buttons failed
    // against the database for as long as they existed and produced no server log
    // line at all — and production masks 5xx bodies, so the operator only ever saw
    // "Something went wrong on our side."
    logger.error(`features.updateStatus (${req.body?.feature_key} → ${req.body?.status}): ${err.message}`);
    return error(res, 'Failed', 500);
  }
};

// ── Feature Lifecycle Pipeline (SUG-0076, docs/FEATURE_LIFECYCLE.md) ────────
// SuperAdmin cockpit data: full catalog + per-org pilot enablements + release
// history + org picker. One round-trip for the Feature Console.
const registry = async (req, res) => {
  try {
    const [features, pilots, releases, orgs] = await Promise.all([
      query(`SELECT feature_key, name, description, icon, href, role, status,
                    sort_order, menu_group, module_key, is_default_on
               FROM platform_features
              ORDER BY role, menu_group, sort_order, name`).catch(() =>
        // module_key not migrated yet → same query without it (fail-soft)
        query(`SELECT feature_key, name, description, icon, href, role, status,
                      sort_order, menu_group, is_default_on
                 FROM platform_features
                ORDER BY role, menu_group, sort_order, name`)),
      query(`SELECT cf.feature_key, cf.org_id, cf.is_enabled, o.name AS org_name
               FROM client_feature_flags cf
               JOIN client_organizations o ON o.id = cf.org_id
              ORDER BY cf.feature_key, o.name`),
      query(`SELECT feature_key, from_status, to_status, note, changed_by, created_at
               FROM platform_feature_releases
              ORDER BY created_at DESC, id DESC LIMIT 100`).catch(() => []),
      query(`SELECT id, COALESCE(NULLIF(display_name,''), name) AS name
               FROM client_organizations WHERE is_active = 1 ORDER BY id`).catch(() =>
        query(`SELECT id, COALESCE(NULLIF(display_name,''), name) AS name
                 FROM client_organizations ORDER BY id`)),
    ]);
    return success(res, { features, pilots, releases, orgs });
  } catch (err) {
    logger.error('features.registry error:', err);
    return error(res, 'Failed to load registry', 500);
  }
};

// PILOT push: enable/disable one feature for ONE specific org (cross-org —
// superadmin only; the org-scoped /toggle stays for org admins). This is the
// "push krke ek org me test" step: planned/private features become visible to
// the pilot org only, nothing changes for anyone else.
const pilotPush = async (req, res) => {
  try {
    const { feature_key, org_id, is_enabled } = req.body;
    const orgId = Number(org_id);
    if (!feature_key || !Number.isInteger(orgId) || orgId <= 0) {
      return error(res, 'feature_key and org_id required', 400);
    }
    const [feat, org] = await Promise.all([
      queryOne('SELECT feature_key FROM platform_features WHERE feature_key=?', [feature_key]),
      queryOne('SELECT id FROM client_organizations WHERE id=?', [orgId]),
    ]);
    if (!feat) return error(res, 'Unknown feature', 404);
    if (!org) return error(res, 'Unknown organization', 404);
    await query(
      `INSERT INTO client_feature_flags (org_id, feature_key, is_enabled)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
      [orgId, feature_key, is_enabled ? 1 : 0]
    );
    clearPlanCache();
    await audit(req, 'FEATURE_PILOT', 'feature', orgId, { new_data: { feature_key, org_id: orgId, is_enabled: !!is_enabled } });
    return success(res, { feature_key, org_id: orgId, is_enabled: !!is_enabled }, 'Pilot updated');
  } catch (err) {
    logger.error('features.pilotPush error:', err);
    return error(res, 'Failed', 500);
  }
};

// What's New — org-facing feed of recent Beta/Live releases, filtered to the
// caller's base role and org enablement so nobody is teased with a feature
// they can't open. Any authenticated user.
const whatsNew = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const baseRole = getBaseRole(req.user.role_slug || 'admin');
    const roleFilter = baseRole === 'owner' ? ['owner','admin','teacher','student','parent'] : [baseRole];
    const rows = await query(
      `SELECT r.feature_key, r.to_status, r.note, r.created_at,
              f.name, f.menu_group, f.module_key, f.href
         FROM platform_feature_releases r
         JOIN platform_features f ON f.feature_key = r.feature_key
         LEFT JOIN client_feature_flags cf ON cf.feature_key = f.feature_key AND cf.org_id = ?
        WHERE r.to_status IN ('beta','live')
          AND r.created_at >= DATE_SUB(NOW(), INTERVAL 45 DAY)
          AND f.role IN (${roleFilter.map(() => '?').join(',')})
          AND COALESCE(cf.is_enabled, f.is_default_on) = 1
        ORDER BY r.created_at DESC, r.id DESC LIMIT 20`,
      [orgId, ...roleFilter]
    ).catch(() => []);
    // Same feature may flip twice; keep only its latest entry.
    const seen = new Set(); const items = [];
    for (const r of rows) { if (seen.has(r.feature_key)) continue; seen.add(r.feature_key); items.push(r); }
    return success(res, { items });
  } catch (err) {
    return success(res, { items: [] }); // never break a header for a feed
  }
};

const createFeature = async (req, res) => {
  try {
    const { feature_key, name, role, menu_group, icon, status='coming_soon' } = req.body;
    if (!feature_key || !name || !role) return error(res, 'Missing fields', 400);
    await query(
      `INSERT INTO platform_features (feature_key,name,role,menu_group,icon,status,is_default_on)
       VALUES (?,?,?,?,?,?,1)`,
      [feature_key, name, role, menu_group || 'General', icon || 'Circle', status]
    );
    return success(res, {}, 'Created', 201);
  } catch (err) {
    return error(res, 'Failed', 500);
  }
};

// ── ADD-ON MANAGER (FEATURE_FLAGS_SPEC §3) ─────────────────────────────────
// Grant/revoke a MODULE to a scope, from one screen: all plans · a plan · an
// org-type · a particular org. Reads/writes the metadata registries; nothing
// enforces until an org turns on plan_gating (so this is safe to use anytime).
const addons = async (req, res) => {
  try {
    const [modules, planGrants, instGrants, orgTypes, orgs, branches, branchGrants, orgGrants, gateFlags] = await Promise.all([
      query('SELECT module_key, name, category, sort_order FROM platform_modules ORDER BY sort_order, name'),
      query('SELECT plan_slug, module_key, granted FROM platform_plan_modules').catch(() => []),
      query('SELECT institution_type, module_key, status FROM platform_institution_modules').catch(() => []),
      query('SELECT type_key, name FROM platform_institution_types WHERE is_active=1 ORDER BY sort_order').catch(() => []),
      // ── WHICH PLAN IS THIS CUSTOMER ON? ─────────────────────────────────
      // Without it, a cell that reads "from plan" cannot be resolved to a real
      // yes/no for that customer — the screen knows what each plan grants and
      // knows the org has no override of its own, and still cannot join the
      // two. Same join and same default as planGate.resolveOrgPlan (latest
      // subscription by id wins; no subscription → DEFAULT_PLAN_SLUG), batched
      // for every org instead of one org at a time.
      //
      // The fallback is the PREVIOUS query verbatim: if the subscription tables
      // are unreadable the customer columns must still appear without their
      // plan, never vanish — an empty org list reads as "no customers", which
      // is the one thing this payload must never say by accident.
      query(
        `SELECT o.id, COALESCE(NULLIF(o.display_name,''), o.name) AS name, o.type,
                COALESCE(csp.slug, ?) AS plan_slug, csp.name AS plan_name
           FROM client_organizations o
           LEFT JOIN (SELECT org_id, MAX(id) AS id FROM client_subscriptions GROUP BY org_id) latest
                  ON latest.org_id = o.id
           LEFT JOIN client_subscriptions cs ON cs.id = latest.id
           LEFT JOIN client_subscription_plans csp ON csp.id = cs.plan_id
          WHERE o.is_active=1 AND o.id<>1
          ORDER BY o.id`, [DEFAULT_PLAN_SLUG])
        .catch(() => query(`SELECT id, COALESCE(NULLIF(display_name,''), name) AS name, type FROM client_organizations WHERE is_active=1 AND id<>1 ORDER BY id`).catch(() => [])),
      // P1e: only orgs with >1 branch are groups; single-branch orgs use org scope.
      query(`SELECT cs.id, cs.org_id, cs.name, cs.is_primary
               FROM client_schools cs
               JOIN (SELECT org_id FROM client_schools WHERE status='active' GROUP BY org_id HAVING COUNT(*)>1) g
                 ON g.org_id=cs.org_id
              WHERE cs.status='active' AND cs.org_id<>1
              ORDER BY cs.org_id, cs.is_primary DESC, cs.id`).catch(() => []),
      // one row per (branch, module) — a module is ON for a branch when ANY of its
      // features is enabled there; MIN(is_enabled) reflects an explicit OFF override.
      query(`SELECT sf.school_id, f.module_key, MIN(sf.is_enabled) AS is_enabled
               FROM client_school_feature_flags sf
               JOIN platform_features f ON f.feature_key=sf.feature_key
              WHERE f.module_key IS NOT NULL
              GROUP BY sf.school_id, f.module_key`).catch(() => []),
      // ── WHAT THE ORG TOGGLES ACTUALLY SHOW ──────────────────────────────
      // This row was MISSING, and its absence was invisible: the Add-on Manager
      // kept org state in a `useState({})` that nothing ever populated, so every
      // organisation rendered as NOT granted no matter what was in the database,
      // and only looked right after you clicked it in that same session. A
      // control that cannot show you the state it controls is not a control.
      //
      // Shaped exactly like `branchGrants` above and read the same way: a module
      // is ON for an org when any of its features is enabled, and MIN(is_enabled)
      // surfaces an explicit OFF. Read-only, additive, `.catch` like its siblings.
      query(`SELECT ff.org_id, f.module_key, MIN(ff.is_enabled) AS is_enabled
               FROM client_feature_flags ff
               JOIN platform_features f ON f.feature_key=ff.feature_key
              WHERE f.module_key IS NOT NULL AND ff.org_id<>1
              GROUP BY ff.org_id, f.module_key`).catch(() => []),
      // ── IS PLAN GATING ACTUALLY ON FOR THIS ORG? ────────────────────────
      // `orgGrants` above cannot answer this: `platform.plan_gating` is a
      // feature of module_key 'platform', and that row aggregates the whole
      // module with MIN(is_enabled) across siblings like
      // `platform.meter_enforce` — so a 0 there could be either flag, and a
      // screen that guessed would be confidently wrong about whether a
      // customer is enforced. Asked here explicitly, from the SAME table,
      // column and key constant planGate.resolveOrgPlan reads (default OFF
      // when there is no row), so the grid and the gate cannot disagree.
      query('SELECT org_id, is_enabled FROM client_feature_flags WHERE feature_key=? AND org_id<>1',
        [PLAN_GATING_FLAG]).catch(() => []),
    ]);
    const plans = [...new Set(planGrants.map(r => r.plan_slug))].sort();
    // org_id → true/false. Indexable by org id; absent org = no row = OFF.
    const orgGating = Object.fromEntries(gateFlags.map(r => [r.org_id, Number(r.is_enabled) === 1]));
    return success(res, { modules, plans, planGrants, instGrants, orgTypes, orgs, branches, branchGrants, orgGrants, orgGating });
  } catch (err) {
    logger.error('features.addons error:', err);
    return error(res, 'Failed to load add-on data', 500);
  }
};

const addonGrant = async (req, res) => {
  try {
    const { module_key, scope, target, enable } = req.body;
    if (!module_key || !scope) return error(res, 'module_key and scope required', 400);
    // ── `clear` — THE WAY BACK OUT OF AN OVERRIDE ─────────────────────────
    // `enable:false` writes is_enabled=0, which is an EXPLICIT removal that
    // beats the org's plan forever. Until now that was a one-way door: once a
    // module was revoked for an org, nothing in the product could return that
    // org to simply following its plan, because "follows the plan" is the
    // ABSENCE of the row and the endpoint only ever wrote one. Clearing
    // deletes the rows, so the plan decides again.
    //
    // It is a field on THIS endpoint rather than a new route because that is
    // already the repo's idiom for exactly this decision — pricing's
    // `PUT /pricing/orgs/:id/override` takes `{clear:true}` to drop a custom
    // price back to the plan price. Same auth, same audit, same cache clear,
    // one less route to keep in step.
    const clear = req.body?.clear === true;
    const on = enable ? 1 : 0;
    const mod = await queryOne('SELECT module_key FROM platform_modules WHERE module_key=?', [module_key]);
    if (!mod) return error(res, 'Unknown module', 404);
    clearPlanCache();
    await audit(req, 'ADDON_GRANT', 'module', null, {
      new_data: clear
        ? { module_key, scope, target: target ?? null, action: 'grant_cleared' }
        : { module_key, scope, target: target ?? null, enable: !!on },
    });

    // Only the per-org override has three states to return FROM. A plan grant
    // is genuinely binary (`platform_plan_modules` has no "unset" that differs
    // from granted=0) and an org-type status is one of core/addon/off, so
    // "clear" would have no meaning there — say so rather than silently
    // ignoring the field and reporting success for a write that never happened.
    if (clear && scope !== 'org') {
      return error(res, 'Only a single organisation can be returned to its plan', 400);
    }

    if (scope === 'plan' || scope === 'all_plans') {
      const slugs = scope === 'all_plans'
        ? [...new Set((await query('SELECT DISTINCT plan_slug FROM platform_plan_modules')).map(r => r.plan_slug))]
        : [String(target)];
      for (const slug of slugs.filter(Boolean)) {
        await query(`INSERT INTO platform_plan_modules (plan_slug, module_key, granted) VALUES (?,?,?)
                     ON DUPLICATE KEY UPDATE granted=VALUES(granted)`, [slug, module_key, on]);
      }
      return success(res, { module_key, scope, count: slugs.length, enable: !!on }, 'Plan grant updated');
    }
    if (scope === 'org_type') {
      if (!target) return error(res, 'org type required', 400);
      await query(`INSERT INTO platform_institution_modules (institution_type, module_key, status) VALUES (?,?,?)
                   ON DUPLICATE KEY UPDATE status=VALUES(status)`, [String(target), module_key, on ? 'core' : 'off']);
      return success(res, { module_key, scope, target, enable: !!on }, 'Org-type grant updated');
    }
    if (scope === 'org') {
      const orgId = Number(target);
      if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'valid org_id required', 400);
      // grant/revoke every feature of this module for the org (add-on override)
      const feats = await query('SELECT feature_key FROM platform_features WHERE module_key=?', [module_key]);
      // A clear must remove EXACTLY the set a grant writes — the same
      // `feats` list, not a LIKE on the key or a join that might catch a
      // feature this endpoint never wrote. Clearing a different set is how a
      // module ends up half-inherited: some features back on the plan, some
      // still pinned by an old override, and MIN(is_enabled) reading the
      // leftovers back as an explicit OFF for the whole module.
      if (clear) {
        if (feats.length) {
          await query(
            `DELETE FROM client_feature_flags WHERE org_id=? AND feature_key IN (${feats.map(() => '?').join(',')})`,
            [orgId, ...feats.map((f) => f.feature_key)]);
        }
        return success(res, { module_key, scope, org_id: orgId, features: feats.length, cleared: true },
          'Back to their plan — this organisation has no setting of its own for this module now');
      }
      for (const f of feats) {
        await query(`INSERT INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,?)
                     ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)`, [orgId, f.feature_key, on]);
      }
      return success(res, { module_key, scope, org_id: orgId, features: feats.length, enable: !!on }, 'Org add-on updated');
    }
    if (scope === 'school') {
      // Per-branch (P1e): grant/revoke every feature of this module for ONE branch
      // of a group. Overlays the org grant only when a user is scoped to that branch.
      const schoolId = Number(target);
      if (!Number.isInteger(schoolId) || schoolId <= 0) return error(res, 'valid school_id required', 400);
      const sch = await queryOne('SELECT id, org_id FROM client_schools WHERE id=?', [schoolId]);
      if (!sch) return error(res, 'Unknown branch', 404);
      const feats = await query('SELECT feature_key FROM platform_features WHERE module_key=?', [module_key]);
      for (const f of feats) {
        await query(`INSERT INTO client_school_feature_flags (org_id, school_id, feature_key, is_enabled) VALUES (?,?,?,?)
                     ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)`, [sch.org_id, schoolId, f.feature_key, on]);
      }
      return success(res, { module_key, scope, school_id: schoolId, features: feats.length, enable: !!on }, 'Branch add-on updated');
    }
    return error(res, 'Invalid scope', 400);
  } catch (err) {
    logger.error('features.addonGrant error:', err);
    return error(res, 'Failed', 500);
  }
};

// ── ADMIN SELF-SERVE MODULES (PERSONA_BLUEPRINT_MAP §5) ────────────────────
// The org's OWN admin/owner turns modules on/off for their org — 3-tier:
//   blueprint default → admin override (here) → platform availability (plan/type).
// 2-tier gate (AK 2026-07-24): an admin may toggle only modules their plan/type
// makes available; premium (not in plan) is locked "Upgrade to unlock"; a type's
// 'core' module is always on + locked; a type's 'off' module is not applicable.
// Reuses platform_modules / _institution_modules / _plan_modules and writes the
// same client_feature_flags the SuperAdmin Add-on Manager does — org-scoped.
const resolveOrgPlanType = async (orgId) => {
  const org = await queryOne('SELECT type FROM client_organizations WHERE id=?', [orgId]).catch(() => null);
  const orgType = (org && org.type) || 'school';
  const planRow = await queryOne(
    'SELECT csp.slug FROM client_subscriptions cs JOIN client_subscription_plans csp ON csp.id=cs.plan_id WHERE cs.org_id=? ORDER BY cs.id DESC LIMIT 1',
    [orgId]).catch(() => null);
  const planSlug = (planRow && planRow.slug) || 'starter';
  return { orgType, planSlug };
};

const myModules = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { orgType, planSlug } = await resolveOrgPlanType(orgId);
    const [modules, inst, plan, state] = await Promise.all([
      query('SELECT module_key, name, category, sort_order FROM platform_modules ORDER BY sort_order, name'),
      query('SELECT module_key, status FROM platform_institution_modules WHERE institution_type=?', [orgType]).catch(() => []),
      query('SELECT module_key, granted FROM platform_plan_modules WHERE plan_slug=?', [planSlug]).catch(() => []),
      // resolved on/off for this org across each module's features (toggle writes
      // all a module's features uniformly, so MAX == MIN in practice).
      query(`SELECT f.module_key, MAX(COALESCE(cf.is_enabled, f.is_default_on)) AS is_on
               FROM platform_features f
               LEFT JOIN client_feature_flags cf ON cf.feature_key=f.feature_key AND cf.org_id=?
              WHERE f.module_key IS NOT NULL
              GROUP BY f.module_key`, [orgId]).catch(() => []),
    ]);
    const instMap = Object.fromEntries(inst.map(r => [r.module_key, r.status]));
    const planMap = Object.fromEntries(plan.map(r => [r.module_key, Number(r.granted)]));
    const stateMap = Object.fromEntries(state.map(r => [r.module_key, Number(r.is_on)]));

    const byCat = {}; const order = [];
    for (const m of modules) {
      const instStatus = instMap[m.module_key];         // 'core' | 'off' | undefined
      if (instStatus === 'off') continue;               // not applicable to this type
      const isCore = instStatus === 'core';
      const available = isCore || planMap[m.module_key] === 1;
      const stateTag = isCore ? 'core' : (available ? 'available' : 'premium');
      const isOn = isCore ? true : (available ? (stateMap[m.module_key] ?? 0) === 1 : false);
      const item = {
        module_key: m.module_key, name: m.name, category: m.category || 'General',
        is_on: isOn, locked: isCore || !available, state: stateTag,
      };
      const c = item.category;
      if (!byCat[c]) { byCat[c] = []; order.push(c); }
      byCat[c].push(item);
    }
    const groups = order.map(category => ({ category, items: byCat[category] }));
    return success(res, { org_type: orgType, plan: planSlug, groups });
  } catch (err) {
    logger.error('myModules error:', err);
    return error(res, 'Failed to load modules', 500);
  }
};

const toggleMyModule = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { module_key, enable } = req.body || {};
    if (!module_key) return error(res, 'module_key required', 400);
    // Governance (CONTROL_PLANE §4): the owner may lock modules to "managed by WisWits".
    if (!(await adminCan(orgId, 'modules'))) return error(res, 'Modules are managed by WisWits for your organization', 403);
    const on = enable ? 1 : 0;
    const mod = await queryOne('SELECT module_key FROM platform_modules WHERE module_key=?', [module_key]);
    if (!mod) return error(res, 'Unknown module', 404);

    const { orgType, planSlug } = await resolveOrgPlanType(orgId);
    const instRow = await queryOne('SELECT status FROM platform_institution_modules WHERE institution_type=? AND module_key=?', [orgType, module_key]).catch(() => null);
    const instStatus = instRow && instRow.status;
    if (instStatus === 'off') return error(res, 'This module is not available for your institution type', 403);
    const isCore = instStatus === 'core';
    if (isCore && !on) return error(res, 'Core modules cannot be turned off', 409);
    if (!isCore && on) {
      const granted = await queryOne('SELECT granted FROM platform_plan_modules WHERE plan_slug=? AND module_key=?', [planSlug, module_key]).catch(() => null);
      if (!(granted && Number(granted.granted) === 1)) {
        return error(res, 'This module is not included in your plan — upgrade to unlock', 402);
      }
    }
    const feats = await query('SELECT feature_key FROM platform_features WHERE module_key=?', [module_key]);
    if (!feats.length) return error(res, 'Module has no toggleable features', 400);
    for (const f of feats) {
      await query(`INSERT INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,?)
                   ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)`, [orgId, f.feature_key, on]);
    }
    clearPlanCache();
    await audit(req, 'MODULE_TOGGLE', 'module', null, { new_data: { module_key, enable: !!on, features: feats.length } });
    return success(res, { module_key, is_on: !!on, features: feats.length }, on ? 'Module enabled' : 'Module disabled');
  } catch (err) {
    logger.error('toggleMyModule error:', err);
    return error(res, 'Failed', 500);
  }
};

// ── OWNER GOVERNANCE (CONTROL_PLANE §4) ────────────────────────────────────
// myGovernance: the admin's own org — which dimensions they may self-serve (the
// web Controls surfaces read this to show a read-only "Managed by WisWits" state).
const myGovernance = async (req, res) => {
  try {
    return success(res, await governanceFor(req.user.org_id));
  } catch (err) { logger.error('myGovernance error:', err); return error(res, 'Failed', 500); }
};

// orgGovernance / setGovernance: platform-only (owner). Read/set a specific org's
// admin_can flags. Default (no row) = allowed; setting allowed=false = locked.
const orgGovernance = async (req, res) => {
  try {
    const orgId = Number(req.query.org_id);
    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'valid org_id required', 400);
    return success(res, await governanceFor(orgId));
  } catch (err) { logger.error('orgGovernance error:', err); return error(res, 'Failed', 500); }
};

const setGovernance = async (req, res) => {
  try {
    const { org_id, dimension, allowed } = req.body || {};
    const orgId = Number(org_id);
    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'valid org_id required', 400);
    if (!DIMENSIONS.includes(dimension)) return error(res, `dimension must be one of: ${DIMENSIONS.join(', ')}`, 400);
    const on = allowed ? 1 : 0;
    await query(`INSERT INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,?)
                 ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)`, [orgId, flagKey(dimension), on]);
    await audit(req, 'GOVERNANCE_SET', 'organization', orgId, { new_data: { dimension, allowed: !!on } });
    return success(res, { org_id: orgId, dimension, allowed: !!on }, 'Governance updated');
  } catch (err) { logger.error('setGovernance error:', err); return error(res, 'Failed', 500); }
};

/*
 * QUESTION BANK LIBRARY — who may read the platform's master bank.
 *
 * Deliberately NOT folded into governance above. Governance answers "may this
 * org's admin self-serve this dimension" and fails OPEN — no row means allowed,
 * so existing orgs keep control. This answers "may this org read WisWits'
 * questions" and must fail CLOSED — no row means no access. Putting a
 * default-off entitlement behind a default-on meta-switch is how a school ends
 * up reading a bank nobody granted it.
 *
 * It lives here rather than in modules/qbank because this is where every other
 * platform-side, org-targeting switch already lives (setGovernance, addonGrant,
 * pilotPush) — same auth, same audit, no new mount.
 *
 * The routes are requirePlatformOrg + owner/super_admin/system_admin: a school
 * cannot grant itself the library, and the generic /toggle cannot reach the key
 * either, since resolution is by exact key and this one is not in any org's
 * feature catalog.
 */
const setQbankLibrary = async (req, res) => {
  try {
    const { org_id, enabled } = req.body || {};
    const orgId = Number(org_id);
    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'valid org_id required', 400);
    if (orgId === PLATFORM_ORG_ID) {
      // It owns the bank; a flag would imply it could be switched off, and the
      // read path ignores the flag for this org anyway. Refusing is honest.
      return error(res, 'The platform org owns the bank — there is nothing to grant', 400);
    }
    const on = enabled ? 1 : 0;
    await query(
      `INSERT INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
      [orgId, LIBRARY_FLAG, on]
    );
    clearLibraryCache();   // the 30s cache must not outlive an explicit decision
    await audit(req, 'QBANK_LIBRARY_GRANT', 'organization', orgId, { new_data: { enabled: !!on } });
    return success(res, { org_id: orgId, enabled: !!on },
      on ? 'Question bank library enabled' : 'Question bank library disabled');
  } catch (err) { logger.error('setQbankLibrary error:', err); return error(res, 'Failed', 500); }
};

const listQbankLibrary = async (req, res) => {
  try {
    // Every org, with its grant state — so the answer to "who can see the bank"
    // is one screen and not a query someone has to remember how to write.
    const rows = await query(
      `SELECT o.id AS org_id, o.name,
              COALESCE(f.is_enabled, 0) AS enabled
         FROM client_organizations o
         LEFT JOIN client_feature_flags f
                ON f.org_id = o.id AND f.feature_key = ?
        WHERE o.id <> ?
        ORDER BY enabled DESC, o.name`,
      [LIBRARY_FLAG, PLATFORM_ORG_ID]
    );
    const bank = await queryOne(
      `SELECT COUNT(*) AS n FROM client_qb_questions WHERE org_id = ? AND is_active = 1`,
      [PLATFORM_ORG_ID]
    );
    return success(res, {
      platform_org_id: PLATFORM_ORG_ID,
      library_size: bank?.n || 0,
      organizations: rows.map((r) => ({ ...r, enabled: !!Number(r.enabled) })),
    });
  } catch (err) { logger.error('listQbankLibrary error:', err); return error(res, 'Failed', 500); }
};

module.exports = { myFeatures, allFeatures, toggleFeature, updateStatus, createFeature, registry, pilotPush, whatsNew, addons, addonGrant, myModules, toggleMyModule, myGovernance, orgGovernance, setGovernance, setQbankLibrary, listQbankLibrary };
