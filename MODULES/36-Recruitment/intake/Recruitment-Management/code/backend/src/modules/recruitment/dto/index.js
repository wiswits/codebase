/**
 * DTO Index
 * Export all DTOs
 */

export * from './vacancy.dto.js';
export * from './applicant.dto.js';
export * from './interview.dto.js';
export * from './offer.dto.js';

export default {
  ...(await import('./vacancy.dto.js')),
  ...(await import('./applicant.dto.js')),
  ...(await import('./interview.dto.js')),
  ...(await import('./offer.dto.js')),
};