// src/modules/payroll/services/payrollApi.ts
//
// Shared frontend/API integration boundary (Standards Section 4.2).
// Only implements the endpoints Sunidhi's scope needs (Section 28):
// payroll runs, run execution, deductions, arrears, payslips.
// Salary Structures and the Dashboard are Ankit's scope and are not
// called from this file.
//
// CRITICAL: this file performs NO payroll calculations (Section 8).
// Run totals (grossTotal/arrearsTotal/deductionsTotal/finalTotal) are
// never summed here — they are only ever read from a stored/mock
// record or from what the (future) backend returns. Adding a
// deduction/arrear in mock mode does not recompute the parent run's
// totals; a real backend recalculates and returns fresh totals on the
// next GET, which this mock intentionally mirrors by leaving totals
// untouched until the run itself is re-synced from source data.

import {
  MOCK_ARREARS,
  MOCK_DEDUCTIONS,
  MOCK_EMPLOYEES,
  MOCK_PAYROLL_RUNS,
  MOCK_PAYSLIPS,
  getMockRunEmployees,
} from "../mocks/payroll.mock";
import { PAYROLL_API_BASE } from "../constants/payroll.constants";
import {
  ApiEnvelope,
  Arrear,
  ArrearInput,
  Deduction,
  DeductionInput,
  EmployeeSummary,
  Payslip,
  PayslipListParams,
  PayslipListResult,
  PayrollRun,
  PayrollRunListParams,
  PayrollRunListResult,
  RunEmployeeRow,
} from "../types/payroll.types";

const USE_MOCK = true;

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function request<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const { params, ...options } = init || {};
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  const res = await fetch(`${PAYROLL_API_BASE}${path}${query}`, options);
  const body: ApiEnvelope<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new Error(body?.message || "Something went wrong.");
  }
  return body.data;
}

// ---- in-memory mock store (session-scoped) ----
let mockRuns = [...MOCK_PAYROLL_RUNS];
let mockDeductions = [...MOCK_DEDUCTIONS];
let mockArrears = [...MOCK_ARREARS];
const mockPayslips = [...MOCK_PAYSLIPS];

function filterMockRuns(params: PayrollRunListParams): PayrollRunListResult {
  let result = [...mockRuns];
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((r) => r.runReference.toLowerCase().includes(q));
  }
  if (params.status) result = result.filter((r) => r.status === params.status);
  if (params.period) result = result.filter((r) => r.payrollPeriod === params.period);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

function filterMockPayslips(params: PayslipListParams): PayslipListResult {
  let result = [...mockPayslips];
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((p) => p.employeeName.toLowerCase().includes(q));
  }
  if (params.status) result = result.filter((p) => p.status === params.status);
  if (params.runId) result = result.filter((p) => p.payrollRunId === params.runId);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

