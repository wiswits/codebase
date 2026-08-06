'use strict';
const { transaction } = require('../../../config/db');
const { AppError } = require('../_kit');
const eventQueries = require('../shared/event.queries');
const resourceQueries = require('./resource.queries');

async function listResources({ orgId, page, limit, schoolId = null }) {
  const { rows, total } = await resourceQueries.listResources(orgId, { page, limit, schoolId });
  return {
    resources: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  };
}

/**
 * Availability for a resource. With startTime/endTime → free/conflicts for that
 * window; without → the resource's upcoming booked schedule.
 */
async function getAvailability({ orgId, resourceId, startTime, endTime, schoolId = null }) {
  const resource = await resourceQueries.findResourceById(orgId, resourceId, undefined, schoolId);
  if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');

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
 * Books a resource for an event. Event + resource must exist (tenant-scoped);
 * overlapping bookings for that resource are rejected as RESOURCE_CONFLICT.
 */
async function bookResource({ orgId, eventId, resourceId, startTime, endTime, userId, schoolId = null }) {
  return transaction(async (conn) => {
    const event = await eventQueries.findEventById(orgId, eventId, conn, schoolId);
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');

    const resource = await resourceQueries.findResourceById(orgId, resourceId, conn, schoolId);
    if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');

    const conflicts = await resourceQueries.findOverlappingBookings(
      orgId, resourceId, startTime, endTime, conn, { forUpdate: true }
    );
    if (conflicts.length > 0) {
      throw new AppError(
        409, 'RESOURCE_CONFLICT',
        'This resource is already booked for an overlapping time window.',
        { conflictingBookings: conflicts }
      );
    }

    return resourceQueries.createBooking(orgId, eventId, resourceId, startTime, endTime, userId, conn, schoolId);
  });
}

async function removeBooking({ orgId, eventId, bookingId, schoolId = null }) {
  const booking = await resourceQueries.findBookingById(orgId, bookingId, undefined, schoolId);
  if (!booking || booking.eventId !== Number(eventId)) {
    throw new AppError(404, 'BOOKING_NOT_FOUND', 'Resource booking not found.');
  }
  // The booking is reachable through its RESOURCE; that is not enough. A
  // booking joins a resource to an EVENT, and the event has a branch of its
  // own — an organisation-wide hall booked for a branch-B event must not be
  // unbooked from branch A. Check the far end too.
  const event = await eventQueries.findEventById(orgId, booking.eventId, undefined, schoolId);
  if (!event) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Resource booking not found.');
  await resourceQueries.deleteBooking(orgId, bookingId, undefined, schoolId);
  return { id: booking.id };
}

module.exports = { listResources, getAvailability, bookResource, removeBooking };
