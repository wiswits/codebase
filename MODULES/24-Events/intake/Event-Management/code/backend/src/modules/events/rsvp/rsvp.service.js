const { withTransaction } = require('../../../config/db');
const AppError = require('../../../utils/AppError');
const eventQueries = require('../shared/event.queries');
const rsvpQueries = require('./rsvp.queries');

/**
 * Creates or updates an RSVP for an event.
 *
 * Current database rules:
 * - Event must exist within the tenant.
 * - Capacity is enforced for "going" responses.
 * - One RSVP is maintained per user per event.
 */
async function upsertRsvp({ orgId, eventId, userId, status }) {
  return withTransaction(async (conn) => {
    const event = await eventQueries.findEventByIdForUpdate(
      orgId,
      eventId,
      conn
    );

    if (!event) {
      throw new AppError(
        404,
        'EVENT_NOT_FOUND',
        'Event not found.'
      );
    }

    const existing =
      await rsvpQueries.findRsvpByEventAndUser(
        orgId,
        eventId,
        userId,
        conn
      );

    if (
      status === 'going' &&
      event.capacity !== null &&
      event.capacity !== undefined
    ) {
      const alreadyGoing =
        existing && existing.status === 'going';

      if (!alreadyGoing) {
        const goingCount =
          await rsvpQueries.countGoingRsvps(
            orgId,
            eventId,
            conn,
            { forUpdate: true }
          );

        if (goingCount >= event.capacity) {
          throw new AppError(
            409,
            'EVENT_CAPACITY_FULL',
            'This event has reached its RSVP capacity.'
          );
        }
      }
    }

    return rsvpQueries.upsertRsvp(
      orgId,
      eventId,
      userId,
      status,
      conn
    );
  });
}

/**
 * Returns RSVP rows, status counts and pagination
 * information for an event.
 */
async function getRsvpSummary({
  orgId,
  eventId,
  status,
  page,
  limit,
}) {
  const event = await eventQueries.findEventById(
    orgId,
    eventId
  );

  if (!event) {
    throw new AppError(
      404,
      'EVENT_NOT_FOUND',
      'Event not found.'
    );
  }

  const [{ rows, total }, counts] = await Promise.all([
    rsvpQueries.listRsvpsByEvent(
      orgId,
      eventId,
      { status, page, limit }
    ),
    rsvpQueries.countByStatus(orgId, eventId),
  ]);

  return {
    event: {
      id: event.id,
      title: event.title,
    },

    counts,

    rsvps: rows,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

module.exports = {
  upsertRsvp,
  getRsvpSummary,
};