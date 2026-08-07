/**
 * Validation utilities for forms
 */

export const validators = {
  /**
   * Check if email is valid
   */
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Check if phone is valid (Indian format)
   */
  phone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  /**
   * Check if URL is valid
   */
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if date is valid
   */
  date: (date: string): boolean => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  },

  /**
   * Check if date is in the past
   */
  isPastDate: (date: string): boolean => {
    const d = new Date(date);
    return d < new Date();
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (date: string): boolean => {
    const d = new Date(date);
    return d > new Date();
  },

  /**
   * Check if value is empty
   */
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Check if number is within range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Check if string length is within range
   */
  lengthInRange: (str: string, min: number, max: number): boolean => {
    const len = str.length;
    return len >= min && len <= max;
  },

  /**
   * Check if string contains only alphanumeric characters
   */
  isAlphanumeric: (str: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(str);
  },

  /**
   * Check if string contains only letters
   */
  isAlpha: (str: string): boolean => {
    return /^[a-zA-Z\s]+$/.test(str);
  },

  /**
   * Check if string contains only numbers
   */
  isNumeric: (str: string): boolean => {
    return /^\d+$/.test(str);
  },

  /**
   * Validate Indian PAN card number
   */
  isPAN: (pan: string): boolean => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  },

  /**
   * Validate Indian GST number
   */
  isGST: (gst: string): boolean => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
  },
};

export default validators;