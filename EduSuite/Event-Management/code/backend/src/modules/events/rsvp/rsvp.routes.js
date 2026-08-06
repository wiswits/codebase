const { Router } = require('express');
const validate = require('../../../middleware/validate');
const requirePermission = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../constants/permissions');
const controller = require('./rsvp.controller');
const schemas = require('./rsvp.validation');

const router = Router();

// PUT /api/v1/events/:eventId/rsvp
router.put(
  '/:eventId/rsvp',
  validate(schemas.eventIdParams, 'params'),
  validate(schemas.submitRsvpBody, 'body'),
  controller.upsertRsvp
);

// GET /api/v1/events/:eventId/rsvps
router.get(
  '/:eventId/rsvps',
  validate(schemas.eventIdParams, 'params'),
  validate(schemas.summaryQuery, 'query'),
  requirePermission(PERMISSIONS.EVENT_RSVP_MANAGE),
  controller.getRsvpSummary
);

module.exports = router;
