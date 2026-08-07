const { Router } = require('express');
const validate = require('../../../middleware/validate');
const requirePermission = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../constants/permissions');
const controller = require('./resource.controller');
const schemas = require('./resource.validation');

/**
 * Split into two routers because the API contract mixes a static resource
 * catalog path (/events/resources...) with event-scoped booking paths
 * (/events/:eventId/resources...). Registration order in events.routes.js
 * matters: the catalog router (static "resources" segment) must be mounted
 * before the ":eventId" routes, or Express would try to match "resources"
 * as an :eventId value.
 */

// GET /api/v1/events/resources
// GET /api/v1/events/resources/:resourceId/availability
const catalogRouter = Router();

catalogRouter.get('/resources', validate(schemas.listQuery, 'query'), controller.listResources);

catalogRouter.get(
  '/resources/:resourceId/availability',
  validate(schemas.resourceIdParams, 'params'),
  validate(schemas.availabilityQuery, 'query'),
  controller.getAvailability
);

// POST   /api/v1/events/:eventId/resources
// DELETE /api/v1/events/:eventId/resources/:bookingId
const bookingRouter = Router();

bookingRouter.post(
  '/:eventId/resources',
  validate(schemas.eventResourceBookingParams, 'params'),
  validate(schemas.bookResourceBody, 'body'),
  requirePermission(PERMISSIONS.EVENT_RESOURCE_MANAGE),
  controller.bookResource
);

bookingRouter.delete(
  '/:eventId/resources/:bookingId',
  validate(schemas.bookingIdParams, 'params'),
  requirePermission(PERMISSIONS.EVENT_RESOURCE_MANAGE),
  controller.removeBooking
);

module.exports = { catalogRouter, bookingRouter };
