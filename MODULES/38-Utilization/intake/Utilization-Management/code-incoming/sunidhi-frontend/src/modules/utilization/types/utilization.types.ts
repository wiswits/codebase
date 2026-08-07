// src/modules/utilization/types/utilization.types.ts
//
// Canonical data model for Sunidhi's scope (Contract sections
// "EMPLOYEE MANAGEMENT", "RESOURCE ALLOCATION", "CAPACITY MANAGEMENT",
// "BENCH MANAGEMENT", "REPORTS"). Field names below match those sections
// exactly — frontend, backend, and database must all use the same shape.

export type EmploymentStatus = "active" | "inactive" | "on_leave" | "archived";
export type AllocationStatus = "active" | "completed" | "cancelled";
export type BenchRecordStatus = "on_bench" | "allocated" | "closed";

// Minimal department/project references — full Department and Project
// Management are outside Sunidhi's scope. Her screens only need id/name
// for linking, filtering, and dropdowns.
export interface DepartmentSummary {
  id: number;
  name: string;
}

export interface ProjectSummary {
  id: number;
  name: string;
  client: string;
  departmentId: number;
}

export interface Employee {
  id: number;
  organizationId: number;
  employeeCode: string;
  employeeName: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  employmentStatus: EmploymentStatus;
  weeklyCapacityHours: number;
  utilizationPercent: number;
  allocationCount: number;
  onBench: boolean;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  employeeCode: string;
  employeeName: string;
  departmentId: number;
  designation: string;
  employmentStatus: EmploymentStatus;
  weeklyCapacityHours: number;
  remarks?: string;
}

export interface Allocation {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  projectId: number;
  projectName: string;
  allocationPercent: number;
  workingHours: number;
  startDate: string;
  endDate: string;
  status: AllocationStatus;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationInput {
  employeeId: number;
  projectId: number;
  allocationPercent: number;
  workingHours: number;
  startDate: string;
  endDate: string;
  remarks?: string;
}

export interface CapacityPlan {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  period: string; // e.g. "2026-07"
  weeklyCapacityHours: number;
  monthlyCapacityHours: number;
  allocatedHours: number;
  availableHours: number;
  remainingHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityPlanInput {
  employeeId: number;
  period: string;
  weeklyCapacityHours: number;
  monthlyCapacityHours: number;
}

export interface BenchRecord {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  benchStartDate: string;
  benchDurationDays: number;
  benchReason: string;
  availableDate: string;
  suggestedAllocation: string;
  status: BenchRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BenchRecordInput {
  employeeId: number;
  benchStartDate: string;
  benchReason: string;
  availableDate: string;
  suggestedAllocation?: string;
}

export type ReportGroupBy = "employee" | "department" | "team";
export type ReportPeriodType = "weekly" | "monthly";

export interface UtilizationReportRow {
  id: number;
  groupBy: ReportGroupBy;
  groupLabel: string;
  departmentName: string;
  period: string;
  periodType: ReportPeriodType;
  totalCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  benchCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface EmployeeListParams {
  search?: string;
  departmentId?: number | "";
  employmentStatus?: EmploymentStatus | "";
  onBench?: boolean | "";
  page?: number;
  limit?: number;
}

export interface EmployeeListResult {
  items: Employee[];
  pagination: Pagination;
}

export interface AllocationListParams {
  search?: string;
  projectId?: number | "";
  status?: AllocationStatus | "";
  page?: number;
  limit?: number;
}

export interface AllocationListResult {
  items: Allocation[];
  pagination: Pagination;
}

export interface CapacityListParams {
  search?: string;
  period?: string;
  page?: number;
  limit?: number;
}

export interface CapacityListResult {
  items: CapacityPlan[];
  pagination: Pagination;
}

export interface BenchListParams {
  search?: string;
  status?: BenchRecordStatus | "";
  departmentId?: number | "";
  page?: number;
  limit?: number;
}

export interface BenchListResult {
  items: BenchRecord[];
  pagination: Pagination;
}

export interface ReportListParams {
  groupBy: ReportGroupBy;
  periodType: ReportPeriodType;
  departmentId?: number | "";
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReportListResult {
  items: UtilizationReportRow[];
  pagination: Pagination;
}

// Matches the contract's exact response envelope ("STANDARD API RESPONSE"
// section) — {success, message, data} on success, {success, message,
// errors} on failure.
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
