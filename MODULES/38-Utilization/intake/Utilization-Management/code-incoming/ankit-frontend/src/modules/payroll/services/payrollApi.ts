/**
 * Payroll API Service
 */

import {
  ApiResponse,
  PayrollDashboardStats,
  SalaryStructure,
  PayrollRun
} from '../types/payroll.types';
import { mockDashboardStats } from '../mocks/dashboard.mock';
import { mockSalaryStructures } from '../mocks/salaryStructures.mock';

const USE_MOCK = true;
const API_BASE = '/api/v1/hr/payroll';

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const payrollApi = {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<PayrollDashboardStats>> {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        message: 'Dashboard data retrieved',
        data: mockDashboardStats
      };
    }
    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch dashboard data',
        data: {} as PayrollDashboardStats,
        error: { code: 'FETCH_ERROR', message: 'Network error' }
      };
    }
  },

  // Salary Structures
  async getSalaryStructures(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ items: SalaryStructure[]; pagination: any }>> {
    if (USE_MOCK) {
      await delay(500);
      let items = [...mockSalaryStructures];
      if (params?.search) {
        const search = params.search.toLowerCase();
        items = items.filter(s =>
          s.employeeName?.toLowerCase().includes(search) ||
          s.structureName.toLowerCase().includes(search)
        );
      }
      if (params?.status) {
        items = items.filter(s => s.status === params.status);
      }
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        success: true,
        message: 'Salary structures retrieved',
        data: {
          items: items.slice(start, end),
          pagination: {
            page,
            limit,
            total: items.length,
            totalPages: Math.ceil(items.length / limit)
          }
        }
      };
    }
    try {
      const queryParams = new URLSearchParams(params as any);
      const response = await fetch(`${API_BASE}/salary-structures?${queryParams}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch salary structures',
        data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
        error: { code: 'FETCH_ERROR', message: 'Network error' }
      };
    }
  },

  async getSalaryStructure(id: number): Promise<ApiResponse<SalaryStructure>> {
    if (USE_MOCK) {
      await delay(400);
      const structure = mockSalaryStructures.find(s => s.id === id);
      if (!structure) {
        return {
          success: false,
          message: 'Salary structure not found',
          data: {} as SalaryStructure,
          error: { code: 'NOT_FOUND', message: 'Structure not found' }
        };
      }
      return {
        success: true,
        message: 'Salary structure retrieved',
        data: structure
      };
    }
    try {
      const response = await fetch(`${API_BASE}/salary-structures/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch salary structure',
        data: {} as SalaryStructure,
        error: { code: 'FETCH_ERROR', message: 'Network error' }
      };
    }
  },

  async createSalaryStructure(data: Partial<SalaryStructure>): Promise<ApiResponse<SalaryStructure>> {
    if (USE_MOCK) {
      await delay(800);
      const newStructure: SalaryStructure = {
        id: mockSalaryStructures.length + 1,
        organizationId: 1,
        employeeId: data.employeeId || 0,
        employeeName: data.employeeName || 'New Employee',
        structureName: data.structureName || 'New Structure',
        grossSalary: data.grossSalary || 0,
        effectiveFrom: data.effectiveFrom || new Date().toISOString(),
        status: 'draft',
        notes: data.notes || '',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return {
        success: true,
        message: 'Salary structure created successfully',
        data: newStructure
      };
    }
    try {
      const response = await fetch(`${API_BASE}/salary-structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create salary structure',
        data: {} as SalaryStructure,
        error: { code: 'SUBMIT_ERROR', message: 'Network error' }
      };
    }
  },

  async updateSalaryStructure(id: number, data: Partial<SalaryStructure>): Promise<ApiResponse<SalaryStructure>> {
    if (USE_MOCK) {
      await delay(600);
      const structure = mockSalaryStructures.find(s => s.id === id);
      if (!structure) {
        return {
          success: false,
          message: 'Salary structure not found',
          data: {} as SalaryStructure,
          error: { code: 'NOT_FOUND', message: 'Structure not found' }
        };
      }
      const updated = { ...structure, ...data, updatedAt: new Date().toISOString() };
      return {
        success: true,
        message: 'Salary structure updated successfully',
        data: updated
      };
    }
    try {
      const response = await fetch(`${API_BASE}/salary-structures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update salary structure',
        data: {} as SalaryStructure,
        error: { code: 'SUBMIT_ERROR', message: 'Network error' }
      };
    }
  }
};