/**
 * Recruitment Module Helper Functions
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique vacancy code
 */
export const generateVacancyCode = (organizationId) => {
  const prefix = 'VAC';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${organizationId}-${timestamp}-${random}`;
};

/**
 * Generate a unique applicant code
 */
export const generateApplicantCode = (organizationId) => {
  const prefix = 'APP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${organizationId}-${timestamp}-${random}`;
};

/**
 * Generate a unique offer reference
 */
export const generateOfferReference = (organizationId) => {
  const prefix = 'OFF';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${organizationId}-${timestamp}-${random}`;
};

/**
 * Format date to ISO string
 */
export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is in range
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
};

/**
 * Sanitize search query
 */
export const sanitizeSearch = (query) => {
  if (!query) return '';
  return query.trim().replace(/[^a-zA-Z0-9\s\-_@.]/g, '');
};

/**
 * Pagination helper
 */
export const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

/**
 * Build search conditions for SQL
 */
export const buildSearchCondition = (fields, searchTerm) => {
  if (!searchTerm) return '';
  const conditions = fields.map(field => `${field} LIKE ?`);
  return `(${conditions.join(' OR ')})`;
};

/**
 * Get stage order for sorting
 */
export const getStageOrder = (stage) => {
  const stages = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview Scheduled',
    'Interviewed',
    'Selected',
    'Offered',
    'Hired',
    'Rejected'
  ];
  return stages.indexOf(stage);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const regex = /^[0-9+\-\s()]{10,15}$/;
  return regex.test(phone);
};

/**
 * Truncate text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = (json) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export default {
  generateVacancyCode,
  generateApplicantCode,
  generateOfferReference,
  formatDate,
  formatCurrency,
  daysBetween,
  isDateInRange,
  sanitizeSearch,
  getPagination,
  buildSearchCondition,
  getStageOrder,
  isValidEmail,
  isValidPhone,
  truncateText,
  generateRandomString,
  safeJsonParse,
  getInitials,
  isEmpty,
};