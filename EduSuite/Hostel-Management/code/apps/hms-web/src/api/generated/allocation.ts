import { apiClient } from '../client';
import type { Allocation, CreateAllocation, Transfer, VacateAllocation } from '@shared/schemas/allocation';

export const allocationApi = {
  create: async (data: CreateAllocation) => {
    const response = await apiClient.post<{
      allocation: Allocation;
      bed: Bed;
      rentPaise: number;
      apexLedgerId: string;
    }>('/allocations', data);
    return response.data;
  },

  getAll: async (params?: { hostelId?: string; active?: boolean }) => {
    const response = await apiClient.get<Allocation[]>('/allocations', { params });
    return response.data;
  },

  getByStudent: async (studentId: string) => {
    const response = await apiClient.get<{ allocation: Allocation; bed: Bed }>(`/students/${studentId}/residency`);
    return response.data;
  },

  vacate: async (id: string, data: VacateAllocation) => {
    const response = await apiClient.post<{ success: true; allocation: Allocation }>(`/allocations/${id}/vacate`, data);
    return response.data;
  },
};

export const transferApi = {
  create: async (data: Transfer) => {
    const response = await apiClient.post<{ transfer: Transfer; status: 'pending' }>('/transfers', data);
    return response.data;
  },

  getAll: async (params?: { status?: 'pending' | 'approved' | 'rejected' }) => {
    const response = await apiClient.get<Transfer[]>('/transfers', { params });
    return response.data;
  },

  approve: async (id: string, data?: { newBedId?: string }) => {
    const response = await apiClient.post<{ success: true; allocation: Allocation }>(`/transfers/${id}/approve`, data);
    return response.data;
  },

  reject: async (id: string, data: { reason: string }) => {
    const response = await apiClient.post<{ success: true }>(`/transfers/${id}/reject`, data);
    return response.data;
  },

  getHistory: async (studentId: string) => {
    const response = await apiClient.get<Transfer[]>(`/students/${studentId}/transfer-history`);
    return response.data;
  },
};