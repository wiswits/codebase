const asyncHandler = require('../../../utils/asyncHandler');
const { success } = require('../../../utils/response');
const resourceService = require('./resource.service');

/**
 * GET /api/v1/events/resources
 */
const listResources = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await resourceService.listResources({ orgId: req.tenant.orgId, page, limit });
  return success(res, result, 200);
});

/**
 * GET /api/v1/events/resources/:resourceId/availability
 */
const getAvailability = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { startTime, endTime } = req.query;
  const result = await resourceService.getAvailability({
    orgId: req.tenant.orgId,
    resourceId,
    startTime,
    endTime,
  });
  return success(res, result, 200);
});

/**
 * POST /api/v1/events/:eventId/resources
 */
const bookResource = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { resourceId, startTime, endTime } = req.body;

  const booking = await resourceService.bookResource({
    orgId: req.tenant.orgId,
    eventId,
    resourceId,
    startTime,
    endTime,
    userId: req.user.id,
  });

  return success(res, { booking }, 201);
});

/**
 * DELETE /api/v1/events/:eventId/resources/:bookingId
 */
const removeBooking = asyncHandler(async (req, res) => {
  const { eventId, bookingId } = req.params;
  const result = await resourceService.removeBooking({ orgId: req.tenant.orgId, eventId, bookingId });
  return success(res, result, 200);
});

module.exports = { listResources, getAvailability, bookResource, removeBooking };
