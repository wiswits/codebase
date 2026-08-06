/**
 * HR Payroll Module Type Definitions
 */

export interface SalaryStructure {
  id: number;
  organizationId: number;
  employeeId: number;
  employeeName?: string;
  structureName: string;
  grossSalary: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'draft' | 'active' | 'inactive';
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: number;
  organizationId: number;
  payrollPeriod: string;
  runReference: string;
  status: 'draft' | 'prepared' | 'processing' | 'completed' | 'failed';
  employeeCount: number;
  grossTotal: number;
  arrearsTotal: number;
  deductionsTotal: number;
  finalTotal: number;
  preparedBy?: number;
  executedBy?: number;
  preparedAt?: string;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deduction {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  deductionTitle: string;
  amount: number;
  reason: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Arrear {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  arrearTitle: string;
  amount: number;
  reason: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: number;
  organizationId: number;
  payrollRunId: number;
  employeeId: number;
  employeeName?: string;
  salaryStructureId: number;
  grossSalary: number;
  arrearsTotal: number;
  deductionsTotal: number;
  finalAmount: number;
  status: 'generated' | 'viewed' | 'downloaded';
  generatedAt: string;
  pdfReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollDashboardStats {
  totalEmployees: number;
  currentPeriod: string;
  runStatus: string;
  grossTotal: number;
  deductionsTotal: number;
  arrearsTotal: number;
  payslipsGenerated: number;
  recentRuns: PayrollRun[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}