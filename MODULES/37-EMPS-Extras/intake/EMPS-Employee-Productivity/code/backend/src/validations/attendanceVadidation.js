const Joi = require('joi');

exports.checkInValidation = Joi.object({
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  address: Joi.string(),
  notes: Joi.string()
});

exports.checkOutValidation = Joi.object({
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  address: Joi.string(),
  notes: Joi.string()
});

exports.correctAttendanceValidation = Joi.object({
  corrections: Joi.array().items(Joi.object({
    field: Joi.string().required(),
    value: Joi.any().required()
  })).required(),
  reason: Joi.string().required()
});