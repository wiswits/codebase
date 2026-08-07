'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./resource.controller');
const schemas = require('./resource.validation');

/**
 * Two routers: a static resource-catalog path (/resources…) and event-scoped
 * booking paths (/:eventId/resources…). The catalog router MUST mount before the
 * ":eventId" core routes, else Express matches "resources" as an :eventId.
 */
const catalogRouter = Router();

catalogRouter.get(
  '/resources',
  requirePermission('events.view'),
  validate(schemas.listQuery, 'query'),
  controller.listResources
);

catalogRouter.get(
  '/resources/:resourceId/availability',
  requirePermission('events.view'),
  validate(schemas.resourceIdParams, 'params'),
  validate(schemas.availabilityQuery, 'query'),
  controller.getAvailability
);

const bookingRouter = Router();

bookingRouter.post(
  '/:eventId/resources',
  requirePermission('events.resource_manage'),
  validate(schemas.eventResourceBookingParams, 'params'),
  validate(schemas.bookResourceBody, 'body'),
  controller.bookResource
);

bookingRouter.delete(
  '/:eventId/resources/:bookingId',
  requirePermission('events.resource_manage'),
  validate(schemas.bookingIdParams, 'params'),
  controller.removeBooking
);

module.exports = { catalogRouter, bookingRouter };
