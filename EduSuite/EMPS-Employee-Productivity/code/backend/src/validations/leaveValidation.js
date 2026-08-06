const Joi = require('joi');

exports.applyLeaveValidation = Joi.object({
  type: Joi.string().valid('casual', 'sick', 'emergency', 'paid', 'half-day', 'work-from-home').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().required(),
  attachments: Joi.array().items(Joi.object({
    name: Joi.string(),
    url: Joi.string(),
    type: Joi.string()
  }))
});

exports.approveLeaveValidation = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  comments: Joi.string()
});