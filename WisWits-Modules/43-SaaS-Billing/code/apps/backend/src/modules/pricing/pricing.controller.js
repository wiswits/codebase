'use strict';
/**
 * THE PRICING CONTROL PLANE — the owner's write surface, and the only one.
 *
 * Everything here is platform-owner-only, enforced in the routes by
 * `requirePlatformOrg` + `requireRole`. That is not defence in depth for its own sake:
 * pricing is deliberately NOT a governance dimension (PRICING_FLEXIBILITY_DESIGN §2),
 * because `platform.admin_can.<dim>` means "the org admin may self-serve this" and a
 * school self-serving its own subscription price is a school discounting itself to
 * zero. The hierarchy is ASYMMETRIC on purpose: WisWits sets the school's price and
 * the school reads it; the school sets its parents' fees.
 *
 * ── WHY THIS MODULE EXISTS INSTEAD OF EXTENDING `plans` ──────────────────────
 * `modules/plans` writes `pricing_plans`, which is a DISPLAY catalog — nothing bills
 * from it. Its edit screen looked like it set prices and did not, and migration 031
 * silently overwrote whatever was typed there. Rather than leave that trap in place
 * or bolt real behaviour onto a controller whose whole shape assumes a display table,
 * the real catalog gets its own module and `plans`' edit endpoints are retired
 * (see plans.controller for the tombstone).
 *
 * ── EVERY WRITE MARKS AND AUDITS ─────────────────────────────────────────────
 * A plan edit sets `owner_edited = 1` so migration 031 stops treating its hardcoded
 * array as authoritative for that row, and every write is audited under BILLING with
 * the before and after. "Why is this school paying ₹7,000" has to be answerable in a
 * renewal conversation, and a changed number with no record cannot answer it.
 */
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const pricing = require('../../services/pricing');
const catalog = require('../../services/pricing/catalog');
const slabsSvc = require('../../services/pricing/slabs');

/* ─────────────────────────── SHARED PLUMBING ─────────────────────────────── */

/**
 * The plan columns migration 033 adds. Selected separately so this controller keeps
 * working against a database where 033 has not been applied — the owner pricing screen
 * is where you would go to find that out, so it must not be the thing that breaks.
 */
const COMMERCE_PLAN_COLUMNS =
  'pack_discount_percent, label_en, name_native, name_roman, name_root, name_meaning';

const PLAN_BASE_COLUMNS =
  `id, slug, name, tagline, billing_mode, rate_per_student, price_floor,
   price_monthly, price_annual, annual_months_charged, max_students,
   ai_credits, storage_gb, whitelabel, is_custom, is_active, sort_order,
   institution_types, owner_edited`;

/** Every plan row, with the commerce columns when they exist and NULLs when they do not. */
async function planRows(where = '', params = []) {
  const sql = (cols) => `SELECT ${cols} FROM client_subscription_plans ${where} ORDER BY sort_order, id`;
  return query(sql(`${PLAN_BASE_COLUMNS}, ${COMMERCE_PLAN_COLUMNS}`), params)
    .catch(() => query(sql(PLAN_BASE_COLUMNS), params).then((rows) => rows.map((r) => ({
      ...r, pack_discount_percent: null, label_en: null,
      name_native: null, name_roman: null, name_root: null, name_meaning: null,
    }))));
}

/**
 * `pricing_plans` is a DISPLAY MIRROR, written in the SAME request as the billing row.
 *
 * Factored out because it is the parity-critical half of every plan write and there are
 * now two of them (`updatePlan` and `acceptSuggested`). Two copies of a mirror is how
 * /superadmin/pricing came to advertise ₹999/₹2,999/₹7,999 while the biller had moved
 * on (KI-120). Fail-soft with a log, exactly as before: a mirror that cannot be written
 * must not roll back a price the owner has already been told was saved — the parity
 * gate is what catches the divergence.
 */
async function mirrorDisplay(slug, { name, tagline, priceFloor, months, maxStudents, isActive }) {
  return query(
    `UPDATE pricing_plans SET name = ?, tagline = ?, price_monthly = ?, price_yearly = ?,
            max_students = ?, is_active = ?
      WHERE slug = ?`,
    [name, tagline, priceFloor, priceFloor * months, maxStudents, isActive, slug])
    .catch((e) => logger.error(`pricing.mirrorDisplay(${slug}): ${e.message}`));
}

/**
 * A module's sales lifecycle. Ordered from "not for sale" to "sold to everyone", then
 * `retired` — which is an END state and not a step backwards: it stops NEW sales and
 * changes nothing for a customer who already has it.
 */
const MODULE_LIFECYCLE = ['draft', 'internal', 'beta', 'live', 'retired'];
/** Statuses that take a module OFF the shelf entirely. Refused while somebody pays for it. */
const WITHDRAWN_STATUSES = ['draft', 'internal'];

/** Missing-column errors get a sentence that names the fix instead of a 500. */
const isMissingColumn = (err) => err && (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(err.message || ''));
const MIGRATION_HINT =
  'This needs the commerce columns. Run: node scripts/migrations/033_commerce_slabs.js --apply';

/* ─────────────────────────────── THE CATALOG ─────────────────────────────── */

/**
 * GET /api/pricing/catalog — everything the owner screen needs, in one call.
 *
 * One round trip rather than five, because the screen is useless with a partial
 * picture: a plan's price only means something next to what it grants and what those
 * modules list for.
 */
exports.getCatalog = async (req, res) => {
  try {
    const [plans, modules, prices, grants, meters, overrides, curve, priceSettings, rates] = await Promise.all([
      planRows(),
      query(`SELECT module_key, name, category, sort_order, status, institution_types, depends_on, installable
               FROM platform_modules ORDER BY sort_order, name`),
      catalog.modulePriceRows(),
      catalog.allPlanModules(),
      catalog.meterRates(),
      // Per-org overrides, listed so the owner can see every deal in one place rather
      // than discovering them one tenant at a time.
      query(`SELECT s.org_id, o.name AS org_name, o.type, s.id AS subscription_id,
                    s.override_paise, s.override_scope, s.override_reason, s.override_at, s.billing_cycle,
                    s.status, p.slug AS plan_slug, p.name AS plan_name
               FROM client_subscriptions s
               JOIN client_organizations o ON o.id = s.org_id
               JOIN client_subscription_plans p ON p.id = s.plan_id
              WHERE s.override_paise IS NOT NULL
              ORDER BY s.override_at DESC`).catch(() => []),
      slabsSvc.slabs(),
      slabsSvc.settings(),
      slabsSvc.baseRates(),
    ]);

    // List value per plan, computed HERE and not in the browser. A saving computed in
    // the UI is a second implementation of the discount, and the whole point of this
    // rebuild is that there is one. The SUGGESTED rate rides along for the same reason
    // — and it is a suggestion: nothing here writes it. See services/pricing/slabs.js.
    const priceMap = await catalog.modulePrices();
    const enriched = [];
    for (const p of plans) {
      const value = await catalog.catalogValue(p, priceMap);
      const suggested = await slabsSvc.suggestFor(p, {
        slabs: curve, rates, settings: priceSettings, grants: grants[p.slug] || [],
      });
      enriched.push({
        ...p,
        institution_types: pricing.typesOf(p),
        modules: grants[p.slug] || [],
        moduleCount: (grants[p.slug] || []).length,
        listValue: value,
        suggested,
      });
    }

    return success(res, {
      plans: enriched,
      modules,
      modulePrices: prices,
      meters,
      overrides,
      slabs: curve,
      settings: { min_billable_students: priceSettings.min_billable_students },
      internalKeys: catalog.INTERNAL_KEYS,
      lifecycle: MODULE_LIFECYCLE,
    });
  } catch (err) {
    logger.error(`pricing.getCatalog: ${err.message}`);
    return error(res, 'Failed to load the pricing catalog', 500, err.message);
  }
};

/* ─────────────────────────────── PLAN PRICES ─────────────────────────────── */

/**
 * PATCH /api/pricing/plans/:id — the plan's own price. THE billed number.
 *
 * `price_monthly` and `price_annual` are not accepted from the client: they are
 * DERIVED here from the floor and the months charged. Letting a caller send all four
 * numbers is how the display price and the billed floor drifted apart in the first
 * place — pricing_catalog_check exists to catch that, and not being able to create it
 * is better than catching it.
 */
