const Joi = require('joi');

exports.validateEmail = (email) => {
  const schema = Joi.string().email().required();
  const { error } = schema.validate(email);
  return !error;
};

exports.validatePhone = (phone) => {
  const schema = Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/);
  const { error } = schema.validate(phone);
  return !error;
};

exports.validatePassword = (password) => {
  const schema = Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/);
  const { error } = schema.validate(password);
  return !error;
};

exports.validateUrl = (url) => {
  const schema = Joi.string().uri();
  const { error } = schema.validate(url);
  return !error;
};

exports.validateDate = (date) => {
  const schema = Joi.date().iso();
  const { error } = schema.validate(date);
  return !error;
};

exports.validateObjectId = (id) => {
  const schema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
  const { error } = schema.validate(id);
  return !error;
};

exports.validateArray = (array, itemValidator) => {
  if (!Array.isArray(array)) return false;
  return array.every(item => itemValidator(item));
};

exports.validateEnum = (value, enumValues) => {
  return enumValues.includes(value);
};

exports.validateRange = (value, min, max) => {
  return value >= min && value <= max;
};

exports.validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

exports.validateFileSize = (size, maxSize) => {
  return size <= maxSize;
};