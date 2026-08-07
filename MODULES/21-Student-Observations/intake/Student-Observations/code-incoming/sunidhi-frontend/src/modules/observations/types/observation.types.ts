// src/modules/observations/types/observation.types.ts
//
// Canonical Observation API model (Contract Section 20).
// Shared between Sunidhi's list experience and Ankit's form/detail/dashboard.

export type ObservationType = "anecdotal" | "class_school";

export interface Observation {
  id: number;
  organizationId: number;
  studentId: number;
  authorId: number;
  observationType: ObservationType;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Approved display-enrichment fields (Section 20) — not raw DB columns.
  studentName?: string;
  authorName?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ObservationListResult {
  items: Observation[];
  pagination: Pagination;
}

export interface ObservationListParams {
  page?: number;
  limit?: number;
  search?: string;
  studentId?: number;
  observationType?: ObservationType | "";
}
