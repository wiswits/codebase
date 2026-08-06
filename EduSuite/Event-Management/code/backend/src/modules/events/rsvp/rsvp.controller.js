const asyncHandler = require('../../../utils/asyncHandler');
const { success } = require('../../../utils/response');
const rsvpService = require('./rsvp.service');

/**
 * PUT /api/v1/events/:eventId/rsvp
 * Submits or updates the authenticated user's RSVP for an event.
 */
const upsertRsvp = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status } = req.body;

  const rsvp = await rsvpService.upsertRsvp({
    orgId: req.tenant.orgId,
    eventId,
    userId: req.user.id,
    status,
  });

  return success(res, { rsvp }, 200);
});

/**
 * GET /api/v1/events/:eventId/rsvps
 * Returns the RSVP summary for an event. Requires management permission
 * (enforced by requirePermission middleware on the route).
 */
const getRsvpSummary = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { status, page, limit } = req.query;

  const summary = await rsvpService.getRsvpSummary({
    orgId: req.tenant.orgId,
    eventId,
    status,
    page,
    limit,
  });

  return success(res, summary, 200);
});

module.exports = { upsertRsvp, getRsvpSummary };
