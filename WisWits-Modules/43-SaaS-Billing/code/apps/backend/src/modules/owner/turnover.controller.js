'use strict';
/*
 * turnover.controller.js — the two owner-only endpoints over the turnover instrument.
 *
 * Both are mounted on the owner router, which already applies `authenticate` and the
 * platform-org + elevated-role guard to everything under `/api/owner`. That guard is the
 * reason these do not repeat one: a CUSTOMER's admin maps to an elevated `base_role` and
 * a role check alone would let a school read WisWits' own revenue. Membership of the
 * platform org is the half that actually keeps them out.
 */

const svc = require('./turnover.service');
const logger = require('../../utils/logger');
const db = require('../../config/db');
const { audit } = require('../../utils/audit');

// ── GET /api/owner/turnover ──────────────────────────────────────────────────
exports.turnover = async (req, res) => {
  try {
    const result = await svc.measure();

    // The alert rides on the read because there is no scheduler that would otherwise run
    // it, and a warning nobody schedules is a warning nobody gets. It is safe here: it
    // touches ONE settings column and (at most once per state) inserts a notification.
    // It never writes a money row, and it cannot change the figure it just reported.
    //
    // Awaited rather than fire-and-forget so that a failure lands in this request's log
    // with its correlation id instead of as an orphan rejection.
    let alert = null;
    try {
      alert = await svc.maybeAlert(result, req);
    } catch (e) {
      logger.error(`turnover alert check failed: ${e.message}`);
    }

    return res.json({ success: true, turnover: result, alert });
  } catch (err) {
    logger.error(`[owner.turnover] ${err.message}`);
    return res.status(500).json({ success: false, message: 'Could not read turnover' });
  }
};

// ── PATCH /api/owner/turnover/threshold ──────────────────────────────────────
/**
 * Change the level being watched, without a deploy.
 *
 * That is the entire reason this exists. A special-category state has a different figure
 * and the figure itself can be changed by a rule none of us control; if either meant
 * shipping a release, the number would simply go stale and the tile would quietly start
 * lying. Body: `{ thresholdRupees }` or `{ thresholdPaise }`.
 */
exports.setThreshold = async (req, res) => {
  try {
    const { thresholdPaise, thresholdRupees } = req.body || {};
    const paise = thresholdPaise !== undefined
      ? Number(thresholdPaise)
      : Math.round(Number(thresholdRupees) * 100);

    // Integer paise or nothing. A float threshold compared against an integer sum is a
    // boundary that behaves differently depending on which side of it you ask from.
    if (!Number.isFinite(paise) || !Number.isInteger(paise) || paise <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Give a whole rupee amount above zero, as thresholdRupees or thresholdPaise.',
      });
    }

    const before = await svc.readConfig();
    // ── CHANGING THE LEVEL RE-ARMS THE ALERT ──────────────────────────────────
    // If the threshold is raised, a state already announced at the old level would
    // suppress the announcement at the new one forever. The alert state is therefore
    // recomputed from scratch on the next read rather than carried across.
    await db.query(
      `UPDATE platform_billing_config
          SET turnover_threshold_paise = ?, turnover_alert_state = 'comfortable', updated_by = ?
        WHERE id = 1`,
      [paise, req.user?.user_id || null]);

    await audit(req, 'BILLING', 'platform_billing_config', 1, {
      old_data: { turnover_threshold_paise: before.thresholdPaise },
      new_data: { turnover_threshold_paise: paise },
    });

    const result = await svc.measure();
    return res.json({ success: true, turnover: result });
  } catch (err) {
    logger.error(`[owner.setThreshold] ${err.message}`);
    return res.status(500).json({ success: false, message: 'Could not save the threshold' });
  }
};
