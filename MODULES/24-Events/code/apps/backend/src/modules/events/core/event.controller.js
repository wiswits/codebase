'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { userCan } = require('../../../middleware/rbac');
const { AppError, asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const eventReminders = require('../../../services/eventReminders');
const logger = require('../../../utils/logger');
const eventService = require('./event.service');

// Does the caller hold events.manage? (managers see all statuses; everyone else
// — incl. student/parent with events.view — sees published events only.)
// Via rbac's userCan so it reads the same permission store as the route gate; this
// was a third local copy of the roles query that saw only the legacy JSON column.
const callerCanManage = (req) => userCan(req.user.user_id, 'events.manage', req.user.org_id);

/**
 * Tell the event's audience, once.
 *
 * Called after any write that could have made the event public. The service
 * decides whether it is actually a transition — it CLAIMS
 * `audience_notified_at` and only announces if it won the claim — so calling
 * this from more than one place cannot announce twice. That is why the check
 * lives there and not in an `if` here: a condition duplicated at two call sites
 * is a condition that will disagree with itself.
 *
 * It never fails the request. The event IS saved; a notification that did not
 * go out is not a reason to tell the school their event was not created.
 */
async function announce(req, event) {
  try {
    const r = await eventReminders.announcePublished(req.user.org_id, event.id);
    if (r.announced && r.sent) {
      await audit(req, 'EVENT_AUDIENCE_NOTIFIED', 'event', event.id, {
        new_data: { title: event.title, sent: r.sent },
      });
    }
    return r;
  } catch (e) {
    logger.error('[events] announce failed (event is saved):', e.message);
    return { announced: false, sent: 0, reason: 'error' };
  }
}

const getAllEvents = asyncHandler(async (req, res) => {
  const { search, status, startDate, endDate, page, limit, view } = req.query;
  const canManage = await callerCanManage(req);
  const result = await eventService.getAllEvents({
    search, status, startDate, endDate, view,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    orgId: req.user.org_id,
    userId: req.user.user_id,
    publishedOnly: !canManage,
    // The branch is resolved here, from the request, and threaded down as a
    // plain number — the service layer never sees a request object.
    schoolId: await getActiveSchool(req),
  });
  return success(res, result, 'Events fetched');
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  // The list hides drafts, archived and binned events from everyone without
  // events.manage — fetching one BY ID has to hide exactly the same things, or
  // the filtering is theatre. Same 404 either way: "not found" is the honest
  // answer to a student asking for an event the school took off the board.
  if (event.deletedAt || event.archivedAt || event.status === 'draft') {
    if (!(await callerCanManage(req))) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  }
  return success(res, { event }, 'Event fetched');
});

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user.org_id, req.user.user_id, await getActiveSchool(req));
  await audit(req, 'EVENT_CREATE', 'event', event.id, { new_data: { title: event.title, status: event.status } });
  // A school can create straight into `published`, so the announcement has to
  // be reachable from here too — not only from the status endpoint.
  const announced = await announce(req, event);
  return success(res, { event, announced }, 'Event created', 201);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.eventId, req.body, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  await audit(req, 'EVENT_UPDATE', 'event', event.id, { new_data: req.body });
  const announced = await announce(req, event);
  return success(res, { event, announced }, 'Event updated');
});

const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await eventService.updateEventStatus(req.params.eventId, req.body.status, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  await audit(req, 'EVENT_STATUS_CHANGE', 'event', event.id, { new_data: { status: event.status } });
  const announced = await announce(req, event);
  return success(res, { event, announced }, 'Event status updated');
});

// PATCH /:eventId/state — archive · bin · restore. One endpoint, because all
// three are the same move between shelves and a school thinks of them together.
const AUDIT_ACTION = { archived: 'EVENT_ARCHIVE', deleted: 'EVENT_DELETE', active: 'EVENT_RESTORE' };

const updateEventLifecycle = asyncHandler(async (req, res) => {
  const { state } = req.body;
  const event = await eventService.updateEventLifecycle(req.params.eventId, state, req.user.org_id, await getActiveSchool(req));
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  await audit(req, AUDIT_ACTION[state], 'event', event.id, {
    new_data: { state, title: event.title, archivedAt: event.archivedAt, deletedAt: event.deletedAt },
  });
  const message = state === 'archived' ? 'Event archived' : state === 'deleted' ? 'Event deleted' : 'Event restored';
  return success(res, { event }, message);
});

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, updateEventStatus, updateEventLifecycle };
