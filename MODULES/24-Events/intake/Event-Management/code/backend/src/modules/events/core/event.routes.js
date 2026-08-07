const { Router } = require('express');

const controller = require('./event.controller');
const validate = require('../../../middleware/validate');

const {
  eventSchema,
  updateEventSchema,
  statusSchema,
} = require('./event.validation');

const router = Router();

// Core Event CRUD
router.get('/', controller.getAllEvents);

router.post(
  '/',
  validate(eventSchema),
  controller.createEvent
);

router.patch(
  '/:eventId/status',
  validate(statusSchema),
  controller.updateEventStatus
);

router.get(
  '/:eventId',
  controller.getEventById
);

router.patch(
  '/:eventId',
  validate(updateEventSchema),
  controller.updateEvent
);



module.exports = router;