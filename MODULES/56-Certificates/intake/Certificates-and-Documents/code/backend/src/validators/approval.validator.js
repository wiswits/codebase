const Joi = require('joi');

const createApprovalSchema = Joi.object({
  documentId: Joi.number().integer().positive().required(),
  workflowType: Joi.string().required(),
  approvers: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  deadline: Joi.date().required()
});

const approveSchema = Joi.object({
  comments: Joi.string().max(1000).allow('')
});

const rejectSchema = Joi.object({
  reason: Joi.string().required()
});

module.exports = { createApprovalSchema, approveSchema, rejectSchema };