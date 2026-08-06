/**
 * Dashboard API Service
 */

import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';
import { DashboardData } from '../types/dashboard.types';

// Mock data for development
const USE_MOCK = true;

const mockDashboardData: DashboardData = {
  summary: {
    totalEmployees: 156,
    activeEmployees: 142,
    availableCapacity: 520,
    allocatedCapacity: 980,
    utilizationPercentage: 75.4,
    benchEmployees: 14,
    overUtilized: 12,
    underUtilized: 18,
    activeProjects: 8,
  },
  departments: [
    { departmentId: 1, departmentName: 'Engineering', employeeCount: 45, totalCapacity: 1800, allocatedCapacity: 1480, utilizationPercentage: 82.2 },
    { departmentId: 2, departmentName: 'Design', employeeCount: 28, totalCapacity: 1120, allocatedCapacity: 820, utilizationPercentage: 73.2 },
    { departmentId: 3, departmentName: 'Marketing', employeeCount: 22, totalCapacity: 880, allocatedCapacity: 680, utilizationPercentage: 77.3 },
  ],
  recentActivities: [
    { id: 1, type: 'allocation', message: 'Employee assigned to Project A', timestamp: new Date().toISOString(), userId: 1 },
    { id: 2, type: 'bench', message: 'Employee added to bench', timestamp: new Date().toISOString(), userId: 1 },
  ],
  topUtilized: [],
  underUtilized: [],
  activeProjects: [],
};

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardApi = {
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: mockDashboardData,
      };
    }
    return ApiClient.get<DashboardData>('/dashboard');
  },

  async getDashboardSummary(): Promise<ApiResponse<DashboardData['summary']>> {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        message: 'Dashboard summary retrieved',
        data: mockDashboardData.summary,
      };
    }
    return ApiClient.get<DashboardData['summary']>('/dashboard/summary');
  },
};