"use client";

import { useCallback, useState } from "react";
import {
  Visitor,
  VisitorService,
} from "@/services/visitor.service";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  const checkout = useCallback(
    async (visitorId: number): Promise<Visitor> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.checkOut(visitorId);

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to check out visitor.";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    checkout,
    loading,
    error,
    clearError,
  };
}