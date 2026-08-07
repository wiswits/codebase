import { PMS_API_BASE } from "../constants";
import type { APIResponse, RatingSummary } from "../types";
import { apiRequest } from "./http-client";
import { mapSummary } from "./mappers";

export const summaryService = {
  async get(
    cycleId: string,
    employeeId: string,
  ): Promise<APIResponse<RatingSummary>> {
    if (!cycleId || !employeeId) {
      return {
        success: true,
        data: {} as RatingSummary,
      };
    }

    const res = await apiRequest<any>(
      `${PMS_API_BASE}/summary/employee/${employeeId}/cycle/${cycleId}`
    );

    if (!res.success) return res;

    return {
      ...res,
      data: mapSummary(res.data),
    };
  },
};