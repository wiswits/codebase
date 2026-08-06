export type VisitorStatus =
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type VisitorType =
  | "guest"
  | "parent"
  | "vendor"
  | "staff"
  | "student"
  | "other";

export interface VisitorPass {
  id: number;
  org_id: number;
  visitor_log_id: number;
  pass_code: string;

  status:
    | "active"
    | "expired"
    | "revoked";

  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface Visitor {
  id: number;
  org_id: number;

  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  visitor_type: string | null;

  purpose: string;

  host_id: number;
  host_name: string | null;

  check_in_at: string;
  check_out_at: string | null;

  status: VisitorStatus;

  checked_in_by: number | null;
  checked_out_by: number | null;

  created_at: string;
  updated_at: string;

  pass?: VisitorPass | null;
}

export interface VisitorCreateRequest {
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorType?: string;

  purpose: string;

  hostId: number;
  hostName?: string;
}

export interface VisitorFilters {
  search?: string;
  status?: VisitorStatus | "";
  visitorType?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VisitorListResponse {
  success: boolean;
  data: Visitor[];
  pagination: Pagination;
}

export interface VisitorResponse {
  success: boolean;
  message?: string;
  data: Visitor;
}