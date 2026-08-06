'use strict';
const eventQueries = require('./event.queries');

async function getAllEvents(filters) {
  const { search, status, startDate, endDate, page = 1, limit = 10, orgId, publishedOnly = false, userId, view, schoolId } = filters;

  const { rows, total } = await eventQueries.listEvents(orgId, {
    search, status, startDate, endDate, page, limit, publishedOnly, userId, schoolId,
    // Archived and binned events are manager housekeeping. Anyone who cannot
    // manage events sees the active board and nothing else, whatever they ask
    // for — decided here, never trusted from the query string.
    view: publishedOnly ? 'active' : view,
  });

  return {
    events: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  };
}

async function getEventById(eventId, orgId, schoolId = null) {
  return eventQueries.findEventById(orgId, eventId, schoolId);
}

async function createEvent(eventData, orgId, userId, schoolId = null) {
  return eventQueries.createEvent(eventData, orgId, userId, schoolId);
}

async function updateEvent(eventId, updateData, orgId, schoolId = null) {
  return eventQueries.updateEvent(eventId, updateData, orgId, schoolId);
}

async function updateEventStatus(eventId, status, orgId, schoolId = null) {
  return eventQueries.updateEventStatus(eventId, status, orgId, schoolId);
}

async function updateEventLifecycle(eventId, state, orgId, schoolId = null) {
  return eventQueries.updateEventLifecycle(eventId, state, orgId, schoolId);
}

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, updateEventStatus, updateEventLifecycle };
