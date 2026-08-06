// src/modules/utilization/constants/utilization.constants.ts
//
// Display labels only — the underlying status values themselves are
// fixed by the contract ("EMPLOYEE MANAGEMENT", "RESOURCE ALLOCATION",
// "BENCH MANAGEMENT" sections), not invented here.
//
// Brand colors below come from the contract's "DESIGN SYSTEM" section
// and are mandatory across every EduSuite module:
// Primary #0F2147 · Gold #C8A04E · Ivory #F7F4EC

import { AllocationStatus, BenchRecordStatus, EmploymentStatus } from "../types/utilization.types";

export const UTILIZATION_API_BASE = "/api/v1/utilization";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const BRAND_PRIMARY = "#0F2147";
export const BRAND_GOLD = "#C8A04E";
export const BRAND_IVORY = "#F7F4EC";

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  archived: "Archived",
};

export const EMPLOYMENT_STATUS_BADGE_CLASSES: Record<EmploymentStatus, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  on_leave: "bg-amber-50 text-amber-700",
  archived: "bg-red-50 text-red-700",
};

export const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "archived", label: "Archived" },
];

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ALLOCATION_STATUS_BADGE_CLASSES: Record<AllocationStatus, string> = {
  active: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export const ALLOCATION_STATUS_OPTIONS: { value: AllocationStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const BENCH_STATUS_LABELS: Record<BenchRecordStatus, string> = {
  on_bench: "On Bench",
  allocated: "Allocated",
  closed: "Closed",
};

export const BENCH_STATUS_BADGE_CLASSES: Record<BenchRecordStatus, string> = {
  on_bench: "bg-amber-50 text-amber-700",
  allocated: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

export const BENCH_STATUS_OPTIONS: { value: BenchRecordStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "on_bench", label: "On Bench" },
  { value: "allocated", label: "Allocated" },
  { value: "closed", label: "Closed" },
];

// Utilization health bands used by CapacityIndicator / CapacityCard.
// Business rule reference: capacity should always be >= allocated hours,
// so 100%+ is flagged as over-utilized rather than clamped away.
export function utilizationBandClass(percent: number): string {
  if (percent > 100) return "bg-red-50 text-red-700"; // over-utilized
  if (percent >= 70) return "bg-green-50 text-green-700"; // healthy
  if (percent >= 40) return "bg-amber-50 text-amber-700"; // under-utilized
  return "bg-gray-100 text-gray-600"; // bench-risk
}

export function utilizationBandLabel(percent: number): string {
  if (percent > 100) return "Over-Utilized";
  if (percent >= 70) return "Healthy";
  if (percent >= 40) return "Under-Utilized";
  return "At Risk";
}

export const REPORT_GROUP_BY_OPTIONS = [
  { value: "employee", label: "By Employee" },
  { value: "department", label: "By Department" },
  { value: "team", label: "By Team" },
] as const;
