/**
 * Analytics API Service
 */

import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';
import { AnalyticsData } from '../types/analytics.types';

// Mock data for development
const USE_MOCK = true;

const mockAnalyticsData: AnalyticsData = {
  trends: [
    { period: 'Jan', utilization: 72, capacity: 1000, allocated: 720 },
    { period: 'Feb', utilization: 74, capacity: 1000, allocated: 740 },
    { period: 'Mar', utilization: 78, capacity: 1000, allocated: 780 },
    { period: 'Apr', utilization: 75, capacity: 1000, allocated: 750 },
    { period: 'May', utilization: 76, capacity: 1000, allocated: 760 },
    { period: 'Jun', utilization: 75.4, capacity: 1000, allocated: 754 },
  ],
  departments: [
    { departmentId: 1, departmentName: 'Engineering', utilizationPercentage: 82.2, employeeCount: 45 },
    { departmentId: 2, departmentName: 'Design', utilizationPercentage: 73.2, employeeCount: 28 },
    { departmentId: 3, departmentName: 'Marketing', utilizationPercentage: 77.3, employeeCount: 22 },
  ],
  teams: [
    { teamId: 1, teamName: 'Frontend', utilizationPercentage: 85, memberCount: 15 },
    { teamId: 2, teamName: 'Backend', utilizationPercentage: 80, memberCount: 20 },
    { teamId: 3, teamName: 'DevOps', utilizationPercentage: 90, memberCount: 10 },
  ],
  benchmarks: [
    { metric: 'Overall Utilization', value: 75.4, target: 80, status: 'below' },
    { metric: 'Bench Percentage', value: 9, target: 10, status: 'meeting' },
    { metric: 'Project Allocation', value: 85, target: 90, status: 'below' },
  ],
  forecasts: [
    { period: 'Jul', predictedUtilization: 76, confidence: 0.85 },
    { period: 'Aug', predictedUtilization: 77, confidence: 0.80 },
    { period: 'Sep', predictedUtilization: 78, confidence: 0.75 },
  ],
  kpis: {
    overallUtilization: 75.4,
    benchPercentage: 9,
    overUtilizedCount: 12,
    underUtilizedCount: 18,
  },
};

const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const analyticsApi = {
  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        message: 'Analytics data retrieved successfully',
        data: mockAnalyticsData,
      };
    }
    return ApiClient.get<AnalyticsData>('/analytics');
  },

  async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsData['kpis']>> {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        message: 'Analytics overview retrieved',
        data: mockAnalyticsData.kpis,
      };
    }
    return ApiClient.get<AnalyticsData['kpis']>('/analytics/overview');
  },

  async getAnalyticsTrends(): Promise<ApiResponse<AnalyticsData['trends']>> {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        message: 'Trends data retrieved',
        data: mockAnalyticsData.trends,
      };
    }
    return ApiClient.get<AnalyticsData['trends']>('/analytics/trends');
  },
};