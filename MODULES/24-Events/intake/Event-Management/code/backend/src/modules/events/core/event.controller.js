const eventService = require('./event.service');

async function getAllEvents(req, res) {
  const {
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await eventService.getAllEvents({
    search,
    status,
    startDate,
    endDate,
    page: Number(page),
    limit: Number(limit),
    orgId: req.tenant.orgId,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

async function getEventById(req, res) {
  const event = await eventService.getEventById(
    req.params.eventId,
    req.tenant.orgId
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found.',
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: { event },
  });
}

async function createEvent(req, res) {
  const event = await eventService.createEvent(
    req.body,
    req.tenant.orgId,
    req.user?.id || req.user.id
  );

  return res.status(201).json({
    success: true,
    data: { event },
  });
}

async function updateEvent(req, res) {
  const event = await eventService.updateEvent(
    req.params.eventId,
    req.body,
    req.tenant.orgId
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found.',
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: { event },
  });
}

async function updateEventStatus(req, res) {
  const event = await eventService.updateEventStatus(
    req.params.eventId,
    req.body.status,
    req.tenant.orgId
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found.',
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: { event },
  });
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
};