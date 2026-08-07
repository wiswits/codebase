export type PassStatus =
  | "active"
  | "expired"
  | "revoked";

export interface VisitorPass {
  id: number;
  org_id: number;
  visitor_log_id: number;

  pass_code: string;

  status: PassStatus;

  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface GeneratePassRequest {
  visitorId: number;
  expiresAt?: string | null;
}

export interface PassResponse {
  success: boolean;
  message?: string;
  data: VisitorPass;
}