exports.updatePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = await queryOne('SELECT * FROM client_subscription_plans WHERE id = ?', [id]);
    if (!before) return error(res, 'Plan not found', 404);

    const b = req.body || {};
    const num = (v, fallback) => (v === undefined || v === null || v === '' ? fallback : Number(v));

    const billingMode = b.billing_mode === 'per_student' || b.billing_mode === 'flat'
      ? b.billing_mode : before.billing_mode;
    const priceFloor = num(b.price_floor, Number(before.price_floor ?? 0));
    const ratePerStudent = billingMode === 'per_student'
      ? num(b.rate_per_student, before.rate_per_student === null ? null : Number(before.rate_per_student))
      // A flat plan with a per-student rate is a contradiction that priceFor would
      // silently ignore; NULLing it keeps the row honest about what it is.
      : null;
    const months = num(b.annual_months_charged, Number(before.annual_months_charged || 10));

    if (priceFloor < 0) return error(res, 'A price cannot be negative.', 400);
    if (billingMode === 'per_student' && (ratePerStudent === null || ratePerStudent < 0)) {
      return error(res, 'A per-student plan needs a rate per student.', 400);
    }
    if (months < 1 || months > 12) {
      return error(res, 'Months charged for an annual plan must be between 1 and 12.', 400);
    }
    // AK's rule 6, enforced rather than remembered: the list price never drops below
    // what the pack's own modules list for. A 4xx, not a 5xx — production masks 5xx
    // bodies, so an honest refusal has to be a 4xx or the owner reads "Something went
    // wrong on our side".
    if (billingMode === 'per_student' && ratePerStudent) {
      const value = await catalog.catalogValue({ ...before, slug: before.slug, billing_mode: billingMode, rate_per_student: ratePerStudent });
      if (value.listRupees > 0 && ratePerStudent >= value.listRupees) {
        return error(res,
          `₹${ratePerStudent} per student is at or above what this pack's ${value.modules} modules list for ` +
          `(₹${value.listRupees}). The list price should stay above the pack price — raise the module rates ` +
          'or lower the pack price.', 400);
      }
    }

    // ── THE NAME AND THE LABEL ────────────────────────────────────────────
    // AK, 2026-07-28: the Sanskrit word is the NAME, the English word is the LABEL, and
    // the Devanagari / pronunciation / root / meaning live beside them so the app and
    // wiswits.com render ONE callout from ONE source. The SLUG never changes — it is
    // FK'd from platform_plan_modules and matched by every gate script.
    const name = b.name ?? before.name;
    const tagline = b.tagline ?? before.tagline;
    const maxStudents = b.max_students === undefined ? before.max_students
      : (b.max_students === null || b.max_students === '' ? null : Number(b.max_students));
    const isActive = b.is_active === undefined ? before.is_active : (b.is_active ? 1 : 0);

    // A whitelist of column names (never client-supplied identifiers) with
    // parameterized values, so an un-migrated database only loses the new fields
    // instead of failing the whole save.
    const extras = [];
    const extraVals = [];
    const takeExtra = (col, value) => { extras.push(`\`${col}\` = ?`); extraVals.push(value); };
    if (b.pack_discount_percent !== undefined) {
      const d = b.pack_discount_percent === null || b.pack_discount_percent === ''
        ? null : Number(b.pack_discount_percent);
      // 100% is not a discount, it is a giveaway with a suggestion engine attached.
      if (d !== null && (!Number.isFinite(d) || d < 0 || d >= 100)) {
        return error(res, 'A pack discount must be 0 or more and below 100.', 400);
      }
      takeExtra('pack_discount_percent', d);
    }
    for (const [key, col] of [['label_en', 'label_en'], ['name_native', 'name_native'],
      ['name_roman', 'name_roman'], ['name_root', 'name_root'], ['name_meaning', 'name_meaning']]) {
      if (b[key] !== undefined) takeExtra(col, b[key] === '' ? null : b[key]);
    }

    const setCore =
      `name = ?, tagline = ?, billing_mode = ?, rate_per_student = ?, price_floor = ?,
       price_monthly = ?, price_annual = ?, annual_months_charged = ?,
       max_students = ?, ai_credits = ?, storage_gb = ?, whitelabel = ?,
       is_active = ?, sort_order = ?, owner_edited = 1`;
    const coreVals = [name, tagline, billingMode, ratePerStudent, priceFloor,
      // Derived, not accepted. The display number IS the floor; the annual number IS
      // the floor × the months actually charged.
      priceFloor, priceFloor * months, months, maxStudents,
      b.ai_credits === undefined ? before.ai_credits : (b.ai_credits === null || b.ai_credits === '' ? null : Number(b.ai_credits)),
      b.storage_gb === undefined ? before.storage_gb : (b.storage_gb === null || b.storage_gb === '' ? null : Number(b.storage_gb)),
      b.whitelabel === undefined ? before.whitelabel : (b.whitelabel ? 1 : 0),
      isActive, num(b.sort_order, before.sort_order)];

    try {
      await query(`UPDATE client_subscription_plans SET ${[setCore, ...extras].join(', ')} WHERE id = ?`,
        [...coreVals, ...extraVals, id]);
    } catch (e) {
      if (extras.length && isMissingColumn(e)) return error(res, MIGRATION_HINT, 400);
      throw e;
    }

    // The display mirror follows the billed number in the SAME request. Two tables
    // updated at different times is how /superadmin/pricing came to advertise
    // ₹999/₹2,999/₹7,999 — prices that existed nowhere else — while the biller had
    // moved on.
    await mirrorDisplay(before.slug, { name, tagline, priceFloor, months, maxStudents, isActive });

    await audit(req, 'BILLING', 'subscription_plan', id, {
      old_data: { name: before.name, rate_per_student: before.rate_per_student,
                  price_floor: before.price_floor, billing_mode: before.billing_mode,
                  pack_discount_percent: before.pack_discount_percent ?? null,
                  label_en: before.label_en ?? null },
      new_data: { action: 'plan_price_update', name, rate_per_student: ratePerStudent,
                  price_floor: priceFloor, billing_mode: billingMode,
                  ...Object.fromEntries(extras.map((c, i) => [c.replace(/[` ]|=|\?/g, ''), extraVals[i]])) },
    });
    return success(res, { id }, 'Plan price updated');
  } catch (err) {
    logger.error(`pricing.updatePlan: ${err.message}`);
    return error(res, 'Failed to update the plan', 500, err.message);
  }
};

/* ─────────────────────── THE CURVE AND THE SUGGESTION ────────────────────── */

/**
 * PUT /api/pricing/slabs — replace the whole volume curve.
 *
 * The WHOLE curve, never one band. A curve is a set of adjacent ranges; editing one row
 * in isolation is how a gap or an overlap appears, and either one means a headcount with
 * no answer or two. Validation is in `services/pricing/slabs.js` next to the arithmetic
 * that consumes it, and every refusal is a 4xx with a sentence — production masks 5xx
 * bodies, so a 500 here reads as "Something went wrong on our side".
 */
exports.setSlabs = async (req, res) => {
  try {
    const list = Array.isArray(req.body?.slabs) ? req.body.slabs : null;
    if (!list) return error(res, 'Send a slabs array.', 400);

    const problem = slabsSvc.validateSlabs(list);
    if (problem) return error(res, problem, 400);

    // `min_billable_students` rides along on the same request because it is edited on
    // the same screen and means the same thing — "how a small school is priced". A
    // separate endpoint for one integer would be a second save button for one idea.
    let minBillable;
    if (req.body.min_billable_students !== undefined) {
      minBillable = Number(req.body.min_billable_students);
      if (!Number.isInteger(minBillable) || minBillable < 1) {
        return error(res, 'The minimum billable headcount must be a whole number of 1 or more.', 400);
      }
    }

    const before = await slabsSvc.slabs();
    const beforeSettings = await slabsSvc.settings();
    const rows = list
      .map((s) => ({
        min: Number(s.min_students),
        max: s.max_students === null || s.max_students === undefined || s.max_students === '' ? null : Number(s.max_students),
        mult: Number(s.multiplier),
      }))
      .sort((a, b) => a.min - b.min);

    // Replace rather than diff, for the same reason `setPlanModules` does: a partial
    // update leaves "was that band deleted or just not sent?" unanswerable.
    try {
      await query('DELETE FROM platform_price_slabs');
      for (const [i, r] of rows.entries()) {
        await query(
          'INSERT INTO platform_price_slabs (min_students, max_students, multiplier, sort_order, updated_by) VALUES (?,?,?,?,?)',
          [r.min, r.max, r.mult, (i + 1) * 10, req.user?.user_id || null]);
      }
      if (minBillable !== undefined) {
        await query(
          `INSERT INTO platform_price_settings (id, min_billable_students, updated_by) VALUES (1,?,?)
           ON DUPLICATE KEY UPDATE min_billable_students = VALUES(min_billable_students),
                                   updated_by = VALUES(updated_by)`,
          [minBillable, req.user?.user_id || null]);
      }
    } catch (e) {
      if (isMissingColumn(e) || /doesn't exist/i.test(e.message)) return error(res, MIGRATION_HINT, 400);
      throw e;
    }

    await audit(req, 'BILLING', 'price_slab', null, {
      old_data: { slabs: before.map((s) => [s.min_students, s.max_students, s.multiplier]),
                  min_billable_students: beforeSettings.min_billable_students },
      new_data: { action: 'slabs_replaced', slabs: rows.map((r) => [r.min, r.max, r.mult]),
                  min_billable_students: minBillable ?? beforeSettings.min_billable_students },
    });
    return success(res, { slabs: await slabsSvc.slabs(), settings: await slabsSvc.settings() },
      `Volume curve saved — ${rows.length} band${rows.length === 1 ? '' : 's'}`);
  } catch (err) {
    logger.error(`pricing.setSlabs: ${err.message}`);
    return error(res, 'Failed to save the volume curve', 500, err.message);
  }
};

/**
 * POST /api/pricing/plans/:id/accept-suggested — the owner takes the suggestion.
 *
 * ⚠ THIS IS THE ONLY PATH THAT TURNS A SUGGESTION INTO A PRICE, AND THAT IS THE POINT.
 * `catalog.js` explains why a plan price is deliberately not the sum of its modules: if
 * it were, editing one module's rate would silently reprice every plan and contradict
 * wiswits.com. So the arithmetic is offered everywhere and applied HERE, once, by a
 * person, with the old and the new number on the audit record.
 */
exports.acceptSuggested = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = (await planRows('WHERE id = ?', [id]))[0];
    if (!before) return error(res, 'Plan not found', 404);
    if (Number(before.is_custom)) {
      return error(res, 'This plan is priced in a conversation — there is no rate to compute for it.', 400);
    }

    const s = await slabsSvc.suggestFor(before);
    if (s.packDiscountPercent === null) {
      return error(res, 'Set a pack discount for this plan first — without one the suggestion is just the module list.', 400);
    }
    if (s.unpriced.length) {
      // Accepting a number that silently counted a module as ₹0 would set a real price
      // from an incomplete sum, and nobody would know which module was missing.
      return error(res,
        `${s.unpriced.length} module${s.unpriced.length === 1 ? '' : 's'} in this plan (${s.unpriced.join(', ')}) ` +
        `have no ${s.unit} rate, so the suggestion counts them as free. Price them first.`, 400);
    }
    if (!s.atBase || s.atBase <= 0) {
      return error(res, 'The suggested rate comes to zero — check the module rates and the pack discount.', 400);
    }

    const perStudent = before.billing_mode === 'per_student';
    const ratePerStudent = perStudent ? s.atBase : null;
    // `price_floor` remains the stored, billed column. What changes is where the number
    // comes from: one `min_billable_students` setting instead of three separate floors.
    const priceFloor = s.derivedFloor;
    const months = Number(before.annual_months_charged || 10);

    // AK's rule 6 still applies to a suggested number: the list must stay above the pack
    // price. It holds by arithmetic whenever the discount is above zero, but the guard
    // stays because the discount is editable and a 0% one would walk straight past it.
    if (perStudent && ratePerStudent) {
      const value = await catalog.catalogValue({ ...before, rate_per_student: ratePerStudent });
      if (value.listRupees > 0 && ratePerStudent >= value.listRupees) {
        return error(res,
          `The suggested ₹${ratePerStudent} per student is at or above what this pack's ${value.modules} modules ` +
          `list for (₹${value.listRupees}). Raise the pack discount, or the list price would sit below the pack price.`, 400);
      }
    }

    await query(
      `UPDATE client_subscription_plans
          SET rate_per_student = ?, price_floor = ?, price_monthly = ?, price_annual = ?, owner_edited = 1
        WHERE id = ?`,
      [ratePerStudent, priceFloor, priceFloor, priceFloor * months, id]);
    await mirrorDisplay(before.slug, {
      name: before.name, tagline: before.tagline, priceFloor, months,
      maxStudents: before.max_students, isActive: before.is_active,
    });

    await audit(req, 'BILLING', 'subscription_plan', id, {
      old_data: { rate_per_student: before.rate_per_student, price_floor: before.price_floor },
      new_data: { action: 'plan_accept_suggested', rate_per_student: ratePerStudent, price_floor: priceFloor,
                  base_sum: s.baseSum, pack_discount_percent: s.packDiscountPercent,
                  min_billable_students: s.minBillableStudents },
    });
    return success(res, { id, rate_per_student: ratePerStudent, price_floor: priceFloor, suggested: s },
      perStudent
        ? `${before.name} is now ₹${ratePerStudent} per student, minimum ₹${priceFloor}`
        : `${before.name} is now ₹${priceFloor} per month`);
  } catch (err) {
    logger.error(`pricing.acceptSuggested: ${err.message}`);
    return error(res, 'Failed to apply the suggested price', 500, err.message);
  }
};

/**
 * PUT /api/pricing/plans/:slug/modules — compose a plan by ticking modules.
 *
 * The whole set is replaced, not diffed, because a plan IS its set of modules and a
 * partial update leaves the question "was that module removed or just not sent?"
 * unanswerable. Internal keys are stripped rather than rejected — a UI sending them is
 * a UI bug, and refusing the entire save because of one key nobody meant to include
 * would be worse than dropping it.
 */
exports.setPlanModules = async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const plan = await queryOne('SELECT id, slug, name FROM client_subscription_plans WHERE slug = ?', [slug]);
    if (!plan) return error(res, 'Plan not found', 404);

    const wanted = Array.isArray(req.body?.modules) ? req.body.modules.map(String) : null;
    if (!wanted) return error(res, 'Send a modules array.', 400);

    const real = new Set((await query('SELECT module_key FROM platform_modules')).map((r) => r.module_key));
    const keep = [...new Set(wanted)].filter((k) => real.has(k) && !catalog.INTERNAL_KEYS.includes(k));
    const unknown = wanted.filter((k) => !real.has(k));

    // ── THE SPINE GUARD ────────────────────────────────────────────────────
    // A plan with no students, no staff and no reports is a gutted product. It is
    // invisible while plan_gating is off and guts the product the hour it goes on —
    // migration 031's dry run caught exactly that once, and nothing else did. So the
    // API refuses it too, because the next person to compose a plan will do it from
    // a screen and not from a migration.
    const SPINE = ['students', 'learner_records', 'staff', 'staff_hrms', 'reports', 'reports_analytics'];
    const presentSpine = SPINE.filter((k) => real.has(k));
    const missing = presentSpine.filter((k) => !keep.includes(k));
    // Only enforced when the registry HAS a spine module of that name, and only for a
    // plan that is meant to be sold — an inactive or custom plan can be anything.
    if (missing.length && presentSpine.length) {
      return error(res,
        `This plan would have no ${missing.join(', ')}. Every plan needs the basics — ` +
        'students, staff and reports — or a paying customer loses them the moment plan ' +
        'gating is switched on.', 400);
    }

    // Replace the set authoritatively: a module moved from Complete down to Core must
    // not stay granted in both.
    await query('DELETE FROM platform_plan_modules WHERE plan_slug = ?', [slug]);
    for (const k of keep) {
      await query(
        `INSERT INTO platform_plan_modules (plan_slug, module_key, granted) VALUES (?,?,1)
         ON DUPLICATE KEY UPDATE granted = 1`, [slug, k]);
    }

    await audit(req, 'BILLING', 'subscription_plan', plan.id, {
      new_data: { action: 'plan_modules_set', plan_slug: slug, count: keep.length, modules: keep },
    });
    return success(res, { plan_slug: slug, count: keep.length, ignored: unknown },
      `${plan.name} now includes ${keep.length} module${keep.length === 1 ? '' : 's'}`);
  } catch (err) {
    logger.error(`pricing.setPlanModules: ${err.message}`);
    return error(res, 'Failed to save the plan modules', 500, err.message);
  }
};

/* ──────────────────────────── MODULE LIST PRICES ─────────────────────────── */

/** PUT /api/pricing/modules/:key — the list rate for one module, per unit. */
exports.setModulePrice = async (req, res) => {
  try {
    const moduleKey = String(req.params.key);
    const unit = String(req.body?.billing_unit || '');
    const rate = Number(req.body?.rate);

    if (!['month', 'year', 'student', 'user'].includes(unit)) {
      return error(res, 'Billing unit must be month, year, student or user.', 400);
    }
    if (!Number.isFinite(rate) || rate < 0) return error(res, 'Enter a rate of 0 or more.', 400);
    if (catalog.INTERNAL_KEYS.includes(moduleKey)) {
      return error(res, 'That module is internal to WisWits and is not sold.', 400);
    }
    const exists = await queryOne('SELECT module_key FROM platform_modules WHERE module_key = ?', [moduleKey]);
    if (!exists) return error(res, 'Unknown module.', 404);

    const sellable = req.body?.is_sellable === undefined ? 1 : (req.body.is_sellable ? 1 : 0);
    // ⚠ The per-user promise, enforced at the write. wiswits.com says "Every login
    // free" and the Terms say "We never charge per user". Storing a per-user rate is
    // allowed; SELLING one contradicts a published promise, so it is refused here
    // rather than discovered by a customer. Changing this means changing the website
    // and the Terms in the same commit.
    if (unit === 'user' && sellable) {
      return error(res,
        'Per-user pricing cannot be sold yet: wiswits.com says "Every login free" and the Terms say ' +
        '"We never charge per user". Save it as not-sellable, or change the website and Terms first.', 400);
    }

    const before = await queryOne(
      'SELECT rate FROM platform_module_prices WHERE module_key = ? AND billing_unit = ?', [moduleKey, unit]);

    await query(
      `INSERT INTO platform_module_prices (module_key, billing_unit, rate, is_sellable, notes, updated_by)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE rate = VALUES(rate), is_sellable = VALUES(is_sellable),
                               notes = VALUES(notes), updated_by = VALUES(updated_by)`,
      // The note is overwritten so the row stops being marked 'seeded from …' — that
      // marker is what `032 --reseed` uses to decide it may recompute a row. An
      // owner-set rate must never be recomputed.
      [moduleKey, unit, rate, sellable, `set by owner`, req.user?.user_id || null]);

    await audit(req, 'BILLING', 'module_price', null, {
      old_data: before ? { rate: before.rate } : null,
      new_data: { action: 'module_price_set', module_key: moduleKey, billing_unit: unit, rate, is_sellable: !!sellable },
    });
    return success(res, { module_key: moduleKey, billing_unit: unit, rate }, 'Module rate saved');
  } catch (err) {
    logger.error(`pricing.setModulePrice: ${err.message}`);
    return error(res, 'Failed to save the module rate', 500, err.message);
  }
};

/* ─────────────────────────── THE MODULE REGISTRY ─────────────────────────── */
/**
 * Creating and retiring the things we sell. `platform_modules` is the registry every
 * other pricing table points at by `module_key`, so a key is effectively permanent:
 * `platform_module_prices`, `platform_plan_modules` and `client_subscription_addons`
 * all reference it as a string. That is why the key is validated hard on the way in and
 * never editable afterwards, and why nothing here deletes a row — §15 is mark →
 * migrate → remove, and for a module somebody pays for, the mark is `retired`.
 */

/** Lowercase, starts with a letter, 3-64 chars. The same shape every existing key has. */
const MODULE_KEY_RE = /^[a-z][a-z0-9_]{2,63}$/;

const jsonColumn = (v) => {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'string') return v;                 // already JSON from the client
  return JSON.stringify(v);
};

