export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  // At least 6 characters, at least one uppercase, one lowercase, one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return re.test(password);
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

export const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const validateString = (str, min = 1, max = Infinity) => {
  return typeof str === 'string' && str.length >= min && str.length <= max;
};

export const validateNumber = (num, min = -Infinity, max = Infinity) => {
  return typeof num === 'number' && !isNaN(num) && num >= min && num <= max;
};

export const validateArray = (arr, min = 0, max = Infinity) => {
  return Array.isArray(arr) && arr.length >= min && arr.length <= max;
};

export const validateEnum = (value, enumValues) => {
  return enumValues.includes(value);
};

export const validateRange = (value, min, max) => {
  return value >= min && value <= max;
};

export const validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

export const validateFileSize = (size, maxSize) => {
  return size <= maxSize;
};

export const validateEmployeeId = (id) => {
  return /^[A-Z0-9]{6,10}$/.test(id);
};

export const validateStrongPassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
  if (!/\d/.test(password)) errors.push('Must contain a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain special character');
  return errors;
};

export const validateForm = (data, rules) => {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    if (rule.required && !value) {
      errors[field] = `${field} is required`;
      continue;
    }
    if (rule.min && value.length < rule.min) {
      errors[field] = `${field} must be at least ${rule.min} characters`;
    }
    if (rule.max && value.length > rule.max) {
      errors[field] = `${field} must be less than ${rule.max} characters`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} is invalid`;
    }
  }
  return errors;
};