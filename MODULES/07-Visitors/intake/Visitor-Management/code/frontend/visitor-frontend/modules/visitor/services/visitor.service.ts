import { apiRequest } from "./api";

import type {
  VisitorCreateRequest,
  VisitorResponse,
  VisitorCheckInResponse,
} from "./visitor.contract";

export const VisitorAPI = {
  getById(visitorId: number): Promise<VisitorResponse> {
    return apiRequest<VisitorResponse>(
      `/api/visitors/${visitorId}`
    );
  },

  checkIn(
    input: VisitorCreateRequest
  ): Promise<VisitorCheckInResponse> {
    return apiRequest<VisitorCheckInResponse>(
      "/api/visitors/check-in",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },

  checkOut(visitorId: number): Promise<VisitorResponse> {
    return apiRequest<VisitorResponse>(
      `/api/visitors/${visitorId}/check-out`,
      {
        method: "PATCH",
      }
    );
  },

  cancel(visitorId: number): Promise<VisitorResponse> {
    return apiRequest<VisitorResponse>(
      `/api/visitors/${visitorId}/cancel`,
      {
        method: "PATCH",
      }
    );
  },
};

export default VisitorAPI;