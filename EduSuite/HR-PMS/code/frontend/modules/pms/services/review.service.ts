import type {
  APIResponse,
  AppraisalReview,
  CreateAppraisalReviewPayload,
  UpdateAppraisalReviewPayload,
} from "../types";
import { apiRequest } from "./http-client";
import { PMS_API_BASE } from "../constants";
import { mapReview } from "./mappers";

export interface ListReviewsFilters {
  cycleId?: string;
  employeeId?: string;
  reviewType?: "self" | "reviewer";
}

export const reviewService = {
  async list(
    filters: ListReviewsFilters = {},
  ): Promise<APIResponse<AppraisalReview[]>> {
    const params = new URLSearchParams();

    if (filters.cycleId) params.set("cycleId", filters.cycleId);
    if (filters.employeeId) params.set("employeeId", filters.employeeId);
    if (filters.reviewType) params.set("reviewType", filters.reviewType);

    const query = params.toString() ? `?${params.toString()}` : "";

    const res = await apiRequest<any[]>(`${PMS_API_BASE}/reviews${query}`);

    if (!res.success) return res;

    return {
      ...res,
      data: res.data.map(mapReview),
    };
  },

  async get(id: string): Promise<APIResponse<AppraisalReview>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/reviews/${id}`);

    if (!res.success) return res;

    return {
      ...res,
      data: mapReview(res.data),
    };
  },

  async create(
    payload: CreateAppraisalReviewPayload,
    currentUser: { id: string; name: string },
  ): Promise<APIResponse<AppraisalReview>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/reviews`, {
      method: "POST",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapReview(res.data),
    };
  },

  async update(
    id: string,
    payload: UpdateAppraisalReviewPayload,
  ): Promise<APIResponse<AppraisalReview>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/reviews/${id}`, {
      method: "PATCH",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapReview(res.data),
    };
  },
};