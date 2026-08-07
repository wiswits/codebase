'use strict';
/*
 * The per-user calendar feed — UNAUTHENTICATED BY DESIGN.
 *
 * A calendar app cannot log in. Google and Apple fetch one URL, forever, with
 * no cookie and no header. So the token in the URL IS the credential, and this
 * file is written as if that is true, because it is.
 *
 * WHAT THAT FORCES:
 *   · the token is the ONLY lookup key — no org_id, no user id in the URL, so
 *     there is nothing to increment and walk
 *   · a revoked token is dead immediately: revoked_at is checked on every fetch
 *   · the response contains ONLY what the audience engine says that user is
 *     addressed by. Not "their org's events" — theirs
 *   · nothing about the failure is descriptive. An unknown token and a revoked
 *     token get the same 404 with the same body, because the difference is
 *     information about somebody else's account
 *   · it is mounted BEFORE /api/calendar in the registry, because Express
 *     matches in registration order and that router opens with authenticate()
 *
 * §12 says every external surface is rate limited; this one is additionally
 * cheap to serve (one query, one string) and bounded to a window of dates, so a
 * hammering client cannot turn it into a table scan of a school's whole history.
 */
const { Router } = require('express');
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const { buildIcs } = require('../../services/icsFeed');
const { resolveEventAudience } = require('../../services/audience');

const router = Router();

// How much of the year a feed carries. A calendar app re-fetches hourly, so
// there is no value in shipping five years of history on every poll — and a
// bound is what stops the feed becoming a full-table read.
const PAST_DAYS = 90;
const FUTURE_DAYS = 400;

/** Token → the person, or null. One query, and it is the whole authorisation. */
async function resolveToken(token) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return null;
  return queryOne(
    `SELECT t.id, t.org_id, t.user_id, u.first_name, u.last_name, o.name AS org_name
       FROM client_calendar_feed_tokens t
       JOIN client_users u ON u.id = t.user_id AND u.org_id = t.org_id
       LEFT JOIN client_organizations o ON o.id = t.org_id
      WHERE t.token = ? AND t.revoked_at IS NULL AND u.is_active = 1
      LIMIT 1`,
    [token]);
}

/*
 * GET /api/calendar/feed/:token.ics
 *
 * The `.ics` suffix is not decoration: some clients refuse a subscription URL
 * that does not end in it, and others guess the content type from the path
 * rather than the header.
 */
router.get('/:token.ics', async (req, res) => {
  try {
    const owner = await resolveToken(req.params.token);
    // Unknown and revoked are the same answer. Distinguishing them would
    // confirm that a token once existed, which is information about an account
    // the caller has just failed to prove they own.
    if (!owner) return res.status(404).type('text/plain').send('Not found');

    // Only events this person is actually addressed by. Resolved per event
    // rather than pre-stored, so a child who left last week is not still
    // feeding their parent's phone.
    const candidates = await query(
      `SELECT id, title, description, location, category, all_day, status,
              DATE_FORMAT(start_datetime, '%Y-%m-%d %H:%i:%s') AS start_datetime,
              DATE_FORMAT(end_datetime,   '%Y-%m-%d %H:%i:%s') AS end_datetime
         FROM client_em_events
        WHERE org_id = ?
          AND archived_at IS NULL AND deleted_at IS NULL
          AND status <> 'draft'
          AND start_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND start_datetime <= DATE_ADD(NOW(), INTERVAL ? DAY)
        ORDER BY start_datetime
        LIMIT 1000`,
      [owner.org_id, PAST_DAYS, FUTURE_DAYS]);

    const mine = [];
    for (const ev of (candidates || [])) {
      const { userIds } = await resolveEventAudience(owner.org_id, ev.id);
      if (userIds.includes(Number(owner.user_id))) mine.push(ev);
    }

    // The only thing a fetch writes. A school asking "is the parent actually
    // subscribed?" has no other way to find out.
    query('UPDATE client_calendar_feed_tokens SET last_fetched_at = NOW() WHERE id = ?', [owner.id])
      .catch(() => { /* never fail a feed over its own bookkeeping */ });

    const ics = buildIcs({
      calendarName: `${owner.org_name || 'School'} — ${owner.first_name || 'My'} Calendar`,
      events: mine,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="wiswits.ics"');
    // A subscription URL must never be cached by a shared proxy: it is
    // per-person content behind a secret path.
    res.setHeader('Cache-Control', 'private, max-age=900');
    return res.status(200).send(ics);
  } catch (e) {
    logger.error('Calendar feed:', e);
    // Still text/plain — a calendar client handed JSON on an .ics URL logs
    // something unhelpful and gives up.
    return res.status(500).type('text/plain').send('Could not build the calendar feed');
  }
});

/*
 * The authenticated half — issuing and revoking. Mounted on the same prefix but
 * these two carry `authenticate` themselves, because the router above must stay
 * open for the calendar apps.
 */
const { authenticate } = require('../../middleware/auth');
const crypto = require('crypto');

router.get('/me/subscription', authenticate, async (req, res) => {
  try {
    const row = await queryOne(
      `SELECT token, created_at AS createdAt, last_fetched_at AS lastFetchedAt
         FROM client_calendar_feed_tokens
        WHERE org_id = ? AND user_id = ? AND revoked_at IS NULL
        ORDER BY id DESC LIMIT 1`,
      [req.user.org_id, req.user.user_id]);
    return success(res, { subscription: row || null }, 'Subscription fetched');
  } catch (e) { logger.error('Feed subscription read:', e); return error(res, e.message, 500); }
});

router.post('/me/subscription', authenticate, async (req, res) => {
  try {
    // Regenerating REVOKES the old row rather than editing it, so a leaked URL
    // stays dead and the revocation stays on the record.
    await query(
      'UPDATE client_calendar_feed_tokens SET revoked_at = NOW() WHERE org_id = ? AND user_id = ? AND revoked_at IS NULL',
      [req.user.org_id, req.user.user_id]);
    const token = crypto.randomBytes(32).toString('hex');
    await query(
      'INSERT INTO client_calendar_feed_tokens (org_id, user_id, token) VALUES (?,?,?)',
      [req.user.org_id, req.user.user_id, token]);
    return success(res, { token }, 'Calendar subscription ready');
  } catch (e) { logger.error('Feed subscription create:', e); return error(res, e.message, 500); }
});

router.delete('/me/subscription', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE client_calendar_feed_tokens SET revoked_at = NOW() WHERE org_id = ? AND user_id = ? AND revoked_at IS NULL',
      [req.user.org_id, req.user.user_id]);
    return success(res, {}, 'Calendar subscription turned off');
  } catch (e) { logger.error('Feed subscription revoke:', e); return error(res, e.message, 500); }
});

module.exports = router;