/** POST /api/pricing/modules — add a module to the registry. Starts at `draft`. */
exports.createModule = async (req, res) => {
  try {
    const b = req.body || {};
    const key = String(b.module_key || '').trim().toLowerCase();
    const name = String(b.name || '').trim();

    if (!MODULE_KEY_RE.test(key)) {
      return error(res,
        'A module key must be 3-64 characters: lowercase letters, numbers and underscores, starting with a letter.', 400);
    }
    if (catalog.INTERNAL_KEYS.includes(key)) {
      return error(res, 'That key is reserved for WisWits\' own back office and is never sold.', 400);
    }
    if (!name) return error(res, 'Give the module a name — it is what the owner and the plan editor read.', 400);

    const dup = await queryOne('SELECT module_key FROM platform_modules WHERE module_key = ?', [key]);
    if (dup) return error(res, 'A module with that key already exists.', 409);

    // A new module is NOT for sale. `draft` is the only honest starting state: it has no
    // rate yet, so anything that showed it in a plan would be showing a free module.
    const r = await query(
      `INSERT INTO platform_modules
         (module_key, name, category, status, sort_order, institution_types, depends_on, installable)
       VALUES (?,?,?,'draft',?,?,?,1)`,
      [key, name, String(b.category || 'general'),
       b.sort_order === undefined || b.sort_order === '' ? 0 : Number(b.sort_order),
       jsonColumn(b.institution_types), jsonColumn(b.depends_on)]);

    await audit(req, 'BILLING', 'platform_module', r.insertId, {
      new_data: { action: 'module_created', module_key: key, name, status: 'draft' },
    });
    return success(res, { module_key: key, status: 'draft' },
      `${name} added as a draft — set a rate before it can go to beta or live`);
  } catch (err) {
    logger.error(`pricing.createModule: ${err.message}`);
    return error(res, 'Failed to create the module', 500, err.message);
  }
};

