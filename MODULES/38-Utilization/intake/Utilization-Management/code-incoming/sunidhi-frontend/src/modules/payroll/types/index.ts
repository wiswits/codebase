/**
 * Module 9 — HR Payroll Management
 * Types owned by Sunidhi's scope: Payroll Runs, Deductions, Arrears, Payslips.
 *
 * NOTE: SalaryStructure type is intentionally NOT redefined here — that
 * belongs to Ankit's scope (Salary Structures). We only reference its id.
 *
 * Per Module Contract §8 and §48: no financial calculation logic lives on
 * the frontend. `finalAmount`, `grossTotal`, `arrearsTotal`, `deductionsTotal`
 * etc. are always values RETURNED by the backend — never computed here.
 */

export type APIResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type APIError = {
  success: false;
  message: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export type APIResult<T> = APIResponse<T> | APIError;

/** Proposed Payroll Run states — Module Contract §15. */
export type PayrollRunStatus =
  | 'draft'
  | 'prepared'
  | 'processing'
  | 'completed'
  | 'failed';

export interface PayrollRun {
  id: number;
  organizationId: number;
  payrollPeriod: string; // e.g. "2026-07"
  runReference: string;
  status: PayrollRunStatus;
  employeeCount: number;
  grossTotal: string; // DECIMAL as string from API — never parse to float for math
  arrearsTotal: string;
  deductionsTotal: string;
  finalTotal: string;
  preparedBy?: string | null;
  executedBy?: string | null;
  preparedAt?: string | null;
  executedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunEmployeeRecord {
  employeeId: number;
  employeeName: string;
  salaryStructureId: number;
  grossSalary: string;
  arrearsTotal: string;
  deductionsTotal: string;
  finalAmount: string;
  status: PayrollRunStatus;
}

export interface CreatePayrollRunInput {
  payrollPeriod: string;
}

export type AdjustmentStatus = 'draft' | 'approved' | 'cancelled';

export interface SalaryDeduction {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  deductionTitle: string;
  amount: string;
  reason?: string | null;
  notes?: string | null;
  status: AdjustmentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeductionInput {
  employeeId: number;
  deductionTitle: string;
  amount: string;
  reason?: string;
  notes?: string;
}

export interface UpdateDeductionInput {
  deductionTitle?: string;
  amount?: string;
  reason?: string;
  notes?: string;
  status?: AdjustmentStatus;
}

export interface SalaryArrear {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  arrearTitle: string;
  amount: string;
  reason?: string | null;
  notes?: string | null;
  status: AdjustmentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArrearInput {
  employeeId: number;
  arrearTitle: string;
  amount: string;
  reason?: string;
  notes?: string;
}

export interface UpdateArrearInput {
  arrearTitle?: string;
  amount?: string;
  reason?: string;
  notes?: string;
  status?: AdjustmentStatus;
}

export type PayslipStatus = 'draft' | 'completed';

export interface Payslip {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName: string;
  salaryStructureId: number;
  payrollPeriod: string;
  grossSalary: string;
  arrearsTotal: string;
  deductionsTotal: string;
  finalAmount: string;
  status: PayslipStatus;
  generatedAt: string | null;
  pdfReference: string | null;
}

export interface PayslipListFilters {
  search?: string;
  status?: PayslipStatus;
  period?: string;
  page?: number;
  pageSize?: number;
}

export interface PayrollRunListFilters {
  search?: string;
  status?: PayrollRunStatus;
  period?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
