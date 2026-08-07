'use strict';
const { Router } = require('express');
const Joi = require('joi');
const { requirePermission } = require('../../../middleware/rbac');
const { validate, AppError, asyncHandler } = require('../_kit');
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { query } = require('../../../config/db');
const { getActiveSchool } = require('../../../utils/activeSchool');
const eventService = require('../core/event.service');

/*
 * Reminders on an event. The set is replaced in one call, like the audience and
 * for the same reason: a school edits "remind me a week before and the day
 * before" as one decision.
 *
 * The offsets are minutes BEFORE the start. The presets a school actually uses
 * are 7 days, 1 day, 2 hours and at-the-start, but the column is a plain number
 * so a school that wants 30 minutes is not told no by the schema.
 *
 * A reminder already SENT is never deleted by a replace. Deleting it would let
 * the next sweep re-create and re-send the same nudge — the exact double-send
 * the claim mechanism exists to prevent, reintroduced through the front door.
 */
const MAX_OFFSET = 365 * 24 * 60; // a year ahead; beyond that is a typo

const remindersBody = Joi.object({
  reminders: Joi.array().items(Joi.object({
    offsetMinutes: Joi.number().integer().min(0).max(MAX_OFFSET).required(),
    channels: Joi.string().max(100).default('in_app'),
  })).max(10).required(),
});

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const router = Router({ mergeParams: true });

async function mustSeeEvent(req) {
  const event = await eventService.getEventById(
    req.params.eventId, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  return event;
}

const list = asyncHandler(async (req, res) => {
  await mustSeeEvent(req);
  const rows = await query(
    `SELECT id, offset_minutes AS offsetMinutes, channels, sent_at AS sentAt, sent_count AS sentCount
       FROM client_em_event_reminders
      WHERE org_id = ? AND event_id = ?
      ORDER BY offset_minutes DESC`,
    [req.user.org_id, req.params.eventId]);
  return success(res, { reminders: rows || [] }, 'Reminders fetched');
});

const replace = asyncHandler(async (req, res) => {
  const event = await mustSeeEvent(req);
  const wanted = req.body.reminders || [];

  // Only UNSENT reminders are removed. One that has gone out is history, and
  // history is not editable — see the note at the top of this file.
  await query(
    'DELETE FROM client_em_event_reminders WHERE org_id = ? AND event_id = ? AND sent_at IS NULL',
    [req.user.org_id, event.id]);

  for (const r of wanted) {
    // INSERT IGNORE against the unique key: asking again for a reminder that
    // has already been sent is a no-op, not a duplicate and not an error.
    await query(
      `INSERT IGNORE INTO client_em_event_reminders
         (org_id, event_id, offset_minutes, channels, created_by)
       VALUES (?,?,?,?,?)`,
      [req.user.org_id, event.id, r.offsetMinutes, r.channels || 'in_app', req.user.user_id]);
  }

  await audit(req, 'EVENT_REMINDERS_SET', 'event', event.id, {
    new_data: { title: event.title, offsets: wanted.map((r) => r.offsetMinutes) },
  });

  const rows = await query(
    `SELECT id, offset_minutes AS offsetMinutes, channels, sent_at AS sentAt, sent_count AS sentCount
       FROM client_em_event_reminders
      WHERE org_id = ? AND event_id = ? ORDER BY offset_minutes DESC`,
    [req.user.org_id, event.id]);
  return success(res, { reminders: rows || [] }, 'Reminders saved');
});

router.get('/:eventId/reminders',
  requirePermission('events.view'), validate(eventIdParams, 'params'), list);

router.put('/:eventId/reminders',
  requirePermission('events.manage'), validate(eventIdParams, 'params'), validate(remindersBody), replace);

module.exports = router;
