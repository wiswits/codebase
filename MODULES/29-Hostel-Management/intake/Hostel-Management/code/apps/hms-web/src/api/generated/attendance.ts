import { apiClient } from '../client';
import type { Attendance, CreateAttendanceBulk, AttendanceStatus } from '@shared/schemas/attendance';

export const attendanceApi = {
  createBulk: async (data: CreateAttendanceBulk) => {
    const response = await apiClient.post<{ count: number; errors?: Array<{ studentId: string; error: string }> }>(
      '/attendance/bulk',
      data
    );
    return response.data;
  },

  scanQR: async (data: { passCode?: string; studentQr?: string; deviceId?: string }) => {
    const response = await apiClient.post<{ attendance: Attendance; method: 'qr' }>('/attendance/qr-scan', data);
    return response.data;
  },

  getByDate: async (params: { hostelId: string; date: string }) => {
    const response = await apiClient.get<Attendance[]>('/attendance', { params });
    return response.data;
  },

  getRoster: async (params: { hostelId: string; date: string }) => {
    const response = await apiClient.get<Array<{
      studentId: string;
      studentName: string;
      roomNumber: string;
      bedLabel: string;
      status: AttendanceStatus | null;
    }>>('/attendance/roster', { params });
    return response.data;
  },

  getMissing: async (params: { hostelId: string; date: string }) => {
    const response = await apiClient.get<Array<{
      studentId: string;
      studentName: string;
      roomNumber: string;
      status: 'absent' | 'on_leave';
    }>>('/attendance/missing', { params });
    return response.data;
  },
};