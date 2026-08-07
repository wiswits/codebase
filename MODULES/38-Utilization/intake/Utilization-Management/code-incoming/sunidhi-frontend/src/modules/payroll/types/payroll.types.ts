// src/modules/payroll/types/payroll.types.ts
//
// Canonical data model for Sunidhi's scope (Contract Section 37-40, 48).
// Financial fields are typed as strings (fixed-precision, e.g. "50000.00")
// per Section 46 — never `number`, and this file performs NO arithmetic
// on them. Every monetary total shown in the UI is a value the backend
// (or, during parallel development, the mock layer) already computed —
// the frontend only displays it (Section 8: "Frontend developers must
// NEVER implement payroll calculations").

export type Money = string;

export type PayrollRunStatus = "draft" | "prepared" | "processing" | "completed" | "failed";
export type PayslipStatus = "pending" | "generated";

export interface PayrollRun {
  id: number;
  organizationId: number;
  payrollPeriod: string; // e.g. "2026-07"
  runReference: string;
  status: PayrollRunStatus;
  employeeCount: number;
  grossTotal: Money;
  arrearsTotal: Money;
  deductionsTotal: Money;
  finalTotal: Money;
  preparedBy: string | null;
  executedBy: string | null;
  preparedAt: string | null;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// One row of the "Employee Payroll Table" inside a run's details
// (Section 14). Values are read-only, backend-sourced.
export interface RunEmployeeRow {
  employeeId: number;
  employeeName: string;
  salaryStructureId: number;
  grossSalary: Money;
  arrearsTotal: Money;
  deductionsTotal: Money;
  finalAmount: Money;
  payslipId: number | null;
}

export interface Deduction {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  deductionTitle: string;
  amount: Money;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeductionInput {
  employeeId: number;
  deductionTitle: string;
  amount: Money;
  reason: string;
  notes?: string;
}

export interface Arrear {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  arrearTitle: string;
  amount: Money;
  reason: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArrearInput {
  employeeId: number;
  arrearTitle: string;
  amount: Money;
  reason: string;
  notes?: string;
}

export interface Payslip {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  salaryStructureId: number;
  payrollPeriod: string;
  grossSalary: Money;
  arrearsTotal: Money;
  deductionsTotal: Money;
  finalAmount: Money;
  status: PayslipStatus;
  generatedAt: string | null;
  pdfReference: string | null;
  createdAt: string;
  updatedAt: string;
}

// Minimal employee reference for dropdowns — full employee records
// belong to a different module; this is a read-only lookup only.
export interface EmployeeSummary {
  id: number;
  name: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface PayrollRunListParams {
  search?: string;
  status?: PayrollRunStatus | "";
  period?: string;
  page?: number;
  limit?: number;
}

export interface PayrollRunListResult {
  items: PayrollRun[];
  pagination: Pagination;
}

export interface PayslipListParams {
  search?: string;
  status?: PayslipStatus | "";
  runId?: number | "";
  page?: number;
  limit?: number;
}

export interface PayslipListResult {
  items: Payslip[];
  pagination: Pagination;
}

// Matches the contract's exact response envelope (Section 29) —
// {success, message, data}.
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
