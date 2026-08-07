/**
 * Alumni API Service
 * All API calls for the Alumni module
 */

import { mockDashboardStats, mockProfile } from '../mocks/alumniDashboard.mock';

// Use this to switch between mock and real API
const USE_MOCK = true;

const API_BASE = '/api/v1/alumni';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const alumniApi = {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    if (USE_MOCK) {
      await delay(600);
      return {
        success: true,
        data: mockDashboardStats
      };
    }

    try {
      const response = await fetch(`${API_BASE}/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch alumni statistics'
        }
      };
    }
  },

  /**
   * Get alumni list with pagination and filters
   */
  async getAlumni(params = {}) {
    if (USE_MOCK) {
      await delay(500);
      // Return mock data from dashboard
      const mockData = {
        success: true,
        data: {
          items: mockDashboardStats.recentAlumni,
          pagination: {
            page: 1,
            limit: 20,
            total: mockDashboardStats.recentAlumni.length,
            totalPages: 1
          }
        }
      };
      return mockData;
    }

    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE}?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch alumni'
        }
      };
    }
  },

  /**
   * Get alumni profile by ID
   */
  async getProfile(id) {
    if (USE_MOCK) {
      await delay(400);
      return {
        success: true,
        data: mockProfile
      };
    }

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch alumni profile'
        }
      };
    }
  },

  /**
   * Get batches list
   */
  async getBatches() {
    if (USE_MOCK) {
      await delay(300);
      return {
        success: true,
        data: {
          batches: ['2024', '2023', '2022', '2021', '2020']
        }
      };
    }

    try {
      const response = await fetch(`${API_BASE}/batches`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch batches'
        }
      };
    }
  }
};