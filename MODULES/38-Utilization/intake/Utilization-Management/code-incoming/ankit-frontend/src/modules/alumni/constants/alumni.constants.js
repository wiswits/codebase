/**
 * Alumni Module Constants
 * Shared constants used across the module
 */

export const ALUMNI_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LABELS: {
    active: 'Active',
    inactive: 'Inactive'
  }
};

export const ALUMNI_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export const ALUMNI_DEFAULT_PAGE_SIZE = 20;
export const ALUMNI_MAX_PAGE_SIZE = 100;

export const ALUMNI_FILTER_OPTIONS = {
  courses: ['Science', 'Commerce', 'Arts', 'Engineering', 'Medicine'],
  statuses: ['active', 'inactive']
};