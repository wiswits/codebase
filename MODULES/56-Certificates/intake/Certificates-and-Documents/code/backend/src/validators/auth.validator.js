const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  orgId: Joi.number().integer().positive().required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'coordinator', 'teacher', 'staff').required(),
  orgId: Joi.number().integer().positive().required()
});

module.exports = { loginSchema, registerSchema };