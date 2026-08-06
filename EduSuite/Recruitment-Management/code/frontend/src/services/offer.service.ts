import apiClient from './api-client';
import { Offer, OfferFilters, ApiResponse, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export const offerService = {
  async getAll(filters?: OfferFilters): Promise<PaginatedResponse<Offer>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Offer>>>(
      '/recruitment/offers',
      { params: filters }
    );
    return response.data.data;
  },

  async getById(id: number): Promise<Offer> {
    const response = await apiClient.get<ApiResponse<Offer>>(
      `/recruitment/offers/${id}`
    );
    return response.data.data;
  },

  async create(data: Partial<Offer>): Promise<Offer> {
    const response = await apiClient.post<ApiResponse<Offer>>(
      '/recruitment/offers',
      data
    );
    toast.success('Offer created successfully');
    return response.data.data;
  },

  async update(id: number, data: Partial<Offer>): Promise<Offer> {
    const response = await apiClient.put<ApiResponse<Offer>>(
      `/recruitment/offers/${id}`,
      data
    );
    toast.success('Offer updated successfully');
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/recruitment/offers/${id}`);
    toast.success('Offer deleted successfully');
  },

  async updateStatus(id: number, status: string, acceptedOn?: string): Promise<Offer> {
    const response = await apiClient.patch<ApiResponse<Offer>>(
      `/recruitment/offers/${id}/status`,
      { status, accepted_on: acceptedOn }
    );
    toast.success(`Offer ${status.toLowerCase()}`);
    return response.data.data;
  },

  async getByApplicant(applicantId: number): Promise<Offer[]> {
    const response = await apiClient.get<ApiResponse<Offer[]>>(
      `/recruitment/offers/applicant/${applicantId}`
    );
    return response.data.data;
  },

  async getByStatus(status: string): Promise<Offer[]> {
    const response = await apiClient.get<ApiResponse<Offer[]>>(
      `/recruitment/offers/by-status/${status}`
    );
    return response.data.data;
  },

  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/recruitment/offers/stats'
    );
    return response.data.data;
  },
};