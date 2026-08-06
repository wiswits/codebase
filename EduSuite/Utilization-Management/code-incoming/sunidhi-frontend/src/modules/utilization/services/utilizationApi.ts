// src/modules/utilization/services/utilizationApi.ts
//
// Shared frontend/API integration boundary (Engineering Standards
// Section 4.2). Only implements the endpoints Sunidhi's scope needs
// ("EMPLOYEE ENDPOINTS", "ALLOCATION ENDPOINTS", plus capacity/bench/
// report reads) — Project CRUD and Dashboard/Analytics are Ankit's
// scope and are not called from this file.
//
// Response envelope matches the contract's "STANDARD API RESPONSE"
// section exactly: {success, message, data} / {success, message, errors}.
// Mock-first: USE_MOCK = true today, matching "BUILD FROM ZERO" policy —
// nothing here is copied from a previous module's implementation.

import {
  MOCK_ALLOCATIONS,
  MOCK_BENCH_RECORDS,
  MOCK_CAPACITY_PLANS,
  MOCK_DEPARTMENTS,
  MOCK_EMPLOYEES,
  MOCK_PROJECTS,
  MOCK_REPORT_ROWS,
} from "../mocks/utilization.mock";
import { UTILIZATION_API_BASE } from "../constants/utilization.constants";
import {
  Allocation,
  AllocationInput,
  AllocationListParams,
  AllocationListResult,
  ApiEnvelope,
  BenchRecord,
  BenchRecordInput,
  BenchListParams,
  BenchListResult,
  CapacityListParams,
  CapacityListResult,
  CapacityPlan,
  CapacityPlanInput,
  DepartmentSummary,
  Employee,
  EmployeeInput,
  EmployeeListParams,
  EmployeeListResult,
  ProjectSummary,
  ReportListParams,
  ReportListResult,
} from "../types/utilization.types";

const USE_MOCK = true;

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function request<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | boolean | undefined> }
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

  const res = await fetch(`${UTILIZATION_API_BASE}${path}${query}`, options);
  const body: ApiEnvelope<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new Error(body?.message || "Something went wrong.");
  }

  return body.data;
}

// ---- in-memory mock store (so edits persist during a session) ----
let mockEmployees = [...MOCK_EMPLOYEES];
let mockAllocations = [...MOCK_ALLOCATIONS];
let mockCapacityPlans = [...MOCK_CAPACITY_PLANS];
let mockBenchRecords = [...MOCK_BENCH_RECORDS];

function filterMockEmployees(params: EmployeeListParams): EmployeeListResult {
  let result = [...mockEmployees];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q)
    );
  }
  if (params.departmentId) result = result.filter((e) => e.departmentId === params.departmentId);
  if (params.employmentStatus)
    result = result.filter((e) => e.employmentStatus === params.employmentStatus);
  if (params.onBench !== undefined && params.onBench !== "")
    result = result.filter((e) => e.onBench === params.onBench);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

function filterMockAllocations(params: AllocationListParams): AllocationListResult {
  let result = [...mockAllocations];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(q) || a.projectName.toLowerCase().includes(q)
    );
  }
  if (params.projectId) result = result.filter((a) => a.projectId === params.projectId);
  if (params.status) result = result.filter((a) => a.status === params.status);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

function filterMockCapacity(params: CapacityListParams): CapacityListResult {
  let result = [...mockCapacityPlans];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((c) => c.employeeName.toLowerCase().includes(q));
  }
  if (params.period) result = result.filter((c) => c.period === params.period);

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

function filterMockBench(params: BenchListParams): BenchListResult {
  let result = [...mockBenchRecords];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((b) => b.employeeName.toLowerCase().includes(q));
  }
  if (params.status) result = result.filter((b) => b.status === params.status);
  if (params.departmentId) {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === params.departmentId)?.name;
    result = result.filter((b) => b.departmentName === dept);
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

function filterMockReports(params: ReportListParams): ReportListResult {
  let result = MOCK_REPORT_ROWS.filter(
    (r) => r.groupBy === params.groupBy && r.periodType === params.periodType
  );

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter((r) => r.groupLabel.toLowerCase().includes(q));
  }
  if (params.departmentId) {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === params.departmentId)?.name;
    result = result.filter((r) => r.departmentName === dept);
  }

  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = result.length;
  const start = (page - 1) * limit;

  return { items: result.slice(start, start + limit), pagination: { page, limit, total } };
}