/**
 * PATCH /api/pricing/modules/:key — everything about a module EXCEPT its key and status.
 *
 * The key is immutable (three tables reference it as a string) and the status has its
 * own endpoint because it carries rules the other fields do not.
 */
exports.updateModule = async (req, res) => {
  try {
    const key = String(req.params.key);
    if (catalog.INTERNAL_KEYS.includes(key)) {
      return error(res, 'That module is internal to WisWits and is not part of the catalogue.', 400);
    }
    const before = await queryOne('SELECT * FROM platform_modules WHERE module_key = ?', [key]);
    if (!before) return error(res, 'Unknown module.', 404);

    const b = req.body || {};
    if (b.name !== undefined && !String(b.name).trim()) {
      return error(res, 'A module needs a name.', 400);
    }
    await query(
      `UPDATE platform_modules
          SET name = ?, category = ?, sort_order = ?, institution_types = ?, depends_on = ?
        WHERE module_key = ?`,
      [b.name === undefined ? before.name : String(b.name).trim(),
       b.category === undefined ? before.category : String(b.category),
       b.sort_order === undefined || b.sort_order === '' ? before.sort_order : Number(b.sort_order),
       b.institution_types === undefined ? before.institution_types : jsonColumn(b.institution_types),
       b.depends_on === undefined ? before.depends_on : jsonColumn(b.depends_on),
       key]);

    // ── volume_exempt LIVES ON THE RATE ROWS, NOT ON THE MODULE ─────────────
    // It is a property of how the module is PRICED, so it sits beside the rate it
    // modifies — same table, same edit, no second place to forget. A module with no rate
    // rows yet has nowhere to store it, and saying so beats silently doing nothing.
    let exemptNote = '';
    if (b.volume_exempt !== undefined) {
      const flag = b.volume_exempt ? 1 : 0;
      try {
        const r = await query('UPDATE platform_module_prices SET volume_exempt = ? WHERE module_key = ?', [flag, key]);
        if (!r.affectedRows) {
          exemptNote = ' (no rate rows yet, so the volume setting has nothing to apply to — set a rate first)';
        }
      } catch (e) {
        if (isMissingColumn(e)) return error(res, MIGRATION_HINT, 400);
        throw e;
      }
    }

    await audit(req, 'BILLING', 'platform_module', before.id, {
      old_data: { name: before.name, category: before.category, sort_order: before.sort_order },
      new_data: { action: 'module_updated', module_key: key, name: b.name, category: b.category,
                  volume_exempt: b.volume_exempt },
    });
    return success(res, { module_key: key }, `Module saved${exemptNote}`);
  } catch (err) {
    logger.error(`pricing.updateModule: ${err.message}`);
    return error(res, 'Failed to save the module', 500, err.message);
  }
};

/**
 * POST /api/pricing/modules/:key/lifecycle — draft → internal → beta → live → retired.
 *
 * Two rules, and both exist because the alternative is silent:
 *
 *  1. **No sale without a price.** Promoting to beta or live with no sellable rate puts
 *     a module in front of a customer that nothing can charge for. `resolveForOrg`
 *     reports such an add-on at ₹0 with "no catalog rate — NOT BILLED" rather than
 *     dropping it, precisely so it is visible — but the right place to stop it is here,
 *     before anybody is offered it.
 *  2. **Nothing is withdrawn from under a paying customer.** If any org holds it as a
 *     live add-on, it cannot go back to draft or internal. `retired` is the answer: new
 *     sales stop, existing customers keep exactly what they have and keep being billed
 *     for it. That is §15 (mark → migrate → remove) applied to a thing somebody pays
 *     for.
 */
exports.moduleLifecycle = async (req, res) => {
  try {
    const key = String(req.params.key);
    const status = String(req.body?.status || '').trim().toLowerCase();

    if (catalog.INTERNAL_KEYS.includes(key)) {
      return error(res, 'That module is internal to WisWits and has no sales lifecycle.', 400);
    }
    if (!MODULE_LIFECYCLE.includes(status)) {
      return error(res, `Status must be one of: ${MODULE_LIFECYCLE.join(', ')}.`, 400);
    }
    const before = await queryOne('SELECT * FROM platform_modules WHERE module_key = ?', [key]);
    if (!before) return error(res, 'Unknown module.', 404);
    if (before.status === status) return success(res, { module_key: key, status }, `Already ${status}`);

    if (['beta', 'live'].includes(status)) {
      const priced = await queryOne(
        'SELECT id FROM platform_module_prices WHERE module_key = ? AND is_sellable = 1 AND rate > 0', [key]);
      if (!priced) {
        return error(res,
          `${before.name} has no sellable rate, so nothing could charge for it. Set a rate before making it ${status}.`, 400);
      }
    }

    if (WITHDRAWN_STATUSES.includes(status)) {
      const live = await query(
        `SELECT a.org_id, o.name AS org_name
           FROM client_subscription_addons a
           LEFT JOIN client_organizations o ON o.id = a.org_id
          WHERE a.module_key = ? AND a.removed_at IS NULL`, [key]).catch(() => []);
      if (live.length) {
        return error(res,
          `${live.length} organisation${live.length === 1 ? '' : 's'} pay for ${before.name} today ` +
          `(${live.map((r) => r.org_name || `org ${r.org_id}`).join(', ')}). Taking it back to "${status}" would ` +
          'withdraw something they are being billed for. Retire it instead — that stops new sales and changes ' +
          'nothing for them.', 400);
      }
    }

    await query('UPDATE platform_modules SET status = ? WHERE module_key = ?', [status, key]);

    await audit(req, 'BILLING', 'platform_module', before.id, {
      old_data: { status: before.status },
      new_data: { action: 'module_lifecycle', module_key: key, status },
    });
    return success(res, { module_key: key, status },
      status === 'retired'
        ? `${before.name} retired — no new sales, and nothing changes for anyone who already has it`
        : `${before.name} is now ${status}`);
  } catch (err) {
    logger.error(`pricing.moduleLifecycle: ${err.message}`);
    return error(res, 'Failed to change the module status', 500, err.message);
  }
};

/* ────────────────────────────── METER RATES ──────────────────────────────── */

/**
 * PUT /api/pricing/meters/:key — sell rate and our cost, together.
 *
 * They are edited in one request on purpose. A sell rate saved without its cost is a
 * margin nobody checked, and "never in loss" is the mechanism the whole metered model
 * rests on.
 */
exports.setMeterRate = async (req, res) => {
  try {
    const key = String(req.params.key);
    const sell = Number(req.body?.sell_rate);
    const cost = req.body?.our_cost === null || req.body?.our_cost === undefined || req.body?.our_cost === ''
      ? null : Number(req.body.our_cost);

    if (!Number.isFinite(sell) || sell < 0) return error(res, 'Enter a sell rate of 0 or more.', 400);
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) return error(res, 'Enter a cost of 0 or more.', 400);
    // The never-in-loss rule, refused at the point of entry rather than found in a
    // month-end reconciliation. A 4xx so the owner actually reads why.
    if (cost !== null && sell > 0 && sell <= cost) {
      return error(res,
        `Selling at ₹${sell} when it costs us ₹${cost} loses money on every unit. ` +
        'Set a sell rate above the cost.', 400);
    }

    const before = await queryOne('SELECT * FROM platform_meter_rates WHERE meter_key = ?', [key]);
    if (!before) return error(res, 'Unknown meter.', 404);

    await query(
      `UPDATE platform_meter_rates
          SET sell_rate = ?, our_cost = ?, label = ?, unit = ?, is_provisional = ?,
              is_active = ?, updated_by = ?
        WHERE meter_key = ?`,
      [sell, cost, req.body?.label ?? before.label, req.body?.unit ?? before.unit,
       // A cost the owner has actually measured stops being provisional. Defaulting to
       // "still provisional" would leave the warning up forever after the measurement
       // week; defaulting to "measured" would quietly claim a number nobody checked.
       req.body?.is_provisional === undefined ? before.is_provisional : (req.body.is_provisional ? 1 : 0),
       req.body?.is_active === undefined ? before.is_active : (req.body.is_active ? 1 : 0),
       req.user?.user_id || null, key]);

    await audit(req, 'BILLING', 'meter_rate', null, {
      old_data: { sell_rate: before.sell_rate, our_cost: before.our_cost },
      new_data: { action: 'meter_rate_set', meter_key: key, sell_rate: sell, our_cost: cost },
    });
    return success(res, { meter_key: key, sell_rate: sell, our_cost: cost }, 'Meter rate saved');
  } catch (err) {
    logger.error(`pricing.setMeterRate: ${err.message}`);
    return error(res, 'Failed to save the meter rate', 500, err.message);
  }
};

/* ───────────────────────────── PER-ORG OVERRIDE ──────────────────────────── */

/**
 * PUT /api/pricing/orgs/:orgId/override — the deal.
 *
 * A monthly figure in RUPEES from the client, stored in paise. `reason` is required,
 * not optional: an unexplained discount is unauditable, and the person asked about it
 * in a renewal conversation two years from now will not be the person who set it.
 *
 * AK's rule is that this is locked for the customer's lifetime. That is not enforced
 * by making the column immutable — a genuine correction has to be possible — but every
 * change is audited with the old value, so a quiet reprice leaves a trail.
 */
