const Joi = require('joi');

exports.createEmployeeValidation = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'hr', 'manager', 'employee'),
  department: Joi.string(),
  position: Joi.string(),
  phone: Joi.string(),
  address: Joi.string(),
  dateOfBirth: Joi.date(),
  joiningDate: Joi.date(),
  manager: Joi.string(),
  skills: Joi.array().items(Joi.string())
});

exports.updateEmployeeValidation = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'hr', 'manager', 'employee'),
  department: Joi.string(),
  position: Joi.string(),
  phone: Joi.string(),
  address: Joi.string(),
  dateOfBirth: Joi.date(),
  joiningDate: Joi.date(),
  manager: Joi.string(),
  skills: Joi.array().items(Joi.string()),
  isActive: Joi.boolean()
});

exports.assignRoleValidation = Joi.object({
  role: Joi.string().valid('admin', 'hr', 'manager', 'employee').required()
});

exports.resetPasswordValidation = Joi.object({
  newPassword: Joi.string().min(6).required()
});