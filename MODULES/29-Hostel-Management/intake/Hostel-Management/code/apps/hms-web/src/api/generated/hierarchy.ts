import { apiClient } from '../client';
import type { 
  Hostel, 
  CreateHostel, 
  UpdateHostel, 
  Building, 
  Wing, 
  Floor, 
  Room, 
  Bed,
  CreateBedBulk 
} from '@shared/schemas/hostel';
import type { Pagination } from '@shared/schemas/common';

// Hostels
export const hostelApi = {
  getAll: async (params?: { limit?: number; cursor?: string }) => {
    const response = await apiClient.get<{ data: Hostel[]; nextCursor?: string }>('/hostels', { params });
    return response.data;
  },

  create: async (data: CreateHostel) => {
    const response = await apiClient.post<Hostel>('/hostels', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Hostel>(`/hostels/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateHostel) => {
    const response = await apiClient.patch<Hostel>(`/hostels/${id}`, data);
    return response.data;
  },

  getTree: async (id: string) => {
    const response = await apiClient.get<{
      hostel: Hostel;
      buildings: Array<Building & {
        wings: Array<Wing & {
          floors: Array<Floor & {
            rooms: Array<Room & { beds: Bed[] }>;
          }>;
        }>;
      }>;
    }>(`/hostels/${id}/tree`);
    return response.data;
  },
};

// Buildings
export const buildingApi = {
  create: async (data: { hostelId: string; code: string; name: string; caretakerUserId?: string }) => {
    const response = await apiClient.post<Building>('/buildings', data);
    return response.data;
  },
};

// Wings
export const wingApi = {
  create: async (data: { buildingId: string; code: string; direction?: 'E' | 'W' | 'N' | 'S'; caretakerUserId?: string }) => {
    const response = await apiClient.post<Wing>('/wings', data);
    return response.data;
  },
};

// Floors
export const floorApi = {
  create: async (data: { wingId: string; floorNumber: number }) => {
    const response = await apiClient.post<Floor>('/floors', data);
    return response.data;
  },
};

// Rooms
export const roomApi = {
  create: async (data: { floorId: string; roomNumber: string; roomType: string; maxCapacity: number; furniture?: Record<string, unknown> }) => {
    const response = await apiClient.post<Room>('/rooms', data);
    return response.data;
  },
};

// Beds
export const bedApi = {
  getAvailable: async (params?: { hostelId?: string; roomType?: string; status?: 'vacant' | 'occupied' | 'blocked' | 'reserved' }) => {
    const response = await apiClient.get<Bed[]>('/beds', { params });
    return response.data;
  },

  createBulk: async (data: CreateBedBulk) => {
    const response = await apiClient.post<Bed[]>(`/rooms/${data.roomId}/beds/bulk`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: 'blocked' | 'unblocked') => {
    const response = await apiClient.patch<Bed>(`/beds/${id}/status`, { status });
    return response.data;
  },
};