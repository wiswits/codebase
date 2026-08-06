const Joi = require('joi');

exports.loginValidation = Joi.object({
  employeeId: Joi.string().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean()
});

exports.forgotPasswordValidation = Joi.object({
  employeeId: Joi.string().required(),
  email: Joi.string().email().required()
});

exports.resetPasswordValidation = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

exports.changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});