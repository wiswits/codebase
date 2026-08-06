'use strict';
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');

const coreEventRoutes = require('./core/event.routes');
const rsvpRoutes = require('./rsvp/rsvp.routes');
const { catalogRouter, bookingRouter } = require('./resources/resource.routes');
const albumRoutes = require('./album/album.routes');
const audienceRoutes = require('./audience/audience.routes');
const reminderRoutes = require('./reminders/reminder.routes');

const router = Router();

// Every Event Management route requires authentication. Tenant identity comes
// from req.user.org_id (set by authenticate) — never from body/params.
router.use(authenticate);

// Static/specialized routes first so "/resources" is not read as an ":eventId".
router.use('/', catalogRouter);   // GET /resources, /resources/:id/availability
router.use('/', rsvpRoutes);      // PUT/GET /:eventId/rsvp(s)
router.use('/', bookingRouter);   // POST/DELETE /:eventId/resources
router.use('/', albumRoutes);     // POST/GET /:eventId/album (Gallery link)
router.use('/', audienceRoutes);  // GET/PUT /:eventId/audience, POST .../preview (WW-8)
router.use('/', reminderRoutes);  // GET/PUT /:eventId/reminders (LOOP 3)
router.use('/', coreEventRoutes); // core CRUD LAST (contains /:eventId)

module.exports = router;
