import { apiRequest } from "./api";

import type {
  VisitorListRequest,
  VisitorListResponse,
} from "./visitor.contract";

import { buildQueryParams } from "../utils/queryParams";

export const VisitorListAPI = {
  list(
    filters: VisitorListRequest = {}
  ): Promise<VisitorListResponse> {
    const query = buildQueryParams({
      search: filters.search,
      status: filters.status,
      visitorType: filters.visitorType,
      page: filters.page,
      limit: filters.limit,
    });

    return apiRequest<VisitorListResponse>(
      `/api/visitors${query}`
    );
  },
};