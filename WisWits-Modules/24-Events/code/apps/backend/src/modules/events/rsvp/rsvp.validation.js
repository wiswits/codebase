'use strict';
const Joi = require('joi');

const RSVP_STATUSES = ['going', 'maybe', 'not_going'];

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

const submitRsvpBody = Joi.object({
  status: Joi.string().valid(...RSVP_STATUSES).required(),
});

const summaryQuery = Joi.object({
  status: Joi.string().valid(...RSVP_STATUSES).optional(),
  page: Joi.number().integer().min(1).default(1),
  // 100 was the cap while this list only ever fed a scrolling modal. It now
  // feeds a PRINTED guest list, and a 500-seat annual function truncated at
  // response 100 is a sheet that quietly leaves 400 families off the gate list.
  limit: Joi.number().integer().min(1).max(2000).default(20),
});

module.exports = { RSVP_STATUSES, eventIdParams, submitRsvpBody, summaryQuery };
