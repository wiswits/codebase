const Joi = require('joi');

const RSVP_STATUSES = ['going', 'maybe', 'not_going'];

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const submitRsvpBody = Joi.object({
  status: Joi.string()
    .valid(...RSVP_STATUSES)
    .required(),
});

const summaryQuery = Joi.object({
  status: Joi.string().valid(...RSVP_STATUSES).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  RSVP_STATUSES,
  eventIdParams,
  submitRsvpBody,
  summaryQuery,
};
