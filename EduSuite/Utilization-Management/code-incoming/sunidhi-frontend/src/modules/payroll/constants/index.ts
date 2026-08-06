import type { AdjustmentStatus, PayrollRunStatus, PayslipStatus } from '../types';

/** Module Contract §27 */
export const PAYROLL_API_BASE = '/api/v1/hr/payroll';

/** Module Contract §43 — enforced by backend; frontend uses these only to
 *  conditionally hide/show UI. Hiding a button is NEVER authorization. */
export const PAYROLL_PERMISSIONS = {
  VIEW: 'hr.payroll.view',
  MANAGE: 'hr.payroll.manage',
  RUN: 'hr.payroll.run',
} as const;

export const PAYROLL_RUN_STATUS_LABEL: Record<PayrollRunStatus, string> = {
  draft: 'Draft',
  prepared: 'Prepared',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

/** Tailwind classes only — no color used as the sole signal (§11 a11y, §24 UI/UX). */
export const PAYROLL_RUN_STATUS_STYLE: Record<PayrollRunStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border border-slate-300',
  prepared: 'bg-blue-50 text-blue-700 border border-blue-300',
  processing: 'bg-amber-50 text-amber-800 border border-amber-300',
  completed: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
  failed: 'bg-red-50 text-red-700 border border-red-300',
};

export const ADJUSTMENT_STATUS_LABEL: Record<AdjustmentStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  cancelled: 'Cancelled',
};

export const ADJUSTMENT_STATUS_STYLE: Record<AdjustmentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border border-slate-300',
  approved: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
  cancelled: 'bg-red-50 text-red-700 border border-red-300',
};

export const PAYSLIP_STATUS_LABEL: Record<PayslipStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
};

/** Only DRAFT run-level adjustments may be edited/removed per §16 / §17. */
export const EDITABLE_RUN_STATUSES: PayrollRunStatus[] = ['draft', 'prepared'];

export const DEFAULT_PAGE_SIZE = 20;
