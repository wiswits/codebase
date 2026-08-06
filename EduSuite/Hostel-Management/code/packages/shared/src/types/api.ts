import { z } from 'zod';
import { errorSchema, successSchema, paginatedResponseSchema } from '../schemas/common';

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total?: number;
  limit: number;
  cursor?: string;
  hasMore: boolean;
}

// Request context
export interface RequestContext {
  userId: string;
  orgId: string;
  campusIds: string[];
  roles: string[];
  permissions: string[];
  studentId?: string;
  parentOf?: string[];
  ip?: string;
  userAgent?: string;
  requestId: string;
}

// Filter types
export interface FilterOptions {
  search?: string;
  status?: string | string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

// Sort options
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// Query options
export interface QueryOptions extends FilterOptions, SortOptions {
  include?: string[];
  fields?: string[];
}