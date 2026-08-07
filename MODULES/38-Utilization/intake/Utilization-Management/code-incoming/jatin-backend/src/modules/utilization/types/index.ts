/**
 * Domain types for the Utilization Management module.
 *
 * NOTE:
 * - Repository layer, database schema and ORM/query typings are NOT owned by
 *   this module (owned by the repository/database owner). These interfaces
 *   describe the shapes controllers/services expect back from the repository
 *   layer and are safe to import from repository implementations once they
 *   exist.
 */

export interface AuthenticatedUser {
  id: string;
  org_id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ---------------------------------- Employee --------------------------------- */

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface Employee {
  id: string;
  org_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  skills: string[];
  status: EmployeeStatus;
  weekly_capacity_hours: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  employee_code: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  skills?: string[];
  weekly_capacity_hours: number;
}

export interface UpdateEmployeeInput {
  full_name?: string;
  designation?: string;
  department?: string;
  skills?: string[];
  status?: EmployeeStatus;
  weekly_capacity_hours?: number;
}

/* --------------------------------- Allocation --------------------------------- */

export type AllocationStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Allocation {
  id: string;
  org_id: string;
  employee_id: string;
  project_id: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  status: AllocationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateAllocationInput {
  employee_id: string;
  project_id: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
}

export interface UpdateAllocationInput {
  allocation_percentage?: number;
  start_date?: string;
  end_date?: string;
  status?: AllocationStatus;
}

/* ---------------------------------- Capacity ---------------------------------- */

export interface CapacityPlan {
  id: string;
  org_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  available_hours: number;
  allocated_hours: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCapacityInput {
  employee_id: string;
  period_start: string;
  period_end: string;
  available_hours: number;
}

export interface UpdateCapacityInput {
  available_hours?: number;
  allocated_hours?: number;
}

/* --------------------------------- Utilization -------------------------------- */

export interface UtilizationRecord {
  id: string;
  org_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  utilization_percentage: number;
  billable_hours: number;
  non_billable_hours: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUtilizationInput {
  employee_id: string;
  period_start: string;
  period_end: string;
  billable_hours: number;
  non_billable_hours: number;
}

export interface UpdateUtilizationInput {
  billable_hours?: number;
  non_billable_hours?: number;
}

/* ----------------------------------- Bench ------------------------------------ */

export interface BenchRecord {
  id: string;
  org_id: string;
  employee_id: string;
  bench_start_date: string;
  bench_end_date: string | null;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface AssignBenchInput {
  employee_id: string;
  bench_start_date: string;
  reason: string;
}

export interface UnassignBenchInput {
  bench_end_date: string;
}

/* ---------------------------------- Analytics ---------------------------------- */

export interface AnalyticsFilter {
  period_start: string;
  period_end: string;
  department?: string;
}

/* ----------------------------------- Report ------------------------------------ */

export type ReportType =
  | 'utilization_summary'
  | 'bench_summary'
  | 'allocation_summary'
  | 'capacity_summary';

export interface ReportRecord {
  id: string;
  org_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  generated_by: string;
  status: 'pending' | 'ready' | 'failed';
  created_at: string;
}

export interface GenerateReportInput {
  report_type: ReportType;
  period_start: string;
  period_end: string;
}

/* ----------------------------------- Settings ----------------------------------- */

export interface ModuleSettings {
  org_id: string;
  default_capacity_hours: number;
  utilization_target_percentage: number;
  bench_alert_threshold_days: number;
  updated_at: string;
}

export interface UpdateSettingsInput {
  default_capacity_hours?: number;
  utilization_target_percentage?: number;
  bench_alert_threshold_days?: number;
}
