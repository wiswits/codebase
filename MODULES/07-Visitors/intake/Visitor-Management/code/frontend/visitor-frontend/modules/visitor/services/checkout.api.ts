import { apiRequest } from "./api";

import type {
  VisitorResponse,
} from "./visitor.contract";

export const CheckoutAPI = {
  checkOut(
    visitorId: number
  ): Promise<VisitorResponse> {
    return apiRequest<VisitorResponse>(
      `/api/visitors/${visitorId}/check-out`,
      {
        method: "PATCH",
      }
    );
  },

  cancel(
    visitorId: number
  ): Promise<VisitorResponse> {
    return apiRequest<VisitorResponse>(
      `/api/visitors/${visitorId}/cancel`,
      {
        method: "PATCH",
      }
    );
  },
};