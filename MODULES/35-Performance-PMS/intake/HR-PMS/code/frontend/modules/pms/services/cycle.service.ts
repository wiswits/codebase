import type {
  APIResponse,
  AppraisalCycle,
  CreateAppraisalCyclePayload,
  UpdateAppraisalCyclePayload,
} from "../types";
import { apiRequest } from "./http-client";
import { PMS_API_BASE } from "../constants";
import { mapCycle } from "./mappers";

export const cycleService = {
  async list(): Promise<APIResponse<AppraisalCycle[]>> {
    const res = await apiRequest<any[]>(`${PMS_API_BASE}/cycles`);

    if (!res.success) return res;

    return {
      ...res,
      data: res.data.map(mapCycle),
    };
  },

  async get(id: string): Promise<APIResponse<AppraisalCycle>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/cycles/${id}`);

    if (!res.success) return res;

    return {
      ...res,
      data: mapCycle(res.data),
    };
  },

  async create(
    payload: CreateAppraisalCyclePayload,
  ): Promise<APIResponse<AppraisalCycle>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/cycles`, {
      method: "POST",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapCycle(res.data),
    };
  },

  async update(
    id: string,
    payload: UpdateAppraisalCyclePayload,
  ): Promise<APIResponse<AppraisalCycle>> {
    const res = await apiRequest<any>(`${PMS_API_BASE}/cycles/${id}`, {
      method: "PATCH",
      body: payload,
    });

    if (!res.success) return res;

    return {
      ...res,
      data: mapCycle(res.data),
    };
  },
};