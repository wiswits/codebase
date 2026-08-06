const Joi = require('joi');

const eventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),

  description: Joi.string().allow('', null),

  eventType: Joi.string().max(100).allow('', null),

  startDatetime: Joi.date().iso().required(),

  endDatetime: Joi.date()
    .iso()
    .greater(Joi.ref('startDatetime'))
    .required(),

  location: Joi.string().max(255).allow('', null),

  capacity: Joi.number()
    .integer()
    .min(1)
    .allow(null),

  status: Joi.string()
    .valid(
      'draft',
      'scheduled',
      'published',
      'completed',
      'cancelled'
    )
    .default('draft'),
});

const updateEventSchema = eventSchema.fork(
  [
    'title',
    'startDatetime',
    'endDatetime',
  ],
  (schema) => schema.optional()
);

const statusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'draft',
      'scheduled',
      'published',
      'completed',
      'cancelled'
    )
    .required(),
});

module.exports = {
  eventSchema,
  updateEventSchema,
  statusSchema,
};