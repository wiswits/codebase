import type {
  APIResponse,
  AppraisalGoal,
  CreateAppraisalGoalPayload,
  UpdateAppraisalGoalPayload,
} from "../types";
import { apiRequest } from "./http-client";
import { PMS_API_BASE } from "../constants";
import { mapGoal } from "./mappers";

export const goalService = {
  async list(cycleId?: string): Promise<APIResponse<AppraisalGoal[]>> {
    const query = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : "";

    const res = await apiRequest<any[]>(`${PMS_API_BASE}/goals${query}`);

    if (!res.success) return res;

    return {
      ...res,
      data: res.data.map(mapGoal),
    };
  },

  async get(id: string): Promise<APIResponse<AppraisalGoal>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/goals/${id}`);

    if (!res.success) return res;

    return {
      ...res,
      data: mapGoal(res.data),
    };
  },

  async create(
    payload: CreateAppraisalGoalPayload,
    currentUser: { id: string; name: string },
  ): Promise<APIResponse<AppraisalGoal>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/goals`, {
      method: "POST",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapGoal(res.data),
    };
  },

  async update(
    id: string,
    payload: UpdateAppraisalGoalPayload,
  ): Promise<APIResponse<AppraisalGoal>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/goals/${id}`, {
      method: "PATCH",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapGoal(res.data),
    };
  },
};