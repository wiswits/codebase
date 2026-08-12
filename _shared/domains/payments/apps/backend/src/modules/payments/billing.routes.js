'use strict';
/**
 * BILLING — the institution's own view of what it pays, and the webhook.
 *
 * Distinct from `/api/payments`, which is PARENTS paying school fees. This is the
 * school paying WisWits. Same building, opposite direction, and conflating them is how
 * a parent's fee receipt ends up in a SaaS invoice ledger.
 */
const express = require('express');
const router = express.Router();
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { audit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const subs = require('../../services/payments/subscriptions');
const creds = require('../../services/payments/credentials');
const rzp = require('../../services/razorpayService');

/* ─────────────────────────────── WEBHOOK ───────────────────────────────── */
/**
 * POST /api/billing/webhook — mounted BEFORE authenticate on purpose.
 *
 * Razorpay is not a logged-in user. Authenticity comes from the HMAC signature over the
 * RAW body, which is why server.js must keep an express.raw() rule for this path: once
 * express.json() has parsed and re-serialised the body, the bytes differ and every
 * signature check fails.
 *
 * ALWAYS returns 2xx once the event is safely recorded. A 500 makes Razorpay retry the
 * same event for days; recording it and reporting "received" is both honest and
 * terminates the retry loop.
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  // req.body is a Buffer here thanks to the raw-body rule. Falling back to a
  // re-serialised object would silently break signature verification in production
  // while appearing to work in a test that posts JSON.
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

  if (!rzp.verifyWebhookSignature(raw, signature)) {
    // 400, not 401: there is no credential to re-present. Logged as a warning because
    // a burst of these means either a misconfigured webhook secret or someone probing.
    logger.warn('billing webhook: signature verification FAILED');
    return error(res, 'Invalid signature', 400);
  }

  let body;
  try { body = JSON.parse(raw.toString('utf8')); }
  catch { return error(res, 'Malformed payload', 400); }

  // ── AN EVENT ID THAT CANNOT BE NULL (KI-166) ──────────────────────────────
  // This was `req.headers['x-razorpay-event-id'] || body?.id || null`. Razorpay webhook
  // bodies have no top-level `id`, so the second term was always undefined and a
  // delivery missing the header resolved to null — at which point `handleWebhook`
  // returned before writing anything and this route answered 200. Razorpay reads 200 as
  // delivered and stops retrying: a `subscription.charged` without that header was money
  // at the bank with no invoice and no trace. The id is now derived from the raw bytes,
  // which is idempotent for a genuine redelivery, and the ledger row is written before
  // anything is decided.
  const eventType = body?.event || 'unknown';
  const amount = body?.payload?.payment?.entity?.amount ?? null;

  try {
    const out = await subs.handleWebhook({
      eventId: req.headers['x-razorpay-event-id'] || null,
      eventType, payload: body?.payload || {}, rawAmountPaise: amount, raw,
    });
    return success(res, out, 'Received');
  } catch (e) {
    // ── NEVER 200 AN EVENT WE DID NOT RECORD ────────────────────────────────
    // `e.recorded` is set by handleWebhook. True means the ledger row exists and this is
    // a processing problem we can replay from it — 200 is right, because a retry would
    // hit the same bug and the failed row is the alert. False means the INSERT itself
    // failed and the only copy of this event is the request in our hands: acknowledging
    // it would destroy it. 5xx makes Razorpay deliver it again, which is precisely what
    // we want.
    logger.error(`billing webhook processing error (${eventType}): ${e.message}`);
    if (e.recorded === false) {
      return error(res, 'Could not record the event — please retry', 500);
    }
    return success(res, { handled: false, recorded: true }, 'Received');
  }
});

/* ──────────────────────── INSTITUTION-FACING ──────────────────────────── */
router.use(authenticate);

// Only the people who own the money conversation. A teacher must not see the
// institution's billing, and a student certainly must not.
const BILLING_ROLES = ['owner', 'admin', 'principal', 'super_admin', 'system_admin'];

// GET /api/billing — plan, price, usage, invoices, and the ladder to upgrade into
router.get('/', requireRole(...BILLING_ROLES), async (req, res) => {
  try {
    const data = await subs.billingSummary(req.user.org_id);
    if (!data) return error(res, 'Organisation not found', 404);
    return success(res, data);
  } catch (e) {
    logger.error(`billing summary failed for org ${req.user.org_id}: ${e.message}`);
    return error(res, 'Could not load billing', 500);
  }
});

// GET /api/billing/invoices/:number — one invoice, for print/PDF
router.get('/invoices/:number', requireRole(...BILLING_ROLES), async (req, res) => {
  try {
    const { queryOne } = require('../../config/db');
    // Scoped by org_id: an invoice number is guessable, and one tenant must never be
    // able to fetch another's invoice by incrementing it (§17).
    const inv = await queryOne(
      'SELECT * FROM client_invoices WHERE invoice_number = ? AND org_id = ?',
      [req.params.number, req.user.org_id]);
    if (!inv) return error(res, 'Invoice not found', 404);
    const pricing = require('../../services/pricing');
    return success(res, {
      ...inv,
      total_display: pricing.formatInr(inv.total_paise),
      amount_display: pricing.formatInr(inv.amount_paise),
    });
  } catch (e) {
    return error(res, 'Could not load invoice', 500);
  }
});

// POST /api/billing/start — begin the ₹1 mandate for a chosen plan
router.post('/start', requireRole(...BILLING_ROLES), async (req, res) => {
  try {
    const { plan_id, cycle } = req.body || {};
    if (cycle && !['monthly', 'annual'].includes(cycle)) {
      return error(res, 'Cycle must be monthly or annual', 400);
    }
    // Refuse clearly rather than creating a subscription that can never be charged.
    // 409, NOT 503 — and that distinction matters. `utils/response.error` masks every
    // 5xx message in production (correctly: they carry SQL and stack detail), so this
    // guard used to tell the customer "Something went wrong on our side. Please try
    // again." A retry could never help; nothing had gone wrong. "Payments are not set
    // up" is a state of the request, not a server fault, so it belongs in 4xx where
    // the message survives and the person reads what is actually true.
    const ready = creds.readiness();
    if (!ready.ready && creds.isLive()) {
      logger.error(`billing start blocked — gateway not ready: ${ready.blockers.join('; ')}`);
      return error(res, 'Online payment is not available yet. Please contact WisWits to set up billing.', 409);
    }
    // ── AND REFUSE WHEN WE ARE NOT LIVE AT ALL ──────────────────────────────
    // Production currently runs RAZORPAY_MODE=mock with ALLOW_MOCK_PAYMENTS=true,
    // and `startMandate` writes a REAL subscription row either way (deliberately —
    // one code path for mock and live). So without this guard, a school clicking
    // "Choose Complete" on the billing page would: switch itself onto the top tier
    // for free (billingSummary reads the NEWEST subscription row), get a fresh
    // 14-day trial, leave a second subscription row behind, and have a BILLING
    // audit event written as though a payment had begun — all without a rupee
    // moving and with no way for us to charge them.
    //
    // Mock exists to rehearse the flow in tests and on staging, never to let a real
    // customer transact against it. The page stays fully readable (plan, trial end,
    // the ladder, invoices); only the transacting stops.
    if (!creds.isLive()) {
      logger.warn(`billing start refused for org ${req.user.org_id} — gateway is not live (mock mode)`);
      return error(res, 'Online payment is not switched on yet. Tell us which plan you want and WisWits will set it up for you.', 409);
    }

    const out = await subs.startMandate(req.user.org_id, {
      planId: plan_id, cycle: cycle || 'monthly', userId: req.user.user_id,
    });
    await audit(req, 'BILLING', 'subscription', out.subscription_id, {
      // The AMOUNT is on the record now, not just the plan slug. "Which plan" does not
      // answer "what were they charged" for a customer with an agreed price, and the
      // audit row is the only place that question can be answered after the fact.
      new_data: { action: 'start_mandate', plan: out.plan.slug, cycle: out.recurring.cycle,
        first_charge_paise: out.first_charge.paise,
        recurring_paise: out.recurring.paise,
        recurring_starts_at: out.recurring.starts_at,
        list_paise: out.price_breakdown.list_paise,
        provider_subscription_id: out.provider_subscription_id },
    });
    return success(res, out, 'Ready for payment');
  } catch (e) {
    // Every one of these is a state of the request, not a server fault, and 5xx bodies
    // are masked in production — so a customer would read "Something went wrong on our
    // side" for a message written specifically for them to act on.
    if (['CUSTOM_PLAN', 'NEGOTIATED_PLAN_CHANGE', 'UNPRICED_ADDON'].includes(e.code)) {
      return error(res, e.message, 400);
    }
    if (e.code === 'AMOUNT_BELOW_MINIMUM' || e.code === 'AMOUNT_NOT_INTEGER') {
      // The org is on a plan that prices at nothing — the retired `starter` plan is the
      // known case (KI-163). Refusing beats creating a mandate that can never be charged.
      logger.error(`billing start refused for org ${req.user.org_id}: ${e.message}`);
      return error(res, 'This account is not on a plan that can be charged yet. '
        + 'Please contact WisWits and we will set it up.', 409);
    }
    logger.error(`billing start failed for org ${req.user.org_id}: ${e.message}`);
    return error(res, 'Could not start the payment', 500);
  }
});

// POST /api/billing/confirm — the browser, back from Razorpay Checkout
//
// The mandate is authorised at the gateway and the person is still looking at the
// screen. Without this they would be shown a pending state while a webhook travels, and
// a school that thinks its payment failed will try again — which is how a support ticket
// and a duplicate mandate get created out of a success. The signature is HMAC'd with our
// own key secret, so this is proof rather than the client asserting its own outcome.
router.post('/confirm', requireRole(...BILLING_ROLES), async (req, res) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const out = await subs.confirmMandate(req.user.org_id, {
      providerSubscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    await audit(req, 'BILLING', 'subscription', out.subscription_id, {
      new_data: { action: 'confirm_mandate', payment_ref: razorpay_payment_id || null,
        duplicate: !!out.duplicate },
    });
    return success(res, out, 'Payment confirmed');
  } catch (e) {
    if (e.code === 'BAD_SIGNATURE') return error(res, e.message, 400);
    if (e.code === 'NOT_YOURS') return error(res, e.message, 404);
    if (e.code === 'BAD_CONFIRMATION') return error(res, 'Missing payment details', 400);
    logger.error(`billing confirm failed for org ${req.user.org_id}: ${e.message}`);
    // Deliberately NOT reported as a failure: the money may well have been taken and the
    // webhook will finish the job regardless of what went wrong on this request. Saying
    // "we are still confirming" is true; "it failed" would not be, and it would send a
    // school that has just paid back into checkout.
    return success(res, { handled: false, pending: true },
      'We are still confirming this payment. It will appear here shortly.', 202);
  }
});

// POST /api/billing/simulate — mock-only: drive the whole lifecycle without a gateway
router.post('/simulate', requireRole(...BILLING_ROLES), async (req, res) => {
  // The rehearsal switch. It exists so signup → mandate → charge → invoice can be
  // proven end to end BEFORE any Razorpay key exists — and it is hard-refused the
  // moment real money is possible, so it can never be used to fake a payment.
  if (creds.isLive()) return error(res, 'Not available once live keys are configured', 403);
  if (!creds.mockAllowed()) return error(res, 'Mock payments are not permitted here', 403);

  try {
    const { queryOne } = require('../../config/db');
    const event = String(req.body?.event || 'subscription.activated');
    // Refunds and failures are simulatable too, or the only way to rehearse the
    // ₹1-then-refund launch gate is to take a real rupee and give it back.
    const KNOWN = new Set([...subs.HANDLED, ...subs.INVOICE_EVENTS, ...subs.FAILURE_EVENTS]);
    if (!KNOWN.has(event)) {
      return error(res, `Unknown event. One of: ${[...KNOWN].join(', ')}`, 400);
    }
    const sub = await queryOne(
      `SELECT provider_subscription_id FROM client_subscriptions
        WHERE org_id = ? AND provider_subscription_id IS NOT NULL
        ORDER BY id DESC LIMIT 1`, [req.user.org_id]);
    if (!sub) return error(res, 'Start a mandate first — there is no subscription to simulate against', 400);

    // A refund has to point at a payment that exists, or it is a rehearsal of nothing.
    // The caller may name one; otherwise the org's last paid invoice is used.
    const paymentRef = req.body?.payment_ref || (await queryOne(
      `SELECT payment_ref FROM client_invoices
        WHERE org_id = ? AND payment_ref IS NOT NULL ORDER BY id DESC LIMIT 1`,
      [req.user.org_id]))?.payment_ref || `pay_SIM${Date.now()}`;

    const out = await subs.handleWebhook({
      // A unique id per simulated event, so the idempotency guard is exercised rather
      // than accidentally swallowing every simulation after the first.
      eventId: `evt_SIM_${event}_${Date.now()}`,
      eventType: event,
      payload: {
        subscription: { entity: { id: sub.provider_subscription_id } },
        payment: { entity: { id: paymentRef, amount: req.body?.amount_paise ?? null,
          subscription_id: sub.provider_subscription_id } },
        refund: event.startsWith('refund.')
          ? { entity: { id: `rfnd_SIM${Date.now()}`, payment_id: paymentRef,
            amount: req.body?.amount_paise ?? null } } : undefined,
        dispute: event.startsWith('payment.dispute.')
          ? { entity: { id: `disp_SIM${Date.now()}`, payment_id: paymentRef } } : undefined,
      },
      rawAmountPaise: req.body?.amount_paise ?? null,
    });
    return success(res, out, `Simulated ${event}`);
  } catch (e) {
    logger.error(`billing simulate failed: ${e.message}`);
    return error(res, e.message, 500);
  }
});

module.exports = router;
