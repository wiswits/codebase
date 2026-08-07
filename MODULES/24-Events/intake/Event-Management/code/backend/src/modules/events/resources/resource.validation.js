const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const resourceIdParams = Joi.object({
  resourceId: Joi.number().integer().positive().required(),
});

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const eventResourceBookingParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const bookingIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
  bookingId: Joi.number().integer().positive().required(),
});

const availabilityQuery = Joi.object({
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().min(Joi.ref('startTime')).optional(),
}).and('startTime', 'endTime'); // both or neither must be provided

const bookResourceBody = Joi.object({
  resourceId: Joi.number().integer().positive().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
});

module.exports = {
  listQuery,
  resourceIdParams,
  eventIdParams,
  eventResourceBookingParams,
  bookingIdParams,
  availabilityQuery,
  bookResourceBody,
};
