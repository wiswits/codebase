import type {
  Visitor,
  VisitorStatus,
  Pagination,
} from "./visitor.types";

export interface VisitorListFilters {
  search?: string;
  status?: VisitorStatus | "";
  visitorType?: string;

  page?: number;
  limit?: number;
}

export interface VisitorListState {
  visitors: Visitor[];

  pagination: Pagination;

  loading: boolean;

  error: string | null;
}

export interface VisitorListResult {
  success: boolean;
  data: Visitor[];
  pagination: Pagination;
}