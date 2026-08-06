const { withTransaction } = require('../../../config/db');
const AppError = require('../../../utils/AppError');
const eventQueries = require('../shared/event.queries');
const resourceQueries = require('./resource.queries');

async function listResources({ orgId, page, limit }) {
  const { rows, total } = await resourceQueries.listResources(orgId, { page, limit });
  return {
    resources: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  };
}

/**
 * GET availability for a resource.
 *
 * - If startTime/endTime are provided: returns whether the resource is free
 *   for that exact window plus any conflicting bookings.
 * - If not provided: returns the resource's upcoming booked schedule.
 */
async function getAvailability({ orgId, resourceId, startTime, endTime }) {
  const resource = await resourceQueries.findResourceById(orgId, resourceId);
  if (!resource) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
  }

  if (startTime && endTime) {
    const conflicts = await resourceQueries.findOverlappingBookings(orgId, resourceId, startTime, endTime);
    return {
      resource,
      requestedWindow: { startTime, endTime },
      available: conflicts.length === 0,
      conflictingBookings: conflicts,
    };
  }

  const upcomingBookings = await resourceQueries.listBookingsForResource(orgId, resourceId);
  return { resource, upcomingBookings };
}

/**
 * Books a resource for an event.
 *
 * Enforces (EVENT_MANAGEMENT_CONTRACT.md, "RESOURCE RULES"):
 *  - event exists (tenant scoped)
 *  - resource exists (tenant scoped)
 *  - conflict detection rejects overlapping bookings for that resource,
 *    surfaced as RESOURCE_CONFLICT
 */
async function bookResource({ orgId, eventId, resourceId, startTime, endTime, userId }) {
  return withTransaction(async (conn) => {
    const event = await eventQueries.findEventById(orgId, eventId, conn);
    if (!event) {
      throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
    }

    const resource = await resourceQueries.findResourceById(orgId, resourceId, conn);
    if (!resource) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
    }

    const conflicts = await resourceQueries.findOverlappingBookings(
      orgId,
      resourceId,
      startTime,
      endTime,
      conn,
      { forUpdate: true }
    );

    if (conflicts.length > 0) {
      throw new AppError(
        409,
        'RESOURCE_CONFLICT',
        'This resource is already booked for an overlapping time window.',
        { conflictingBookings: conflicts }
      );
    }

    const booking = await resourceQueries.createBooking(
      orgId,
      eventId,
      resourceId,
      startTime,
      endTime,
      userId,
      conn
    );
    return booking;
  });
}

async function removeBooking({ orgId, eventId, bookingId }) {
  const booking = await resourceQueries.findBookingById(orgId, bookingId);
  if (!booking || booking.eventId !== Number(eventId)) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Resource booking not found.');
  }

  await resourceQueries.deleteBooking(orgId, bookingId);
  return { id: booking.id };
}

module.exports = { listResources, getAvailability, bookResource, removeBooking };
