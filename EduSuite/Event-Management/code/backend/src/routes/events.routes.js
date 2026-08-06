const { Router } = require('express');

const authenticate = require('../middleware/auth.middleware');
const tenantContext = require('../middleware/tenant.middleware');

const coreEventRoutes = require('../modules/events/core/event.routes');
const rsvpRoutes = require('../modules/events/rsvp/rsvp.routes');

const {
  catalogRouter,
  bookingRouter,
} = require('../modules/events/resources/resource.routes');

const router = Router();

// All Event Management routes require authentication
// and tenant context.
router.use(authenticate, tenantContext);

// Static/specialized routes first.
// This prevents paths such as "/resources" from being
// interpreted as an ":eventId".
router.use('/', catalogRouter);

// RSVP routes
router.use('/', rsvpRoutes);

// Resource booking routes
router.use('/', bookingRouter);

// Core Event CRUD routes LAST because they contain /:eventId.
router.use('/', coreEventRoutes);

module.exports = router;