exports.setOverride = async (req, res) => {
  try {
    const orgId = Number(req.params.orgId);
    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'Valid organisation id required.', 400);

    const sub = await queryOne(
      'SELECT id, override_paise FROM client_subscriptions WHERE org_id = ? ORDER BY id DESC LIMIT 1', [orgId]);
    if (!sub) return error(res, 'That organisation has no subscription to price.', 404);

    // Clearing an override is a distinct, deliberate action — not "send an empty
    // string and hope". Otherwise a half-filled form silently reverts a negotiated
    // price to the list price.
    const clear = req.body?.clear === true;
    const reason = String(req.body?.reason || '').trim();

    // ── THE AMOUNT MUST SAY WHAT IT MEANS ───────────────────────────────────
    // `monthly_rupees` is a per-month rate; `cycle_rupees` is the agreed TOTAL for the
    // cycle (a pilot priced as "₹51,000 for the session"). Exactly one is required,
    // because a bare number is ambiguous by a factor of ten or twelve and the wrong
    // reading is a wrong invoice to a real school. Refusing both-or-neither is cheaper
    // than guessing.
    const monthly = req.body?.monthly_rupees;
    const perCycle = req.body?.cycle_rupees;
    const given = [monthly, perCycle].filter((v) => v !== undefined && v !== null && v !== '');

    let paise = null, scope = 'monthly';
    if (!clear) {
      if (given.length !== 1) {
        return error(res,
          'Send exactly one of monthly_rupees (a price per month) or cycle_rupees ' +
          '(the agreed total for the whole billing cycle).', 400);
      }
      const amount = Number(given[0]);
      if (!Number.isFinite(amount) || amount < 0) return error(res, 'Enter a price of 0 or more.', 400);
      if (!reason) return error(res, 'Say why this price was agreed — it goes on the record.', 400);
      paise = Math.round(amount * 100);
      scope = perCycle !== undefined && perCycle !== null && perCycle !== '' ? 'cycle' : 'monthly';
    }

    await query(
      `UPDATE client_subscriptions
          SET override_paise = ?, override_scope = ?, override_reason = ?,
              override_by = ?, override_at = ?
        WHERE id = ?`,
      [paise, clear ? 'monthly' : scope, clear ? null : reason,
       clear ? null : (req.user?.user_id || null), clear ? null : new Date(), sub.id]);

    await audit(req, 'BILLING', 'subscription', sub.id, {
      old_data: { override_paise: sub.override_paise, override_scope: sub.override_scope },
      new_data: { action: clear ? 'override_cleared' : 'override_set', org_id: orgId,
                  override_paise: paise, override_scope: scope, reason: reason || null },
    });

    // Return the FULL resolved price, not just the number that was set. The owner
    // needs to see what the customer will actually be charged — override plus add-ons
    // minus coupon — and re-deriving that in the browser would be a second answer.
    const resolved = await pricing.resolveForOrg(orgId);
    return success(res, { org_id: orgId, resolved },
      clear ? 'Custom price removed — this organisation is back on its plan price' : 'Custom price saved');
  } catch (err) {
    logger.error(`pricing.setOverride: ${err.message}`);
    return error(res, 'Failed to save the custom price', 500, err.message);
  }
};

/** GET /api/pricing/orgs/:orgId — the full chain for one org, for the owner. */
exports.orgPrice = async (req, res) => {
  try {
    const orgId = Number(req.params.orgId);
    const resolved = await pricing.resolveForOrg(orgId);
    if (!resolved) return error(res, 'That organisation has no subscription.', 404);
    const addons = await query(
      `SELECT a.module_key, a.rate_locked, a.note, a.added_at, m.name
         FROM client_subscription_addons a
         LEFT JOIN platform_modules m
           ON m.module_key COLLATE utf8mb4_unicode_ci = a.module_key COLLATE utf8mb4_unicode_ci
        WHERE a.org_id = ? AND a.removed_at IS NULL ORDER BY a.added_at`, [orgId]).catch(() => []);
    return success(res, { resolved, addons });
  } catch (err) {
    logger.error(`pricing.orgPrice: ${err.message}`);
    return error(res, 'Failed to price that organisation', 500, err.message);
  }
};

/* ─────────────────────────────── ADD-ONS ─────────────────────────────────── */

/**
 * PUT /api/pricing/orgs/:orgId/addons/:key — a module this org PAYS for beyond its
 * pack.
 *
 * This is billing, not visibility. Granting ACCESS to a module is
 * `features/addon-grant`; this records that the org is charged for it. Keeping them
 * separate is deliberate — deriving the bill from the access flags would charge a
 * school for flipping its own self-serve toggle.
 */
exports.setAddon = async (req, res) => {
  try {
    const orgId = Number(req.params.orgId);
    const moduleKey = String(req.params.key);
    const remove = req.body?.remove === true;

    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'Valid organisation id required.', 400);
    if (catalog.INTERNAL_KEYS.includes(moduleKey)) {
      return error(res, 'That module is internal to WisWits and is not sold.', 400);
    }
    const exists = await queryOne('SELECT module_key FROM platform_modules WHERE module_key = ?', [moduleKey]);
    if (!exists) return error(res, 'Unknown module.', 404);

    if (remove) {
      // Soft-removed (§15 mark → migrate → remove): billing stops, the history that
      // explains an old invoice survives.
      await query('UPDATE client_subscription_addons SET removed_at = NOW() WHERE org_id = ? AND module_key = ?',
        [orgId, moduleKey]);
    } else {
      const rateLocked = req.body?.rate_locked === undefined || req.body?.rate_locked === null || req.body?.rate_locked === ''
        ? null : Number(req.body.rate_locked);
      if (rateLocked !== null && (!Number.isFinite(rateLocked) || rateLocked < 0)) {
        return error(res, 'Enter a locked rate of 0 or more, or leave it blank to use the catalog rate.', 400);
      }
      // A module already in the org's plan is not an add-on — charging for it would
      // bill the same thing twice.
      const planRow = await queryOne(
        `SELECT p.slug FROM client_subscriptions s
           JOIN client_subscription_plans p ON p.id = s.plan_id
          WHERE s.org_id = ? ORDER BY s.id DESC LIMIT 1`, [orgId]);
      if (planRow) {
        const inPlan = await queryOne(
          'SELECT 1 AS x FROM platform_plan_modules WHERE plan_slug = ? AND module_key = ? AND granted = 1',
          [planRow.slug, moduleKey]);
        if (inPlan) {
          return error(res, 'That module is already included in this organisation\'s plan — adding it would charge twice.', 400);
        }
      }
      await query(
        `INSERT INTO client_subscription_addons (org_id, module_key, rate_locked, added_by, note)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE rate_locked = VALUES(rate_locked), removed_at = NULL,
                                 added_by = VALUES(added_by), note = VALUES(note)`,
        [orgId, moduleKey, rateLocked, req.user?.user_id || null, req.body?.note || null]);
    }

    await audit(req, 'BILLING', 'subscription_addon', null, {
      new_data: { action: remove ? 'addon_removed' : 'addon_added', org_id: orgId, module_key: moduleKey },
    });
    const resolved = await pricing.resolveForOrg(orgId);
    return success(res, { org_id: orgId, resolved }, remove ? 'Add-on removed' : 'Add-on saved');
  } catch (err) {
    logger.error(`pricing.setAddon: ${err.message}`);
    return error(res, 'Failed to save the add-on', 500, err.message);
  }
};

/* ─────────────────────────────── COUPONS ─────────────────────────────────── */

/** GET /api/pricing/coupons — every coupon with its real redemption count. */
exports.listCoupons = async (req, res) => {
  try {
    // The count is a correlated subquery, not GROUP BY: MariaDB's only_full_group_by
    // rejects the grouped form as soon as you order by anything off the joined row,
    // and that failure is invisible behind a fail-soft catch (it already cost us a
    // silently-ignored discount once).
    const rows = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM platform_coupon_redemptions r WHERE r.coupon_id = c.id) AS redemptions,
              o.name AS restricted_org_name
         FROM platform_coupons c
         LEFT JOIN client_organizations o ON o.id = c.org_id
        WHERE c.level = 'subscription'
        ORDER BY c.is_active DESC, c.id DESC`);
    return success(res, { coupons: rows });
  } catch (err) {
    logger.error(`pricing.listCoupons: ${err.message}`);
    return error(res, 'Failed to load coupons', 500, err.message);
  }
};

/** POST /api/pricing/coupons — create a code. */
exports.createCoupon = async (req, res) => {
  try {
    const b = req.body || {};
    const code = String(b.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(code)) {
      return error(res, 'A code must be 3-40 characters: letters, numbers and dashes.', 400);
    }
    if (!['percent', 'amount'].includes(b.kind)) return error(res, 'Choose a percentage or a rupee amount.', 400);
    const value = Number(b.value);
    if (!Number.isFinite(value) || value <= 0) return error(res, 'Enter a discount above zero.', 400);
    if (b.kind === 'percent' && value > 100) return error(res, 'A percentage discount cannot exceed 100.', 400);
    if (!String(b.label || '').trim()) return error(res, 'Give the code a short label so it is recognisable later.', 400);

    const dup = await queryOne('SELECT id FROM platform_coupons WHERE code = ?', [code]);
    if (dup) return error(res, 'That code already exists.', 409);

    const r = await query(
      `INSERT INTO platform_coupons
         (code, label, level, owner_org_id, org_id, kind, value, applies_to, applies_key,
          session_tag, valid_from, valid_to, max_redemptions, per_org_limit, cycles, created_by)
       VALUES (?,?, 'subscription', NULL, ?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, String(b.label).trim(),
       b.org_id ? Number(b.org_id) : null,
       b.kind, value,
       ['any', 'plan', 'module', 'meter'].includes(b.applies_to) ? b.applies_to : 'any',
       b.applies_key || null, b.session_tag || null,
       b.valid_from || null, b.valid_to || null,
       b.max_redemptions === undefined || b.max_redemptions === '' || b.max_redemptions === null ? null : Number(b.max_redemptions),
       b.per_org_limit === undefined || b.per_org_limit === '' ? 1 : Number(b.per_org_limit),
       b.cycles === undefined || b.cycles === '' || b.cycles === null ? null : Number(b.cycles),
       req.user?.user_id || null]);

    await audit(req, 'BILLING', 'coupon', r.insertId, {
      new_data: { action: 'coupon_created', code, kind: b.kind, value, org_id: b.org_id || null },
    });
    return success(res, { id: r.insertId, code }, `Code ${code} created`);
  } catch (err) {
    logger.error(`pricing.createCoupon: ${err.message}`);
    return error(res, 'Failed to create the code', 500, err.message);
  }
};

/**
 * PATCH /api/pricing/coupons/:id — deactivate or adjust.
 *
 * A coupon is never DELETED while it has redemptions: the redemption rows explain why
 * a past invoice was what it was, and a cascade delete would erase that answer. This
 * is the §15 rule (mark → migrate → remove) applied to money.
 */
