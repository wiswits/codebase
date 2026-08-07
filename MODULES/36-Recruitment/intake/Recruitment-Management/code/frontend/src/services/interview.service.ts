import apiClient from './api-client';
import { Interview, InterviewFilters, ApiResponse, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export const interviewService = {
  async getAll(filters?: InterviewFilters): Promise<PaginatedResponse<Interview>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Interview>>>(
      '/recruitment/interviews',
      { params: filters }
    );
    return response.data.data;
  },

  async getById(id: number): Promise<Interview> {
    const response = await apiClient.get<ApiResponse<Interview>>(
      `/recruitment/interviews/${id}`
    );
    return response.data.data;
  },

  async create(data: Partial<Interview>): Promise<Interview> {
    const response = await apiClient.post<ApiResponse<Interview>>(
      '/recruitment/interviews',
      data
    );
    toast.success('Interview scheduled successfully');
    return response.data.data;
  },

  async update(id: number, data: Partial<Interview>): Promise<Interview> {
    const response = await apiClient.put<ApiResponse<Interview>>(
      `/recruitment/interviews/${id}`,
      data
    );
    toast.success('Interview updated successfully');
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/recruitment/interviews/${id}`);
    toast.success('Interview cancelled successfully');
  },

  async updateStatus(
    id: number,
    status: string,
    feedback?: string,
    rating?: number,
    recommendation?: string
  ): Promise<Interview> {
    const response = await apiClient.patch<ApiResponse<Interview>>(
      `/recruitment/interviews/${id}/status`,
      { status, feedback, rating, recommendation }
    );
    toast.success('Interview status updated');
    return response.data.data;
  },

  async getUpcoming(limit: number = 10): Promise<Interview[]> {
    const response = await apiClient.get<ApiResponse<Interview[]>>(
      '/recruitment/interviews/upcoming',
      { params: { limit } }
    );
    return response.data.data;
  },

  async getByApplicant(applicantId: number): Promise<Interview[]> {
    const response = await apiClient.get<ApiResponse<Interview[]>>(
      `/recruitment/interviews/applicant/${applicantId}`
    );
    return response.data.data;
  },

  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/recruitment/interviews/stats'
    );
    return response.data.data;
  },
};