export const utilizationApi = {
  // Read-only reference lists, used only for dropdowns/filters in
  // Sunidhi's forms. Full Department and Project CRUD are out of scope.
  async getDepartmentOptions(): Promise<DepartmentSummary[]> {
    if (USE_MOCK) return mockDelay(MOCK_DEPARTMENTS);
    return request<DepartmentSummary[]>("/departments?fields=summary");
  },

  async getProjectOptions(): Promise<ProjectSummary[]> {
    if (USE_MOCK) return mockDelay(MOCK_PROJECTS);
    return request<ProjectSummary[]>("/projects?fields=summary");
  },

  // ---- Employees ----
  async getEmployees(params: EmployeeListParams): Promise<EmployeeListResult> {
    if (USE_MOCK) return mockDelay(filterMockEmployees(params));
    return request<EmployeeListResult>("/employees", {
      params: params as Record<string, string | number | boolean>,
    });
  },

  async getEmployee(employeeId: number): Promise<Employee> {
    if (USE_MOCK) {
      const found = mockEmployees.find((e) => e.id === employeeId);
      if (!found) throw new Error("Employee not found.");
      return mockDelay(found);
    }
    return request<Employee>(`/employees/${employeeId}`);
  },

  async createEmployee(input: EmployeeInput): Promise<Employee> {
    if (USE_MOCK) {
      const department = MOCK_DEPARTMENTS.find((d) => d.id === input.departmentId);
      const created: Employee = {
        id: Math.max(0, ...mockEmployees.map((e) => e.id)) + 1,
        organizationId: 12,
        employeeCode: input.employeeCode,
        employeeName: input.employeeName,
        departmentId: input.departmentId,
        departmentName: department?.name || "",
        designation: input.designation,
        employmentStatus: input.employmentStatus,
        weeklyCapacityHours: input.weeklyCapacityHours,
        utilizationPercent: 0,
        allocationCount: 0,
        onBench: true,
        remarks: input.remarks || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockEmployees = [created, ...mockEmployees];
      return mockDelay(created, 400);
    }
    return request<Employee>("/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async updateEmployee(employeeId: number, input: Partial<EmployeeInput>): Promise<Employee> {
    if (USE_MOCK) {
      const idx = mockEmployees.findIndex((e) => e.id === employeeId);
      if (idx === -1) throw new Error("Employee not found.");
      const department = input.departmentId
        ? MOCK_DEPARTMENTS.find((d) => d.id === input.departmentId)
        : undefined;
      const updated = {
        ...mockEmployees[idx],
        ...input,
        departmentName: department?.name || mockEmployees[idx].departmentName,
        updatedAt: new Date().toISOString(),
      };
      mockEmployees = [
        ...mockEmployees.slice(0, idx),
        updated,
        ...mockEmployees.slice(idx + 1),
      ];
      return mockDelay(updated, 400);
    }
    return request<Employee>(`/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // ---- Allocations ----
  async getAllocations(params: AllocationListParams): Promise<AllocationListResult> {
    if (USE_MOCK) return mockDelay(filterMockAllocations(params));
    return request<AllocationListResult>("/allocations", {
      params: params as Record<string, string | number>,
    });
  },

  async getAllocation(allocationId: number): Promise<Allocation> {
    if (USE_MOCK) {
      const found = mockAllocations.find((a) => a.id === allocationId);
      if (!found) throw new Error("Allocation not found.");
      return mockDelay(found);
    }
    return request<Allocation>(`/allocations/${allocationId}`);
  },

  async getAllocationsForEmployee(employeeId: number): Promise<Allocation[]> {
    if (USE_MOCK) {
      return mockDelay(mockAllocations.filter((a) => a.employeeId === employeeId));
    }
    return request<Allocation[]>(`/allocations`, { params: { employeeId } });
  },

  // Business rules enforced here for the mock path (Contract "BUSINESS
  // RULES" section): archived employees cannot receive new allocations,
  // and allocation dates must not conflict with an existing active
  // allocation for the same employee. Backend remains authoritative.
  async createAllocation(input: AllocationInput): Promise<Allocation> {
    if (USE_MOCK) {
      const employee = mockEmployees.find((e) => e.id === input.employeeId);
      if (!employee) throw new Error("Employee not found.");
      if (employee.employmentStatus === "archived") {
        throw new Error("Archived employees cannot receive new allocations.");
      }

      const overlapping = mockAllocations.some(
        (a) =>
          a.employeeId === input.employeeId &&
          a.status === "active" &&
          input.startDate <= a.endDate &&
          input.endDate >= a.startDate
      );
      if (overlapping) {
        throw new Error("This employee already has an overlapping active allocation.");
      }

      const project = MOCK_PROJECTS.find((p) => p.id === input.projectId);
      const created: Allocation = {
        id: Math.max(0, ...mockAllocations.map((a) => a.id)) + 1,
        organizationId: 12,
        employeeId: input.employeeId,
        employeeName: employee.employeeName,
        employeeCode: employee.employeeCode,
        projectId: input.projectId,
        projectName: project?.name || "",
        allocationPercent: input.allocationPercent,
        workingHours: input.workingHours,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "active",
        remarks: input.remarks || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAllocations = [created, ...mockAllocations];

      const empIdx = mockEmployees.findIndex((e) => e.id === input.employeeId);
      mockEmployees[empIdx] = {
        ...mockEmployees[empIdx],
        allocationCount: mockEmployees[empIdx].allocationCount + 1,
        onBench: false,
      };

      return mockDelay(created, 400);
    }
    return request<Allocation>("/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async updateAllocation(
    allocationId: number,
    input: Partial<AllocationInput> & { status?: Allocation["status"] }
  ): Promise<Allocation> {
    if (USE_MOCK) {
      const idx = mockAllocations.findIndex((a) => a.id === allocationId);
      if (idx === -1) throw new Error("Allocation not found.");
      const updated = { ...mockAllocations[idx], ...input, updatedAt: new Date().toISOString() };
      mockAllocations = [
        ...mockAllocations.slice(0, idx),
        updated,
        ...mockAllocations.slice(idx + 1),
      ];
      return mockDelay(updated, 400);
    }
    return request<Allocation>(`/allocations/${allocationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async unassignAllocation(allocationId: number): Promise<Allocation> {
    return this.updateAllocation(allocationId, { status: "cancelled" });
  },

  // ---- Capacity ----
  async getCapacityPlans(params: CapacityListParams): Promise<CapacityListResult> {
    if (USE_MOCK) return mockDelay(filterMockCapacity(params));
    return request<CapacityListResult>("/capacity", {
      params: params as Record<string, string | number>,
    });
  },

  async saveCapacityPlan(input: CapacityPlanInput): Promise<CapacityPlan> {
    if (USE_MOCK) {
      const employee = mockEmployees.find((e) => e.id === input.employeeId);
      if (!employee) throw new Error("Employee not found.");

      const allocatedHours = mockAllocations
        .filter((a) => a.employeeId === input.employeeId && a.status === "active")
        .reduce((sum, a) => sum + a.workingHours, 0);

      const existingIdx = mockCapacityPlans.findIndex(
        (c) => c.employeeId === input.employeeId && c.period === input.period
      );
      const plan: CapacityPlan = {
        id: existingIdx >= 0 ? mockCapacityPlans[existingIdx].id : Math.max(0, ...mockCapacityPlans.map((c) => c.id)) + 1,
        organizationId: 12,
        employeeId: input.employeeId,
        employeeName: employee.employeeName,
        departmentName: employee.departmentName,
        period: input.period,
        weeklyCapacityHours: input.weeklyCapacityHours,
        monthlyCapacityHours: input.monthlyCapacityHours,
        allocatedHours,
        availableHours: input.monthlyCapacityHours,
        remainingHours: input.monthlyCapacityHours - allocatedHours,
        createdAt:
          existingIdx >= 0 ? mockCapacityPlans[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        mockCapacityPlans = [
          ...mockCapacityPlans.slice(0, existingIdx),
          plan,
          ...mockCapacityPlans.slice(existingIdx + 1),
        ];
      } else {
        mockCapacityPlans = [plan, ...mockCapacityPlans];
      }
      return mockDelay(plan, 400);
    }
    return request<CapacityPlan>("/capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  // ---- Bench ----
  async getBenchRecords(params: BenchListParams): Promise<BenchListResult> {
    if (USE_MOCK) return mockDelay(filterMockBench(params));
    return request<BenchListResult>("/bench", {
      params: params as Record<string, string | number>,
    });
  },

  async addBenchRecord(input: BenchRecordInput): Promise<BenchRecord> {
    if (USE_MOCK) {
      const employee = mockEmployees.find((e) => e.id === input.employeeId);
      if (!employee) throw new Error("Employee not found.");
      const created: BenchRecord = {
        id: Math.max(0, ...mockBenchRecords.map((b) => b.id)) + 1,
        organizationId: 12,
        employeeId: input.employeeId,
        employeeName: employee.employeeName,
        employeeCode: employee.employeeCode,
        departmentName: employee.departmentName,
        benchStartDate: input.benchStartDate,
        benchDurationDays: 0,
        benchReason: input.benchReason,
        availableDate: input.availableDate,
        suggestedAllocation: input.suggestedAllocation || "",
        status: "on_bench",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBenchRecords = [created, ...mockBenchRecords];

      const empIdx = mockEmployees.findIndex((e) => e.id === input.employeeId);
      mockEmployees[empIdx] = { ...mockEmployees[empIdx], onBench: true };

      return mockDelay(created, 400);
    }
    return request<BenchRecord>("/bench", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async closeBenchRecord(benchId: number): Promise<BenchRecord> {
    if (USE_MOCK) {
      const idx = mockBenchRecords.findIndex((b) => b.id === benchId);
      if (idx === -1) throw new Error("Bench record not found.");
      const updated: BenchRecord = {
        ...mockBenchRecords[idx],
        status: "closed",
        updatedAt: new Date().toISOString(),
      };
      mockBenchRecords = [
        ...mockBenchRecords.slice(0, idx),
        updated,
        ...mockBenchRecords.slice(idx + 1),
      ];
      return mockDelay(updated, 400);
    }
    return request<BenchRecord>(`/bench/${benchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
  },

  // ---- Reports ----
  async getReports(params: ReportListParams): Promise<ReportListResult> {
    if (USE_MOCK) return mockDelay(filterMockReports(params));
    return request<ReportListResult>("/reports", {
      params: params as Record<string, string | number>,
    });
  },
};