exports.updateCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = await queryOne('SELECT * FROM platform_coupons WHERE id = ?', [id]);
    if (!before) return error(res, 'Code not found', 404);

    const b = req.body || {};
    await query(
      `UPDATE platform_coupons
          SET label = ?, is_active = ?, valid_from = ?, valid_to = ?,
              max_redemptions = ?, per_org_limit = ?, cycles = ?, session_tag = ?
        WHERE id = ?`,
      [b.label ?? before.label,
       b.is_active === undefined ? before.is_active : (b.is_active ? 1 : 0),
       b.valid_from === undefined ? before.valid_from : (b.valid_from || null),
       b.valid_to === undefined ? before.valid_to : (b.valid_to || null),
       b.max_redemptions === undefined ? before.max_redemptions : (b.max_redemptions === '' || b.max_redemptions === null ? null : Number(b.max_redemptions)),
       b.per_org_limit === undefined ? before.per_org_limit : Number(b.per_org_limit),
       b.cycles === undefined ? before.cycles : (b.cycles === '' || b.cycles === null ? null : Number(b.cycles)),
       b.session_tag === undefined ? before.session_tag : (b.session_tag || null),
       id]);

    await audit(req, 'BILLING', 'coupon', id, {
      old_data: { is_active: before.is_active, value: before.value },
      new_data: { action: 'coupon_updated', code: before.code, is_active: b.is_active },
    });
    return success(res, { id }, 'Code updated');
  } catch (err) {
    logger.error(`pricing.updateCoupon: ${err.message}`);
    return error(res, 'Failed to update the code', 500, err.message);
  }
};

/**
 * POST /api/pricing/coupons/preview — what would this code do to this org's bill?
 *
 * Read-only. The owner sees the effect before promising it to a customer, and a
 * customer-facing "apply code" path can use the same endpoint, because the answer
 * comes from the one resolution chain either way.
 */
exports.previewCoupon = async (req, res) => {
  try {
    const orgId = Number(req.body?.org_id);
    const code = String(req.body?.code || '');
    if (!Number.isInteger(orgId) || orgId <= 0) return error(res, 'Choose an organisation.', 400);
    const resolved = await pricing.resolveForOrg(orgId, { couponCode: code });
    if (!resolved) return error(res, 'That organisation has no subscription.', 404);
    return success(res, { resolved });
  } catch (err) {
    logger.error(`pricing.previewCoupon: ${err.message}`);
    return error(res, 'Failed to preview the code', 500, err.message);
  }
};

/* ─────────────────────── THE CUSTOMER'S OWN VIEW ─────────────────────────── */

/**
 * GET /api/pricing/my-pack — what an org is paying for. READ-ONLY, by design.
 *
 * Any authenticated user of the org may read it; nobody in the org may change a
 * price. That asymmetry is the whole point (§2 of the design doc): the school sees
 * the number, never the control.
 *
 * Add-ons and plan changes are shown as what they are — a conversation or an upgrade
 * — rather than as an editable field, so nothing here implies the customer can move
 * their own price.
 */
exports.myPack = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const resolved = await pricing.resolveForOrg(orgId);
    if (!resolved) return success(res, { subscription: null, included: [], available: [] });

    const included = await catalog.planModules(resolved.plan.slug);
    const prices = await catalog.modulePrices();
    const plan = await queryOne('SELECT * FROM client_subscription_plans WHERE slug = ?', [resolved.plan.slug]);
    const includedKeys = new Set(included.map((m) => m.module_key));
    const paidKeys = new Set(resolved.addons.map((a) => a.moduleKey));

    // Everything else the catalog sells, priced for THIS org so the number shown is
    // the number they would actually be charged — not a generic list rate they would
    // then dispute.
    const all = await query(
      'SELECT module_key, name, category FROM platform_modules ORDER BY sort_order, name');
    const available = [];
    for (const m of all) {
      if (includedKeys.has(m.module_key) || paidKeys.has(m.module_key)) continue;
      if (catalog.INTERNAL_KEYS.includes(m.module_key)) continue;
      if (!prices[m.module_key]) continue;
      const p = await catalog.addonPriceFor(m.module_key, plan, resolved.students, resolved.cycle, prices);
      if (!p) continue;
      available.push({ module_key: m.module_key, name: m.name, category: m.category,
        price: pricing.formatInr(p.paise), basis: p.basis });
    }

    return success(res, {
      plan: resolved.plan,
      status: resolved.status,
      cycle: resolved.cycle,
      students: resolved.students,
      // The customer sees what they pay. The list price and the discount are shown
      // because AK's rule is to show the higher number and the discount — but the
      // override REASON is not sent: it is an internal note about a negotiation.
      payable: resolved.payableDisplay,
      listDisplay: resolved.listDisplay,
      discounted: resolved.payablePaise < resolved.listPaise,
      coupon: resolved.coupon && !resolved.coupon.invalid
        ? { code: resolved.coupon.code, label: resolved.coupon.label } : null,
      included: included.map((m) => ({ module_key: m.module_key, name: m.name, category: m.category })),
      paidAddons: resolved.addons.map((a) => ({ module_key: a.moduleKey, name: a.name, price: pricing.formatInr(a.paise) })),
      available,
    });
  } catch (err) {
    logger.error(`pricing.myPack: ${err.message}`);
    return error(res, 'Failed to load your plan', 500, err.message);
  }
};

/* ══════════════════════════════ CAMPAIGNS ═════════════════════════════════ */
/**
 * THE OFFER THAT MATCHES BY ITSELF.
 *
 * A coupon is typed; a campaign finds the customer. Schools should never have to hunt
 * for a code to receive what we are publicly offering — the ones who would miss it are
 * the ones least comfortable with software, which is the opposite of who this is for.
 *
 * Two rules are enforced HERE and nowhere else, because a UI can be bypassed by a curl:
 *
 *  1. **A campaign is born inactive and cannot be published without a simulation.**
 *     `POST /campaigns/:id/activate` refuses unless `simulated_at` is set AND the stored
 *     `simulation_fingerprint` still equals the campaign's current economics. Editing
 *     the reward after a simulation therefore invalidates that simulation instead of
 *     letting an unexamined number go live under an examined one's approval.
 *  2. **A percentage needs an end date** (COMMERCE.md §8). It is the most expensive
 *     thing in the box and it compounds with growth: 25% off a school that doubles is
 *     twice the give-away, with nobody deciding that.
 *
 * Nothing here deletes a campaign. The redemption rows explain old invoices, and the FK
 * is ON DELETE RESTRICT so the database holds that line too.
 */
const campaignsSvc = require('../../services/pricing/campaigns');

const CAMPAIGN_SLUG_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
/** The economic fields a caller may set. Everything else on the row is ours. */
const CAMPAIGN_EDITABLE = [
  'audience', 'match_institution_type', 'match_plan_slug', 'match_org_id', 'match_module_key',
  'match_cycle', 'applies_to', 'applies_key', 'reward_type', 'reward_value', 'reward_meta',
  'max_discount_paise', 'starts_on', 'ends_on', 'window_module_key', 'window_module_status',
  'cycles', 'max_redemptions', 'per_org_limit',
];

const nullableInt = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const nullableStr = (v) => (v === undefined || v === null || v === '' ? null : String(v));
const dateOnly = (v) => (v ? String(v).slice(0, 10) : null);

/**
 * Everything a campaign must be true about itself before it may exist.
 *
 * Every refusal is a 4xx with a sentence the owner can act on. Production masks 5xx
 * bodies, so a 500 here would read as "Something went wrong on our side" for what is
 * actually "you asked for a percentage with no end date".
 *
 * @param {object} b   the request body
 * @param {object} old the row being edited, when this is an update
 * @returns {{err?:string, row?:object}}
 */
