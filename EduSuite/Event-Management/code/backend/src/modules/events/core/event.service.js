const eventQueries = require('./event.queries');

async function getAllEvents(filters) {
  const {
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    orgId,
  } = filters;

  const { rows, total } = await eventQueries.listEvents(orgId, {
    search,
    status,
    startDate,
    endDate,
    page,
    limit,
  });

  return {
    events: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

async function getEventById(eventId, orgId) {
  return eventQueries.findEventById(orgId, eventId);
}

async function createEvent(eventData, orgId, userId) {
  return eventQueries.createEvent(eventData, orgId, userId);
}

async function updateEvent(eventId, updateData, orgId) {
  return eventQueries.updateEvent(eventId, updateData, orgId);
}

async function updateEventStatus(eventId, status, orgId) {
  return eventQueries.updateEventStatus(eventId, status, orgId);
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
};