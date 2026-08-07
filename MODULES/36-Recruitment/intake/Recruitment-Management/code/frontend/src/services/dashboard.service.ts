import apiClient from './api-client';
import { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

export interface DashboardStats {
  vacancies: {
    total: number;
    open: number;
    draft: number;
    onHold: number;
    closed: number;
    cancelled: number;
    totalOpenings: number;
  };
  applicants: {
    total: number;
    byStage: Record<string, number>;
  };
  interviews: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    rescheduled: number;
    noShow: number;
    avgRating: number | null;
  };
  offers: {
    total: number;
    draft: number;
    pending: number;
    sent: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    expired: number;
    avgSalary: number | null;
  };
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
        "/recruitment/dashboard"
    );

    return response.data.data;
} }