function validateCampaign(b, old = null) {
  const get = (k, fallback) => (b[k] === undefined ? fallback : b[k]);
  const row = {
    audience: ['all', 'new', 'existing'].includes(get('audience', old?.audience)) ? get('audience', old?.audience) : 'all',
    match_institution_type: nullableStr(get('match_institution_type', old?.match_institution_type)),
    match_plan_slug: nullableStr(get('match_plan_slug', old?.match_plan_slug)),
    match_org_id: nullableInt(get('match_org_id', old?.match_org_id)),
    match_module_key: nullableStr(get('match_module_key', old?.match_module_key)),
    match_cycle: ['any', 'monthly', 'annual'].includes(get('match_cycle', old?.match_cycle)) ? get('match_cycle', old?.match_cycle) : 'any',
    applies_to: ['total', 'plan', 'module'].includes(get('applies_to', old?.applies_to)) ? get('applies_to', old?.applies_to) : 'total',
    applies_key: nullableStr(get('applies_key', old?.applies_key)),
    reward_type: String(get('reward_type', old?.reward_type) || '').trim(),
    reward_value: Number(get('reward_value', old?.reward_value) || 0),
    reward_meta: get('reward_meta', old?.reward_meta) ? JSON.stringify(
      typeof get('reward_meta', old?.reward_meta) === 'string'
        ? JSON.parse(get('reward_meta', old?.reward_meta)) : get('reward_meta', old?.reward_meta)) : null,
    max_discount_paise: nullableInt(get('max_discount_paise', old?.max_discount_paise)),
    starts_on: dateOnly(get('starts_on', old?.starts_on)),
    ends_on: dateOnly(get('ends_on', old?.ends_on)),
    window_module_key: nullableStr(get('window_module_key', old?.window_module_key)),
    window_module_status: nullableStr(get('window_module_status', old?.window_module_status)) || 'beta',
    cycles: nullableInt(get('cycles', old?.cycles)),
    max_redemptions: nullableInt(get('max_redemptions', old?.max_redemptions)),
    per_org_limit: Number(get('per_org_limit', old?.per_org_limit) ?? 1) || 1,
  };

  const spec = campaignsSvc.REWARD_TYPES[row.reward_type];
  if (!spec) {
    return { err: `Choose a reward: ${Object.keys(campaignsSvc.REWARD_TYPES).join(', ')}.` };
  }
  // The three that are billed arithmetic today. The other three (service, credits,
  // module_free) are stored and reported honestly as ₹0 against an invoice — they grant
  // something rather than discounting a line — and the code that honours them is not
  // written, so offering one as if it discounted would be a promise nothing keeps.
  if (!spec.billed) {
    return { err: `"${row.reward_type}" (${spec.label}) is not a billed discount yet — it grants something rather than changing an invoice, and nothing fulfils it. Use months_free, amount or percent.` };
  }
  if (!Number.isFinite(row.reward_value) || row.reward_value <= 0) {
    return { err: 'Enter a reward above zero.' };
  }
  if (row.reward_type === 'percent') {
    if (row.reward_value > 100) return { err: 'A percentage cannot exceed 100.' };
    // COMMERCE.md §8: a percentage compounds with growth, forever. It is the most
    // expensive thing on the page and the doc says it should have an end date — so it
    // has one, or it does not get created.
    if (!row.ends_on) {
      return { err: 'A percentage campaign needs an end date. It compounds as the school grows — 25% off a school that doubles is twice the give-away, with nobody deciding that. Set ends_on, or use a rupee amount.' };
    }
  }
  if (row.reward_type === 'amount' && row.reward_value > 1000000) {
    return { err: 'That is a very large rupee gift — enter it in rupees, not paise.' };
  }
  if (row.reward_type === 'months_free') {
    if (!Number.isInteger(row.reward_value) || row.reward_value < 1 || row.reward_value > 12) {
      return { err: 'Free months must be a whole number between 1 and 12.' };
    }
    // Free months are the cheapest thing we can give BECAUSE the cash comes forward —
    // we are paid a year up front and give back time. On a monthly cycle there is no
    // year up front, so the campaign would match and be worth nothing. Say so.
    if (row.match_cycle !== 'annual') {
      return { err: 'Free months apply to an annual prepay only — set the billing cycle to annual. On a monthly cycle the campaign would match and be worth nothing.' };
    }
  }
  if (row.applies_to === 'module' && !row.applies_key && !row.match_module_key) {
    return { err: 'Say which module this discounts — applies_to is "module" with no module named.' };
  }
  if (row.starts_on && row.ends_on && row.ends_on < row.starts_on) {
    return { err: 'The campaign closes before it opens — check the dates.' };
  }
  if (row.max_redemptions !== null && (!Number.isInteger(row.max_redemptions) || row.max_redemptions < 1)) {
    return { err: 'A redemption cap must be a whole number of 1 or more, or blank for unlimited.' };
  }
  if (row.max_discount_paise !== null && (!Number.isInteger(row.max_discount_paise) || row.max_discount_paise < 1)) {
    return { err: 'A discount ceiling must be a whole number of paise, or blank for none.' };
  }
  if (!Number.isInteger(row.per_org_limit) || row.per_org_limit < 1) {
    return { err: 'The per-organisation limit must be 1 or more.' };
  }
  if (row.cycles !== null && (!Number.isInteger(row.cycles) || row.cycles < 1)) {
    return { err: 'Cycles must be a whole number of 1 or more, or blank for every cycle.' };
  }
  return { row };
}

