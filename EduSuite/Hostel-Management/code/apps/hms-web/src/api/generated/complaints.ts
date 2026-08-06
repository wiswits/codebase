import { apiClient } from '../client';
import type { Complaint, CreateComplaint, ComplaintStatus } from '@shared/schemas/complaint';

export const complaintApi = {
  create: async (data: CreateComplaint) => {
    const response = await apiClient.post<Complaint>('/complaints', data);
    return response.data;
  },

  getUploadUrl: async (data: { filename: string; contentType: string }) => {
    const response = await apiClient.post<{ uploadUrl: string; key: string }>('/complaints/upload-url', data);
    return response.data;
  },

  getAll: async (params?: { status?: ComplaintStatus; assignedToMe?: boolean }) => {
    const response = await apiClient.get<Complaint[]>('/complaints', { params });
    return response.data;
  },

  assign: async (id: string, data: { userId: string }) => {
    const response = await apiClient.post<Complaint>(`/complaints/${id}/assign`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: { status: ComplaintStatus }) => {
    const response = await apiClient.post<Complaint>(`/complaints/${id}/status`, data);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.post<{ success: true }>(`/complaints/${id}/confirm`);
    return response.data;
  },
};