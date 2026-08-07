const Joi = require('joi');

const createTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  type: Joi.string().valid(
    'certificate', 'id_card', 'bonafide', 'tc', 'migration',
    'character', 'admit_card', 'report_card', 'fee_receipt',
    'appointment', 'experience', 'salary_slip', 'hostel_card',
    'bus_pass', 'gate_pass', 'custom'
  ).required(),
  category: Joi.string().max(100).allow(''),
  description: Joi.string().max(1000).allow(''),
  designData: Joi.object().required(),
  placeholderData: Joi.object().allow(null)
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  category: Joi.string().max(100).allow(''),
  description: Joi.string().max(1000).allow(''),
  designData: Joi.object(),
  placeholderData: Joi.object().allow(null),
  status: Joi.string().valid('draft', 'review', 'approved', 'published', 'archived')
});

const cloneTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(255).required()
});

module.exports = { createTemplateSchema, updateTemplateSchema, cloneTemplateSchema };