'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./rsvp.controller');
const schemas = require('./rsvp.validation');

const router = Router();

// PUT /api/events/:eventId/rsvp — any authenticated user RSVPs for themselves.
router.put(
  '/:eventId/rsvp',
  validate(schemas.eventIdParams, 'params'),
  validate(schemas.submitRsvpBody, 'body'),
  controller.upsertRsvp
);

// GET /api/events/:eventId/rsvps — summary, management permission required.
router.get(
  '/:eventId/rsvps',
  requirePermission('events.rsvp_manage'),
  validate(schemas.eventIdParams, 'params'),
  validate(schemas.summaryQuery, 'query'),
  controller.getRsvpSummary
);

module.exports = router;
