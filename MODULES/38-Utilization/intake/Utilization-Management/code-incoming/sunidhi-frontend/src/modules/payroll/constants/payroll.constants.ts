// src/modules/payroll/constants/payroll.constants.ts
//
// Display labels only. The underlying status values are fixed by the
// contract (Section 15) — frontend, backend, and database must all use
// the same values.

import { PayrollRunStatus, PayslipStatus } from "../types/payroll.types";

export const PAYROLL_API_BASE = "/api/v1/hr/payroll";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const PAYROLL_RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: "Draft",
  prepared: "Prepared",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const PAYROLL_RUN_STATUS_BADGE_CLASSES: Record<PayrollRunStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  prepared: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
};

export const PAYROLL_RUN_STATUS_OPTIONS: { value: PayrollRunStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "prepared", label: "Prepared" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
  pending: "Pending",
  generated: "Generated",
};

export const PAYSLIP_STATUS_BADGE_CLASSES: Record<PayslipStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  generated: "bg-green-50 text-green-700",
};

// Fixed-precision display only — this formats an already-computed
// backend value, it never derives one (Section 46: "Formatting belongs
// in the presentation layer").
export function formatMoney(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
