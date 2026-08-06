"use client";

import { useCallback, useState } from "react";

import {
  VisitorPass,
  VisitorService,
} from "@/services/visitor.service";

export function useVisitorPass() {
  const [pass, setPass] =
    useState<VisitorPass | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const generatePass = useCallback(
    async (
      visitorId: number,
      expiresAt?: string | null
    ): Promise<VisitorPass> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.issuePass(
            visitorId,
            expiresAt
          );

        setPass(response.data);

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to generate visitor pass.";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const printPass = useCallback(
    (visitorPass?: VisitorPass | null) => {
      const targetPass = visitorPass ?? pass;

      if (!targetPass) {
        setError(
          "No visitor pass is available to print."
        );
        return;
      }

      setError(null);

      if (typeof window !== "undefined") {
        window.print();
      }
    },
    [pass]
  );

  const clearPass = useCallback(() => {
    setPass(null);
    setError(null);
  }, []);

  return {
    pass,
    loading,
    error,
    generatePass,
    printPass,
    clearPass,
  };
}