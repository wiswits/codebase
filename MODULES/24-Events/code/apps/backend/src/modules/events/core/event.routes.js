'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./event.controller');
const { eventSchema, updateEventSchema, statusSchema, lifecycleSchema, eventIdParams, listQuery } = require('./event.validation');

const router = Router();

// Core Event CRUD. Reads need events.view; writes need events.manage.
// (Elevated base roles — owner/admin/principal — auto-pass in rbac.js.)
router.get('/', requirePermission('events.view'), validate(listQuery, 'query'), controller.getAllEvents);
router.post('/', requirePermission('events.manage'), validate(eventSchema), controller.createEvent);

router.patch(
  '/:eventId/status',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  validate(statusSchema),
  controller.updateEventStatus
);

// Archive · bin · restore. Above /:eventId so "state" is never read as an id.
router.patch(
  '/:eventId/state',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  validate(lifecycleSchema),
  controller.updateEventLifecycle
);

router.get('/:eventId', requirePermission('events.view'), validate(eventIdParams, 'params'), controller.getEventById);

router.patch(
  '/:eventId',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  validate(updateEventSchema),
  controller.updateEvent
);

module.exports = router;
