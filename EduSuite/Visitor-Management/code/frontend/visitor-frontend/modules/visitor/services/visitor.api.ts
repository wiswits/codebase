import type {
  Visitor,
  VisitorStatus,
  VisitorPass,
} from "../types/visitor.types";

export interface VisitorCreateRequest {
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorType?: string;
  purpose: string;
  hostId: number;
  hostName?: string;
}

export interface VisitorListRequest {
  search?: string;
  status?: VisitorStatus | "";
  visitorType?: string;
  page?: number;
  limit?: number;
}

export interface VisitorPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VisitorListResponse {
  success: boolean;
  data: Visitor[];
  pagination: VisitorPagination;
}

export interface VisitorResponse {
  success: boolean;
  message?: string;
  data: Visitor;
}

export interface VisitorCheckInResponse {
  success: boolean;
  message: string;
  data: Visitor;
  notification?: unknown;
}

export interface VisitorPassResponse {
  success: boolean;
  message: string;
  data: VisitorPass;
}

export interface GeneratePassRequest {
  expiresAt?: string | null;
}