/**
 * Validation Utilities
 */

export const isValidId = (id: number): boolean => {
  return Number.isInteger(id) && id > 0;
};

export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

export const isDateRangeValid = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const isDateInPast = (date: string): boolean => {
  return new Date(date) < new Date();
};

export const isDateInFuture = (date: string): boolean => {
  return new Date(date) > new Date();
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateLength = (value: string, min: number, max: number): boolean => {
  return value.length >= min && value.length <= max;
};

export const validateEnum = (value: string, validValues: string[]): boolean => {
  return validValues.includes(value);
};