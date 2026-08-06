import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';
import { errorSchema } from '@shared/schemas/common';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/hms/v1',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Redirect to APEX login
          window.location.href = `${import.meta.env.VITE_APEX_URL}/login?redirect=${window.location.pathname}`;
        }
        
        // Parse error response
        if (error.response?.data) {
          try {
            const parsed = errorSchema.parse(error.response.data);
            throw new ApiError(parsed.error.code, parsed.error.message, parsed.error.details);
          } catch (parseError) {
            // If parsing fails, throw original error
            throw error;
          }
        }
        throw error;
      }
    );
  }

  get client() {
    return this.client;
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient().client;