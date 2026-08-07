const Joi = require('joi');

const createDocumentSchema = Joi.object({
  templateId: Joi.number().integer().positive().allow(null),
  documentType: Joi.string().required(),
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).allow(''),
  metadata: Joi.object().allow(null),
  issueDate: Joi.date().allow(null),
  expiryDate: Joi.date().allow(null)
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().max(1000).allow(''),
  metadata: Joi.object().allow(null),
  issueDate: Joi.date().allow(null),
  expiryDate: Joi.date().allow(null)
});

const bulkGenerateSchema = Joi.object({
  templateId: Joi.number().integer().positive().required(),
  count: Joi.number().integer().min(1).max(1000).required(),
  parameters: Joi.array().items(Joi.object()).allow(null)
});

module.exports = { createDocumentSchema, updateDocumentSchema, bulkGenerateSchema };