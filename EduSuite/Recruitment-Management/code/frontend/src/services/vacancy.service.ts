import apiClient from './api-client';
import { Vacancy, VacancyFilters, ApiResponse, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export const vacancyService = {
  async getAll(filters?: VacancyFilters): Promise<PaginatedResponse<Vacancy>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Vacancy>>>(
      '/recruitment/vacancies',
      { params: filters }
    );
    return response.data.data;
  },

  async getById(id: number): Promise<Vacancy> {
    const response = await apiClient.get<ApiResponse<Vacancy>>(
      `/recruitment/vacancies/${id}`
    );
    return response.data.data;
  },

  async create(data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await apiClient.post<ApiResponse<Vacancy>>(
      '/recruitment/vacancies',
      data
    );
    toast.success('Vacancy created successfully');
    return response.data.data;
  },

  async update(id: number, data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await apiClient.put<ApiResponse<Vacancy>>(
      `/recruitment/vacancies/${id}`,
      data
    );
    toast.success('Vacancy updated successfully');
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/recruitment/vacancies/${id}`);
    toast.success('Vacancy deleted successfully');
  },

  async changeStatus(id: number, status: string): Promise<Vacancy> {
    const response = await apiClient.patch<ApiResponse<Vacancy>>(
      `/recruitment/vacancies/${id}/status`,
      { status }
    );
    toast.success('Status updated successfully');
    return response.data.data;
  },

  async getRecent(limit: number = 5): Promise<Vacancy[]> {
    const response = await apiClient.get<ApiResponse<Vacancy[]>>(
      '/recruitment/vacancies/recent',
      { params: { limit } }
    );
    return response.data.data;
  },

  async validateCode(code: string, excludeId?: number): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ isUnique: boolean }>>(
      '/recruitment/vacancies/validate-code',
      { params: { code, excludeId } }
    );
    return response.data.data.isUnique;
  },
};