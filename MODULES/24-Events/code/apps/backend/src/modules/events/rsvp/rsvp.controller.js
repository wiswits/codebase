'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const rsvpService = require('./rsvp.service');

// PUT /:eventId/rsvp — the authenticated user's own RSVP (self-service).
const upsertRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body;
  const rsvp = await rsvpService.upsertRsvp({
    orgId: req.user.org_id,
    eventId,
    userId: req.user.user_id,
    status,
    schoolId: await getActiveSchool(req),
  });
  await audit(req, 'EVENT_RSVP', 'event', Number(eventId), { new_data: { status } });
  return success(res, { rsvp }, 'RSVP saved');
});

// GET /:eventId/rsvps — RSVP summary (requires events.rsvp_manage).
const getRsvpSummary = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status, page, limit } = req.query;
  const summary = await rsvpService.getRsvpSummary({
    orgId: req.user.org_id,
    eventId,
    status,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    schoolId: await getActiveSchool(req),
  });
  return success(res, summary, 'RSVP summary fetched');
});

module.exports = { upsertRsvp, getRsvpSummary };
