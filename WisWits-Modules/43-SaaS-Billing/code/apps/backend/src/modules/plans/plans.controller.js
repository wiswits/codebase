'use strict';
const db = require('../../config/db');
const { audit } = require('../../utils/audit');

// ── Platform Architecture overview (read-only, superadmin) ──────────────────
// One place to SEE the whole metadata spine: the module registry, which tier
// unlocks each module, and headline counts. Powers /superadmin/architecture.
exports.architecture = async (req, res) => {
  try {
    const [modules] = await db.pool.execute(
      'SELECT module_key, name, category, status, sort_order FROM platform_modules ORDER BY sort_order, name'
    );
    const [planMods] = await db.pool.execute(
      'SELECT plan_slug, module_key FROM platform_plan_modules WHERE granted=1'
    );
    // lowest tier that grants a module (tiers are cumulative)
    const grants = { starter: new Set(), growth: new Set(), scale: new Set() };
    for (const r of planMods) {
      if (r.plan_slug === 'starter') grants.starter.add(r.module_key);
      else if (r.plan_slug === 'growth') grants.growth.add(r.module_key);
      else if (['pro', 'premium', 'enterprise'].includes(r.plan_slug)) grants.scale.add(r.module_key);
    }
    const tierOf = (m) => grants.starter.has(m) ? 'Starter' : grants.growth.has(m) ? 'Growth' : grants.scale.has(m) ? 'Scale' : '—';
    const withTier = modules.map(m => ({ ...m, tier: tierOf(m.module_key) }));

    const count = async (sql) => { const [[r]] = await db.pool.execute(sql); return r.n; };
    const [permN, featN, liveFeatN, roleN, widgetN, instN] = await Promise.all([
      count('SELECT COUNT(*) n FROM platform_permissions'),
      count('SELECT COUNT(*) n FROM platform_features'),
      count("SELECT COUNT(*) n FROM platform_features WHERE status='live'"),
      count("SELECT COUNT(*) n FROM client_roles"),
      count('SELECT COUNT(*) n FROM platform_widgets').catch(() => 0),
      count('SELECT COUNT(*) n FROM platform_institution_types WHERE is_active=1').catch(() => 0),
    ]);

    return res.json({ success: true, data: {
      modules: withTier,
      tiers: [
        { name: 'Starter', count: grants.starter.size },
        { name: 'Growth',  count: grants.growth.size },
        { name: 'Scale',   count: grants.scale.size },
      ],
      stats: { modules: modules.length, permissions: permN, features: featN, live_features: liveFeatN, roles: roleN, widgets: widgetN, institution_types: instN },
    }});
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// ── Bundle preview (Phase 5, dormant) ──────────────────────────────────────
// Read-only "what does a <plan> × <institution_type> actually unlock?" — the
// two-axis resolver (plan tier ∩ segment relevance). Superadmin sales/support
// tool. Reads platform_plan_modules + platform_institution_modules; nothing
// here gates live behavior (that stays behind the per-org plan_gating flag).
exports.bundlePreview = async (req, res) => {
  try {
    const plan = String(req.query.plan || 'starter');
    const type = String(req.query.type || 'school');
    const [rows] = await db.pool.execute(
      `SELECT m.module_key, m.name, m.category, m.sort_order,
              COALESCE(im.status, 'core') AS institution_status,
              COALESCE(pm.granted, 0)     AS plan_granted
         FROM platform_modules m
         LEFT JOIN platform_plan_modules pm
           ON pm.module_key COLLATE utf8mb4_unicode_ci = m.module_key COLLATE utf8mb4_unicode_ci AND pm.plan_slug = ?
         LEFT JOIN platform_institution_modules im
           ON im.module_key COLLATE utf8mb4_unicode_ci = m.module_key COLLATE utf8mb4_unicode_ci AND im.institution_type = ?
        ORDER BY m.sort_order, m.name`,
      [plan, type]
    );
    const on = [], addon = [], off = [];
    for (const r of rows) {
      const included = r.institution_status !== 'off' && Number(r.plan_granted) === 1;
      const bucket = !included ? off : (r.institution_status === 'addon' ? addon : on);
      bucket.push({ module_key: r.module_key, name: r.name, category: r.category });
    }
    return res.json({ success: true, data: {
      plan, institution_type: type,
      summary: { on: on.length, addon: addon.length, off: off.length },
      on, addon, off,
    }});
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// A row can be double-encoded (a plain string JSON.stringify'd instead of an
// array — see normalizeFeatures below) or malformed outright. Never let a bad
// row 500 the whole plans list or ship a non-array to the client.
const parseFeatures = (raw) => {
  let v = raw;
  try { if (typeof v === 'string') v = JSON.parse(v); } catch { return []; }
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return v.split('\n').map(f => f.trim()).filter(Boolean); } }
  return Array.isArray(v) ? v : [];
};

exports.listPublic = async (req, res) => {
  try {
    const [plans] = await db.pool.execute(
      `SELECT id, slug, name, tagline, price_monthly, price_yearly, currency, max_students, max_staff, max_branches, features, is_popular, is_custom
       FROM pricing_plans WHERE is_active = 1 ORDER BY sort_order, id`
    );
    return res.json({ success: true, plans: plans.map(p => ({ ...p, features: parseFeatures(p.features) })) });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

exports.listAll = async (req, res) => {
  try {
    const [plans] = await db.pool.execute(`SELECT * FROM pricing_plans ORDER BY sort_order, id`);
    return res.json({ success: true, plans: plans.map(p => ({ ...p, features: parseFeatures(p.features) })) });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// `features` must always land in the DB as a JSON array. Callers have sent a
// raw newline-delimited string before (a frontend stale-closure bug) — that
// got JSON.stringify()'d into a double-encoded string, which crashed the
// pricing page on read (`.slice().map()` on a string). Normalize here so no
// caller, present or future, can write a bad shape again.
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) return features;
  if (typeof features === 'string') return features.split('\n').map(f => f.trim()).filter(Boolean);
  return [];
};

// ── RETIRED: THESE WROTE A PRICE THAT NOTHING BILLED FROM ───────────────────
//
// `pricing_plans` is a DISPLAY catalog. Nothing charges from it: the biller reads
// `client_subscription_plans`, which is what `client_subscriptions.plan_id` is FK'd to.
// So these three endpoints let an owner type a price, showed a green "Plan updated"
// toast, changed nothing about what any customer was charged — and were then silently
// overwritten the next time migration 031 ran.
//
// That is not a missing feature, it is a lie in the interface. A screen that looks
// like it sets prices and does not is worse than no screen, because it stops anyone
// looking for the real one. /superadmin/pricing now edits the real catalog through
// `/api/pricing` (modules/pricing), which writes the billing table, mirrors the
// display table in the same request, and marks the row so 031 stops stomping it.
//
// They return 410 Gone rather than being deleted outright: §15 is mark → migrate →
// remove, a 4xx says something true to any caller still pointing here (the old
// frontend build, a bookmarked request), and a 410 body is not masked in production
// the way a 5xx is. Remove them once no build older than this release is in service.
const RETIRED = 'This endpoint is retired. Prices are set in Pricing (it writes the billing catalog); ' +
  'this one only ever wrote a display table that nothing billed from.';

exports.update = async (req, res) =>
  res.status(410).json({ success: false, status: 'error', message: RETIRED, moved_to: 'PATCH /api/pricing/plans/:id' });

exports.create = async (req, res) =>
  res.status(410).json({ success: false, status: 'error', message: RETIRED, moved_to: 'PATCH /api/pricing/plans/:id' });

exports.remove = async (req, res) =>
  res.status(410).json({ success: false, status: 'error', message: RETIRED, moved_to: 'PATCH /api/pricing/plans/:id' });

/**
 * Current subscription for the logged-in org. Powers the billing page and the trial
 * banner, so it is what a customer reads about their own plan.
 *
 * ── IT WAS JOINING THE WRONG TABLE, ON AN ID THAT MEANS SOMETHING ELSE ───────
 * This used `LEFT JOIN pricing_plans p ON p.id = s.plan_id`. But
 * `client_subscriptions.plan_id` is FK'd to `client_subscription_plans` — two
 * different tables with two independent AUTO_INCREMENT sequences. So the join matched
 * pricing_plans row 5 for a subscription on client_subscription_plans row 5, and
 * showed the customer whichever plan happened to sit at that id in the display table.
 * Wrong name, wrong price, no error, LEFT JOIN so not even a null to notice. On the
 * local dev database `pricing_plans` is empty, which is why nothing ever looked odd
 * here; on production it has seven rows and the ids do not line up.
 *
 * The fix is not a better join — it is not computing the price here at all. The price
 * comes from `services/pricing.resolveForOrg`, the one function the invoice, the
 * biller, MRR and the owner screen all use. That is the entire point of this session:
 * a customer reading their own plan and the invoice they receive must not be two
 * different pieces of arithmetic.
 */
exports.mySubscription = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [[sub]] = await db.pool.execute(
      `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.price_monthly, p.price_floor,
              p.max_students, p.features
         FROM client_subscriptions s
         JOIN client_subscription_plans p ON p.id = s.plan_id
        WHERE s.org_id = ? ORDER BY s.id DESC LIMIT 1`,
      [orgId]
    );
    if (!sub) return res.json({ success: true, subscription: null });

    const daysLeft = sub.end_date ? Math.max(0, Math.ceil((new Date(sub.end_date) - Date.now()) / 86400000)) : 0;

    // The resolved price — override, add-ons and coupon included, not just the plan
    // floor. Fail-soft to the stored plan number if the chain cannot run, because a
    // billing page that renders nothing is worse than one missing the discount line,
    // but log it loudly: a silent zero is the failure mode KI-120 was made of.
    let resolved = null;
    try {
      resolved = await require('../../services/pricing').resolveForOrg(orgId);
    } catch (e) {
      require('../../utils/logger').error(`plans.mySubscription: price resolution failed for org ${orgId} — ${e.message}`);
    }

    return res.json({ success: true, subscription: {
      ...sub,
      // mysql2 hydrates a JSON column into a real array already — JSON.parse on it
      // throws, which is how this same shape once silently emptied a whole plan ladder.
      features: typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features,
      days_left: daysLeft,
      payable_display: resolved?.payableDisplay ?? null,
      list_display: resolved?.listDisplay ?? null,
      discounted: resolved ? resolved.payablePaise < resolved.listPaise : false,
      students: resolved?.students ?? null,
    }});
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};
