import { apiRequest } from "./api";

import type {
  VisitorPassResponse,
} from "./visitor.contract";

export const PassAPI = {
  generate(
    visitorId: number,
    expiresAt?: string | null
  ): Promise<VisitorPassResponse> {
    return apiRequest<VisitorPassResponse>(
      `/api/visitors/${visitorId}/pass`,
      {
        method: "POST",
        body: JSON.stringify(
          expiresAt
            ? { expiresAt }
            : {}
        ),
      }
    );
  },

  getVisitor(
    visitorId: number
  ) {
    return apiRequest(
      `/api/visitors/${visitorId}`
    );
  },
};