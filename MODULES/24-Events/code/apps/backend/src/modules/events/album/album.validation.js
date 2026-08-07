'use strict';
const Joi = require('joi');

const eventIdParams = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

module.exports = { eventIdParams };