export const payrollApi = {
  // Read-only employee reference list, used only for adjustment-form
  // dropdowns. Full employee records belong to a different module.
  async getEmployeeOptions(): Promise<EmployeeSummary[]> {
    if (USE_MOCK) return mockDelay(MOCK_EMPLOYEES);
    return request<EmployeeSummary[]>("/employees?fields=summary");
  },

  // ---- Payroll Runs ----
  async getRuns(params: PayrollRunListParams): Promise<PayrollRunListResult> {
    if (USE_MOCK) return mockDelay(filterMockRuns(params));
    return request<PayrollRunListResult>("/runs", {
      params: params as Record<string, string | number>,
    });
  },

  async getRun(runId: number): Promise<PayrollRun> {
    if (USE_MOCK) {
      const found = mockRuns.find((r) => r.id === runId);
      if (!found) throw new Error("Payroll run not found.");
      return mockDelay(found);
    }
    return request<PayrollRun>(`/runs/${runId}`);
  },

  // "Prepare payroll run" — creates the run shell for a period. The
  // backend is responsible for populating gross/arrears/deductions
  // totals; this mock starts a run at zero/gross-only totals.
  async createRun(payrollPeriod: string): Promise<PayrollRun> {
    if (USE_MOCK) {
      const created: PayrollRun = {
        id: Math.max(0, ...mockRuns.map((r) => r.id)) + 1,
        organizationId: 12,
        payrollPeriod,
        runReference: `RUN-${payrollPeriod}-${String(mockRuns.length + 1).padStart(3, "0")}`,
        status: "draft",
        employeeCount: MOCK_EMPLOYEES.length,
        grossTotal: "0.00",
        arrearsTotal: "0.00",
        deductionsTotal: "0.00",
        finalTotal: "0.00",
        preparedBy: null,
        executedBy: null,
        preparedAt: null,
        executedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRuns = [created, ...mockRuns];
      return mockDelay(created, 400);
    }
    return request<PayrollRun>("/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payrollPeriod }),
    });
  },

  // Allowed run-state updates only (e.g. draft -> prepared marker).
  // Never sets financial totals from the frontend.
  async updateRun(
    runId: number,
    input: Partial<Pick<PayrollRun, "status" | "preparedBy">>
  ): Promise<PayrollRun> {
    if (USE_MOCK) {
      const idx = mockRuns.findIndex((r) => r.id === runId);
      if (idx === -1) throw new Error("Payroll run not found.");
      const updated = {
        ...mockRuns[idx],
        ...input,
        preparedAt: input.status === "prepared" ? new Date().toISOString() : mockRuns[idx].preparedAt,
        updatedAt: new Date().toISOString(),
      };
      mockRuns = [...mockRuns.slice(0, idx), updated, ...mockRuns.slice(idx + 1)];
      return mockDelay(updated, 400);
    }
    return request<PayrollRun>(`/runs/${runId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // POST /runs/:runId/execute — highly restricted (Section 28, 43:
  // hr.payroll.run). The frontend only calls this endpoint; it never
  // computes the payroll result. Enforcement happens on the backend —
  // in mock mode this just reflects a successful backend response.
  async executeRun(runId: number): Promise<PayrollRun> {
    if (USE_MOCK) {
      const idx = mockRuns.findIndex((r) => r.id === runId);
      if (idx === -1) throw new Error("Payroll run not found.");
      const updated = {
        ...mockRuns[idx],
        status: "completed" as const,
        executedBy: "Current User",
        executedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRuns = [...mockRuns.slice(0, idx), updated, ...mockRuns.slice(idx + 1)];
      return mockDelay(updated, 600);
    }
    return request<PayrollRun>(`/runs/${runId}/execute`, { method: "POST" });
  },

  async getRunEmployees(runId: number): Promise<RunEmployeeRow[]> {
    if (USE_MOCK) return mockDelay(getMockRunEmployees(runId));
    return request<RunEmployeeRow[]>(`/runs/${runId}/employees`);
  },

  // ---- Deductions ----
  async getDeductions(runId: number): Promise<Deduction[]> {
    if (USE_MOCK) {
      return mockDelay(mockDeductions.filter((d) => d.payrollRunId === runId));
    }
    return request<Deduction[]>(`/runs/${runId}/deductions`);
  },

  async addDeduction(runId: number, input: DeductionInput): Promise<Deduction> {
    if (USE_MOCK) {
      const employee = MOCK_EMPLOYEES.find((e) => e.id === input.employeeId);
      const created: Deduction = {
        id: Math.max(0, ...mockDeductions.map((d) => d.id)) + 1,
        organizationId: 12,
        payrollRunId: runId,
        employeeId: input.employeeId,
        employeeName: employee?.name || "",
        deductionTitle: input.deductionTitle,
        amount: input.amount,
        reason: input.reason,
        notes: input.notes || "",
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDeductions = [created, ...mockDeductions];
      return mockDelay(created, 400);
    }
    return request<Deduction>(`/runs/${runId}/deductions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async updateDeduction(
    deductionId: number,
    input: Partial<DeductionInput>
  ): Promise<Deduction> {
    if (USE_MOCK) {
      const idx = mockDeductions.findIndex((d) => d.id === deductionId);
      if (idx === -1) throw new Error("Deduction not found.");
      const updated = { ...mockDeductions[idx], ...input, updatedAt: new Date().toISOString() };
      mockDeductions = [
        ...mockDeductions.slice(0, idx),
        updated,
        ...mockDeductions.slice(idx + 1),
      ];
      return mockDelay(updated, 400);
    }
    return request<Deduction>(`/deductions/${deductionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // ---- Arrears ----
  async getArrears(runId: number): Promise<Arrear[]> {
    if (USE_MOCK) {
      return mockDelay(mockArrears.filter((a) => a.payrollRunId === runId));
    }
    return request<Arrear[]>(`/runs/${runId}/arrears`);
  },

  async addArrear(runId: number, input: ArrearInput): Promise<Arrear> {
    if (USE_MOCK) {
      const employee = MOCK_EMPLOYEES.find((e) => e.id === input.employeeId);
      const created: Arrear = {
        id: Math.max(0, ...mockArrears.map((a) => a.id)) + 1,
        organizationId: 12,
        payrollRunId: runId,
        employeeId: input.employeeId,
        employeeName: employee?.name || "",
        arrearTitle: input.arrearTitle,
        amount: input.amount,
        reason: input.reason,
        notes: input.notes || "",
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockArrears = [created, ...mockArrears];
      return mockDelay(created, 400);
    }
    return request<Arrear>(`/runs/${runId}/arrears`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async updateArrear(arrearId: number, input: Partial<ArrearInput>): Promise<Arrear> {
    if (USE_MOCK) {
      const idx = mockArrears.findIndex((a) => a.id === arrearId);
      if (idx === -1) throw new Error("Arrear not found.");
      const updated = { ...mockArrears[idx], ...input, updatedAt: new Date().toISOString() };
      mockArrears = [...mockArrears.slice(0, idx), updated, ...mockArrears.slice(idx + 1)];
      return mockDelay(updated, 400);
    }
    return request<Arrear>(`/arrears/${arrearId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // ---- Payslips ----
  async getPayslips(params: PayslipListParams): Promise<PayslipListResult> {
    if (USE_MOCK) return mockDelay(filterMockPayslips(params));
    return request<PayslipListResult>("/payslips", {
      params: params as Record<string, string | number>,
    });
  },

  async getPayslip(payslipId: number): Promise<Payslip> {
    if (USE_MOCK) {
      const found = mockPayslips.find((p) => p.id === payslipId);
      if (!found) throw new Error("Payslip not found.");
      return mockDelay(found);
    }
    return request<Payslip>(`/payslips/${payslipId}`);
  },

  // Returns a reference only — the actual PDF bytes/download is served
  // directly by the backend endpoint, not generated here.
  getPayslipPdfUrl(payslipId: number): string {
    return `${PAYROLL_API_BASE}/payslips/${payslipId}/pdf`;
  },
};
