const Joi = require('joi');

const createPrintJobSchema = Joi.object({
  documentIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  jobType: Joi.string().required(),
  priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
  printerName: Joi.string().max(100).allow('')
});

module.exports = { createPrintJobSchema };