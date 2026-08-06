/**
 * Payroll Module Constants
 */

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PREPARED: 'prepared',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  prepared: 'Prepared',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed'
};

export const PAYROLL_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  prepared: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export const SALARY_STRUCTURE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export const SALARY_STRUCTURE_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive'
};

export const SALARY_STRUCTURE_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800'
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CURRENCY_SYMBOL = '₹';

export const PAYROLL_PERIODS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
];