const Joi = require('joi');

const verifyDocumentSchema = Joi.object({
  verificationCode: Joi.string().required(),
  documentNumber: Joi.string().required()
});

module.exports = { verifyDocumentSchema };