/** GET /api/pricing/campaigns — every campaign with its real redemption count. */
exports.listCampaigns = async (req, res) => {
  try {
    // Correlated subqueries, not GROUP BY. MariaDB's only_full_group_by rejects the
    // grouped form the moment you order by anything off the joined row, and that
    // failure is invisible behind a fail-soft catch — it already cost this file family
    // a silently-ignored discount once.
    const rows = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM platform_campaign_redemptions r WHERE r.campaign_id = c.id) AS redemptions,
              (SELECT COALESCE(SUM(r2.discount_paise), 0) FROM platform_campaign_redemptions r2
                WHERE r2.campaign_id = c.id) AS given_paise,
              o.name AS restricted_org_name
         FROM platform_campaigns c
         LEFT JOIN client_organizations o ON o.id = c.match_org_id
        ORDER BY c.is_active DESC, c.id DESC`);

    // "Publishable" is computed here rather than in the browser, because the activate
    // route computes it the same way and two answers to "may this go live" is exactly
    // the drift this module exists to remove.
    const campaigns = rows.map((c) => ({
      ...c,
      publishable: !!c.simulated_at && campaignsSvc.fingerprint(c) === c.simulation_fingerprint,
      staleSimulation: !!c.simulated_at && campaignsSvc.fingerprint(c) !== c.simulation_fingerprint,
    }));
    return success(res, { campaigns, rewardTypes: campaignsSvc.REWARD_TYPES });
  } catch (err) {
    logger.error(`pricing.listCampaigns: ${err.message}`);
    return error(res, 'Failed to load campaigns', 500, err.message);
  }
};

/**
 * POST /api/pricing/campaigns — create one. ALWAYS inactive.
 *
 * There is no `is_active` in the accepted body on purpose. A campaign that could be
 * created live would be a discount nobody simulated, and the simulation is the only
 * thing standing between a festive offer and a number nobody approved.
 */
exports.createCampaign = async (req, res) => {
  try {
    const b = req.body || {};
    const slug = String(b.slug || '').trim().toLowerCase();
    const name = String(b.name || '').trim();
    if (!CAMPAIGN_SLUG_RE.test(slug)) {
      return error(res, 'A campaign slug must be 3-64 characters: lowercase letters, numbers and dashes.', 400);
    }
    if (!name) return error(res, 'Give the campaign a name — it is what a customer reads on the invoice.', 400);

    const v = validateCampaign(b);
    if (v.err) return error(res, v.err, 400);

    const dup = await queryOne('SELECT id FROM platform_campaigns WHERE slug = ?', [slug]);
    if (dup) return error(res, 'A campaign with that slug already exists.', 409);

    const cols = ['slug', 'name', 'description', ...CAMPAIGN_EDITABLE, 'created_by'];
    const vals = [slug, name, nullableStr(b.description),
      ...CAMPAIGN_EDITABLE.map((k) => v.row[k]), req.user?.user_id || null];
    let r;
    try {
      // Column names are literals from THIS file, never from input; every value is bound. §17.
      r = await query(
        `INSERT INTO platform_campaigns (${cols.map((c) => `\`${c}\``).join(',')})
         VALUES (${cols.map(() => '?').join(',')})`, vals);
    } catch (e) {
      if (isMissingColumn(e) || /doesn't exist/i.test(e.message)) {
        return error(res, 'This needs the campaign tables. Run: node scripts/migrations/038_campaigns.js --apply', 400);
      }
      throw e;
    }

    await audit(req, 'BILLING', 'campaign', r.insertId, {
      new_data: { action: 'campaign_created', slug, name, is_active: 0, ...v.row },
    });
    return success(res, { id: r.insertId, slug, is_active: 0 },
      `${name} created — inactive. Run a simulation before it can go live.`);
  } catch (err) {
    logger.error(`pricing.createCampaign: ${err.message}`);
    return error(res, 'Failed to create the campaign', 500, err.message);
  }
};

/**
 * PATCH /api/pricing/campaigns/:id — edit one.
 *
 * An ECONOMIC edit is refused while the campaign is live. Not for tidiness: a running
 * campaign has already been shown to customers and may already have redemptions priced
 * against the old terms, and quietly changing what "Diwali 2026" means is the thing that
 * makes an old invoice impossible to explain. Deactivate, edit, re-simulate, re-activate
 * — four deliberate steps, each audited. Name and description stay editable throughout,
 * because fixing a typo changes nothing anybody is owed.
 */
exports.updateCampaign = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const before = await queryOne('SELECT * FROM platform_campaigns WHERE id = ?', [id]);
    if (!before) return error(res, 'Campaign not found', 404);

    const b = req.body || {};
    const v = validateCampaign(b, before);
    if (v.err) return error(res, v.err, 400);

    const economicChange = campaignsSvc.fingerprint({ ...before, ...v.row }) !== campaignsSvc.fingerprint(before);
    if (economicChange && Number(before.is_active)) {
      return error(res,
        'This campaign is live. Changing what it costs while customers are being offered it would make an ' +
        'existing invoice impossible to explain. Deactivate it, edit it, simulate it again, then activate it.', 400);
    }

    const name = b.name === undefined ? before.name : String(b.name).trim();
    if (!name) return error(res, 'A campaign needs a name.', 400);

    await query(
      `UPDATE platform_campaigns SET name = ?, description = ?,
         ${CAMPAIGN_EDITABLE.map((c) => `\`${c}\` = ?`).join(', ')}
       WHERE id = ?`,
      [name, b.description === undefined ? before.description : nullableStr(b.description),
       ...CAMPAIGN_EDITABLE.map((k) => v.row[k]), id]);

    await audit(req, 'BILLING', 'campaign', id, {
      old_data: Object.fromEntries(['name', ...CAMPAIGN_EDITABLE].map((k) => [k, before[k] ?? null])),
      new_data: { action: 'campaign_updated', slug: before.slug, name, ...v.row },
    });
    return success(res, { id, economicChange },
      economicChange
        ? `${name} saved — its economics changed, so it needs a fresh simulation before it can go live.`
        : `${name} saved`);
  } catch (err) {
    logger.error(`pricing.updateCampaign: ${err.message}`);
    return error(res, 'Failed to save the campaign', 500, err.message);
  }
};

/**
 * POST /api/pricing/campaigns/:id/activate — publish it.
 *
 * 🔴 THE GATE. Refused unless a simulation has been run AND its fingerprint still
 * matches the campaign's current economics. Enforced at the API and not in the UI,
 * because a UI is one curl away from being bypassed and this is the only thing between
 * a percentage offer and a number nobody looked at.
 */
exports.activateCampaign = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await queryOne('SELECT * FROM platform_campaigns WHERE id = ?', [id]);
    if (!c) return error(res, 'Campaign not found', 404);
    if (Number(c.is_active)) return success(res, { id, is_active: 1 }, 'Already running');

    if (!c.simulated_at) {
      return error(res,
        'This campaign has never been simulated. Run POST /api/pricing/campaigns/simulate with ' +
        `campaign_id ${id} to see who it matches and what it gives away, then activate it.`, 400);
    }
    if (campaignsSvc.fingerprint(c) !== c.simulation_fingerprint) {
      return error(res,
        'This campaign has changed since it was simulated, so the numbers you approved are not the numbers ' +
        'it would give away. Simulate it again before activating.', 400);
    }
    const v = validateCampaign({}, c);
    if (v.err) return error(res, v.err, 400);

    await query('UPDATE platform_campaigns SET is_active = 1 WHERE id = ?', [id]);
    await audit(req, 'BILLING', 'campaign', id, {
      old_data: { is_active: 0 },
      new_data: { action: 'campaign_activated', slug: c.slug, reward_type: c.reward_type,
                  reward_value: Number(c.reward_value), simulated_at: c.simulated_at,
                  simulation: c.simulation_json ?? null },
    });
    return success(res, { id, is_active: 1 }, `${c.name} is live — it now applies by itself, with no code to enter.`);
  } catch (err) {
    logger.error(`pricing.activateCampaign: ${err.message}`);
    return error(res, 'Failed to activate the campaign', 500, err.message);
  }
};

/**
 * POST /api/pricing/campaigns/:id/deactivate — stop offering it.
 *
 * Stops NEW matches. It does not undo a redemption and does not delete anything: an org
 * that already claimed it keeps what it was promised, which is the same rule §15 applies
 * to a retired module.
 */
exports.deactivateCampaign = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const c = await queryOne('SELECT * FROM platform_campaigns WHERE id = ?', [id]);
    if (!c) return error(res, 'Campaign not found', 404);

    await query('UPDATE platform_campaigns SET is_active = 0 WHERE id = ?', [id]);
    const [{ n }] = await query(
      'SELECT COUNT(*) AS n FROM platform_campaign_redemptions WHERE campaign_id = ?', [id]);
    await audit(req, 'BILLING', 'campaign', id, {
      old_data: { is_active: c.is_active },
      new_data: { action: 'campaign_deactivated', slug: c.slug, redemptions_at_stop: Number(n) },
    });
    return success(res, { id, is_active: 0, redemptions: Number(n) },
      Number(n)
        ? `${c.name} stopped. The ${n} organisation(s) that already claimed it keep what they were promised.`
        : `${c.name} stopped — nobody had claimed it.`);
  } catch (err) {
    logger.error(`pricing.deactivateCampaign: ${err.message}`);
    return error(res, 'Failed to stop the campaign', 500, err.message);
  }
};

/**
 * POST /api/pricing/campaigns/simulate — the gate that makes this safe.
 *
 * Every organisation that would match TODAY, what each pays with and without it, the
 * total given away, and the worst case if the cap is fully claimed.
 *
 * ── EVERY NUMBER COMES FROM `resolveForOrg`, TWICE ──────────────────────────
 * Once without the campaign and once with it injected as a draft. NOTHING here
 * re-implements the arithmetic. A simulator with its own maths is a second answer to
 * "what does org N pay", which is the exact failure this whole module exists to prevent
 * — four sources disagreeing once already reported ₹0 MRR forever without erroring
 * (KI-120). It also means the simulated figure IS the figure the org would be charged,
 * by construction rather than by coincidence.
 *
 * Body: either `campaign_id` (simulate the SAVED campaign, and RECORD the simulation so
 * it becomes publishable) or a draft campaign inline (a what-if; records nothing).
 * `cycle` optionally prices every org at a stated cycle instead of its own — how an
 * owner designing an annual-prepay offer sees its effect before anybody is on annual.
 */
exports.simulateCampaign = async (req, res) => {
  try {
    const b = req.body || {};
    const campaignId = b.campaign_id ? Number(b.campaign_id) : null;

    let stored = null;
    let draft;
    if (campaignId) {
      stored = await queryOne('SELECT * FROM platform_campaigns WHERE id = ?', [campaignId]);
      if (!stored) return error(res, 'Campaign not found', 404);
      // The SAVED row, exactly — never the body's idea of it. Simulating one campaign
      // and recording the approval against another is the whole thing the fingerprint
      // exists to stop.
      draft = campaignsSvc.normaliseDraft(stored);
    } else {
      const v = validateCampaign(b);
      if (v.err) return error(res, v.err, 400);
      draft = campaignsSvc.normaliseDraft({ ...v.row, slug: b.slug || '(draft)', name: b.name || 'Draft campaign' });
    }

    const forcedCycle = ['monthly', 'annual'].includes(b.cycle) ? b.cycle : null;

    // Every org with a subscription — there is nothing to price without one. Bounded,
    // because this runs `resolveForOrg` twice per org and an owner clicking Simulate
    // must not be able to hold a worker open across a whole customer base.
    // 501 is a LITERAL in this file, never interpolated from input (§17). One more than
    // the limit, so `truncated` is knowable without a second COUNT query.
    const LIMIT = 500;
    const orgs = await query(
      `SELECT s.org_id, o.name, o.type
         FROM client_subscriptions s
         JOIN client_organizations o ON o.id = s.org_id
        GROUP BY s.org_id, o.name, o.type
        ORDER BY s.org_id
        LIMIT 501`);
    const truncated = orgs.length > LIMIT;
    if (truncated) orgs.length = LIMIT;

    const matched = [];
    const skipped = [];
    for (const o of orgs) {
      const opts = forcedCycle ? { cycle: forcedCycle } : {};
      const without = await pricing.resolveForOrg(o.org_id, opts).catch(() => null);
      if (!without) { skipped.push({ orgId: o.org_id, name: o.name, reason: 'has no priceable subscription' }); continue; }
      const withIt = await pricing.resolveForOrg(o.org_id, { ...opts, draftCampaign: draft });

      const applied = withIt.campaign && withIt.campaign.applied;
      const givenPaise = Math.max(0, without.payablePaise - withIt.payablePaise);
      const line = {
        orgId: o.org_id, name: o.name, type: o.type,
        plan: without.plan.slug, students: without.students, cycle: without.cycle,
        withoutPaise: without.payablePaise, withoutDisplay: without.payableDisplay,
        withPaise: withIt.payablePaise, withDisplay: withIt.payableDisplay,
        givenPaise, givenDisplay: pricing.formatInr(givenPaise),
        basis: withIt.campaign ? withIt.campaign.basis : null,
      };
      if (applied && givenPaise > 0) { matched.push(line); continue; }
      // Why not. The reason comes from the chain itself — either the campaign did not
      // match, or it matched and lost to a coupon, which is a thing the owner needs to
      // see: "0 matched" with no explanation is how a campaign gets published twice.
      const considered = (withIt.campaignsConsidered || []).find((x) => x.draft) || {};
      const lost = (withIt.discountConsidered || []).find((x) => x.source === 'campaign' && !x.applied);
      skipped.push({ orgId: o.org_id, name: o.name, plan: without.plan.slug,
        reason: lost ? lost.reason : (considered.reason || (withIt.campaign ? 'the reward is worth ₹0 on this bill' : 'did not match')) });
    }

    const totalGivenPaise = matched.reduce((s, m) => s + m.givenPaise, 0);
    const worstPerOrgPaise = matched.reduce((m, x) => Math.max(m, x.givenPaise), 0);

    // ── THE WORST CASE ─────────────────────────────────────────────────────
    // Not the total above: that is today's customer base. The worst case is the cap
    // being fully claimed by the most expensive kind of match, for every cycle the
    // reward survives. `cycles = NULL` means "for life", which has no worst case at all
    // — so it is reported as unbounded rather than quietly multiplied by 1.
    const cap = draft.max_redemptions === null ? null : Number(draft.max_redemptions);
    const cycles = draft.cycles === null ? null : Number(draft.cycles);
    const capCount = cap === null ? matched.length : cap;
    const worstCasePaise = cycles === null ? null : capCount * worstPerOrgPaise * cycles;
    const worstCase = {
      redemptionsAssumed: capCount,
      capped: cap !== null,
      cyclesEach: cycles,
      perRedemptionPaise: worstPerOrgPaise,
      perRedemptionDisplay: pricing.formatInr(worstPerOrgPaise),
      paise: worstCasePaise,
      display: worstCasePaise === null ? 'unbounded' : pricing.formatInr(worstCasePaise),
      note: [
        cap === null ? 'No redemption cap — the worst case is however many organisations sign up.' : null,
        cycles === null ? 'cycles is blank, so the reward applies for life. There is no worst case; set a cycle count to bound it.' : null,
        draft.reward_type === 'percent' ? 'A percentage grows as the school grows — this figure is today\'s headcount only.' : null,
      ].filter(Boolean),
    };

    const summary = {
      orgsConsidered: orgs.length, truncated,
      matched: matched.length, skipped: skipped.length,
      totalGivenPaise, totalGivenDisplay: pricing.formatInr(totalGivenPaise),
      worstCase,
    };

    // ── RECORDING THE SIMULATION IS WHAT MAKES IT PUBLISHABLE ──────────────
    // Only for a SAVED campaign, and the fingerprint is taken from the stored row — so
    // editing the reward afterwards makes the fingerprint stop matching and activation
    // is refused until somebody looks again.
    if (stored) {
      await query(
        `UPDATE platform_campaigns
            SET simulated_at = NOW(), simulated_by = ?, simulation_json = ?, simulation_fingerprint = ?
          WHERE id = ?`,
        [req.user?.user_id || null, JSON.stringify(summary).slice(0, 60000),
         campaignsSvc.fingerprint(stored), stored.id]);
      await audit(req, 'BILLING', 'campaign', stored.id, {
        new_data: { action: 'campaign_simulated', slug: stored.slug, ...summary },
      });
    }

    return success(res, {
      campaign: { id: stored?.id ?? null, slug: draft.slug, name: draft.name,
                  rewardType: draft.reward_type, rewardValue: draft.reward_value,
                  saved: !!stored, publishable: !!stored },
      matched, skipped, summary,
    }, stored
      ? `${matched.length} organisation(s) would match today, giving away ${pricing.formatInr(totalGivenPaise)}. This campaign can now be activated.`
      : `${matched.length} organisation(s) would match today, giving away ${pricing.formatInr(totalGivenPaise)}. Save the campaign to be able to publish it.`);
  } catch (err) {
    logger.error(`pricing.simulateCampaign: ${err.message}`);
    return error(res, 'Failed to simulate the campaign', 500, err.message);
  }
};
