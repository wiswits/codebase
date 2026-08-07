'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const resourceService = require('./resource.service');

// GET /api/events/resources
const listResources = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await resourceService.listResources({
    orgId: req.user.org_id,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    schoolId: await getActiveSchool(req),
  });
  return success(res, result, 'Resources fetched');
});

// GET /api/events/resources/:resourceId/availability
const getAvailability = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { startTime, endTime } = req.query;
  const result = await resourceService.getAvailability({
    orgId: req.user.org_id,
    resourceId,
    startTime,
    endTime,
    schoolId: await getActiveSchool(req),
  });
  return success(res, result, 'Availability fetched');
});

// POST /api/events/:eventId/resources
const bookResource = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { resourceId, startTime, endTime } = req.body;
  const booking = await resourceService.bookResource({
    orgId: req.user.org_id,
    eventId,
    resourceId,
    startTime,
    endTime,
    userId: req.user.user_id,
    schoolId: await getActiveSchool(req),
  });
  await audit(req, 'EVENT_RESOURCE_BOOK', 'event_resource_booking', booking.id, {
    new_data: { eventId: Number(eventId), resourceId, startTime, endTime },
  });
  return success(res, { booking }, 'Resource booked', 201);
});

// DELETE /api/events/:eventId/resources/:bookingId
const removeBooking = asyncHandler(async (req, res) => {
  const { eventId, bookingId } = req.params;
  const result = await resourceService.removeBooking({
    orgId: req.user.org_id,
    eventId,
    bookingId,
    schoolId: await getActiveSchool(req),
  });
  await audit(req, 'EVENT_RESOURCE_UNBOOK', 'event_resource_booking', Number(bookingId), {
    old_data: { eventId: Number(eventId) },
  });
  return success(res, result, 'Booking removed');
});

module.exports = { listResources, getAvailability, bookResource, removeBooking };
