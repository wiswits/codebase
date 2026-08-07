'use strict';
/**
 * OWNER SETTINGS → Payment gateway. Where the Razorpay keys get pasted.
 *
 * Platform-only, and gated by BOTH role and org membership: `requirePlatformOrg`
 * means a tenant's own `owner`/`admin` role can never reach this even though those
 * slugs exist inside every organisation. These credentials move money for the whole
 * platform — a school admin must not be able to read, change, or test them.
 *
 * The secrets are WRITE-ONLY over HTTP. A GET returns last-4 and a readiness report;
 * there is no endpoint that returns a key secret, because a settings page never needs
 * one and an endpoint that can leak it eventually will.
 */
const express = require('express');
const router = express.Router();
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole, requirePlatformOrg } = require('../../middleware/rbac');
const { audit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const creds = require('../../services/payments/credentials');

router.use(authenticate);
router.use(requireRole('owner', 'super_admin', 'system_admin'));
router.use(requirePlatformOrg);

// GET /api/payment-config — masked view + what is still missing
router.get('/', async (req, res) => {
  try {
    await creds.refresh();               // never show a cached view on the settings page
    return success(res, creds.masked());
  } catch (e) {
    logger.error(`payment-config read failed: ${e.message}`);
    return error(res, 'Could not read payment settings', 500);
  }
});

// PUT /api/payment-config — save. Omitted fields are left unchanged.
router.put('/', async (req, res) => {
  try {
    const { provider, mode, key_id, key_secret, webhook_secret } = req.body || {};

    if (mode && !['mock', 'test', 'live'].includes(mode)) {
      return error(res, 'Mode must be mock, test or live', 400);
    }
    if (provider && provider !== 'razorpay') {
      // Stripe is a future option but nothing implements it; accepting the value would
      // put the platform in a mode where every charge silently fails.
      return error(res, 'Only razorpay is supported today', 400);
    }
    // Razorpay key ids are prefixed rzp_test_ / rzp_live_. Catching a mismatched pair
    // here saves discovering it on a real customer's first charge.
    if (key_id && mode === 'live' && /rzp_test/i.test(key_id)) {
      return error(res, 'That is a TEST key id but the mode is live. Use your rzp_live_ key, or set mode to test.', 400);
    }
    if (key_id && mode === 'test' && /rzp_live/i.test(key_id)) {
      return error(res, 'That is a LIVE key id but the mode is test. Use your rzp_test_ key, or set mode to live.', 400);
    }
    // A blank string is a common form artefact and must not be mistaken for "clear
    // this secret" — trim to undefined so COALESCE leaves the stored value alone.
    const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

    const out = await creds.save({
      provider: clean(provider), mode: clean(mode), keyId: clean(key_id),
      keySecret: clean(key_secret), webhookSecret: clean(webhook_secret),
    }, { userId: req.user.user_id });

    // BILLING is an audited action (§12). Never log the secrets themselves — only
    // which fields changed, so the trail is useful without being dangerous.
    await audit(req, 'BILLING', 'payment_config', 1, {
      new_data: {
        provider: clean(provider) || '(unchanged)',
        mode: clean(mode) || '(unchanged)',
        key_id: clean(key_id) ? 'updated' : '(unchanged)',
        key_secret: clean(key_secret) ? 'updated' : '(unchanged)',
        webhook_secret: clean(webhook_secret) ? 'updated' : '(unchanged)',
      },
    });
    return success(res, out, 'Payment settings saved');
  } catch (e) {
    logger.error(`payment-config save failed: ${e.message}`);
    return error(res, 'Could not save payment settings', 500);
  }
});

// POST /api/payment-config/test — prove the keys work, before a customer does it
router.post('/test', async (req, res) => {
  try {
    const rzp = require('../../services/razorpayService');
    if (rzp.MODE === 'mock') {
      return success(res, {
        ok: true, mode: 'mock',
        message: 'Mock mode is working. No real money can move until live keys are saved.',
      });
    }
    // A ₹1 order is the cheapest honest proof that the key id and secret are a valid
    // pair and the account is active. It is never captured, so nothing is charged —
    // an unpaid order simply expires at Razorpay.
    const order = await rzp.createOrder({
      amount: 1, receipt: `keytest_${Date.now()}`,
      notes: { purpose: 'WisWits credential test — not charged' },
    });
    return success(res, {
      ok: true, mode: rzp.MODE, order_id: order.id,
      message: 'Credentials are valid. A ₹1 test order was created and left unpaid, so nothing was charged.',
    });
  } catch (e) {
    // The gateway's own message is the useful one here ("Authentication failed"), so
    // it is passed through rather than replaced with something generic.
    logger.error(`payment-config test failed: ${e.message}`);
    return error(res, `Gateway rejected the credentials: ${e.message}`, 400);
  }
});

module.exports = router;
