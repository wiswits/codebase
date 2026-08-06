/**
 * Shared Constants
 */

export const COLORS = {
  PRIMARY: '#0F2147',
  GOLD: '#C8A04E',
  IVORY: '#F7F4EC',
  SUCCESS: '#22C55E',
  ERROR: '#EF4444',
  WARNING: '#EAB308',
  INFO: '#3B82F6',
};

export const UTILIZATION_THRESHOLDS = {
  OPTIMAL_MIN: 70,
  OPTIMAL_MAX: 85,
  OVER: 85,
  UNDER: 70,
};

export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ALLOCATION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const BENCH_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  DISPLAY_TIME: 'MMM dd, yyyy HH:mm',
};

export const CHART_COLORS = [
  '#0F2147',
  '#C8A04E',
  '#22C55E',
  '#3B82F6',
  '#EF4444',
  '#EAB308',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];