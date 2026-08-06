import type {
  Visitor,
  VisitorStatus,
} from "./visitor.types";

export interface VisitorHistoryItem {
  id: number;

  visitorId: number;

  visitorName: string;

  status: VisitorStatus;

  checkInAt: string;

  checkOutAt: string | null;

  hostName: string | null;

  purpose: string;
}

export interface VisitorHistoryFilters {
  search?: string;

  status?: VisitorStatus | "";

  fromDate?: string;

  toDate?: string;
}

export function visitorToHistoryItem(
  visitor: Visitor
): VisitorHistoryItem {
  return {
    id: visitor.id,
    visitorId: visitor.id,
    visitorName: visitor.visitor_name,
    status: visitor.status,
    checkInAt: visitor.check_in_at,
    checkOutAt: visitor.check_out_at,
    hostName: visitor.host_name,
    purpose: visitor.purpose,
  };
}