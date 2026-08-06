"use client";

import { useCallback, useState } from "react";

import {
  CheckInVisitorInput,
  Visitor,
  VisitorService,
} from "@/services/visitor.service";

export function useVisitorRegistration() {
  const [visitor, setVisitor] =
    useState<Visitor | null>(null);

  const [notification, setNotification] =
    useState<unknown>(null);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const registerVisitor = useCallback(
    async (
      input: CheckInVisitorInput
    ): Promise<Visitor> => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response =
          await VisitorService.checkIn(input);

        setVisitor(response.data);
        setNotification(response.notification);
        setMessage(response.message);

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unable to register visitor.";

        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setVisitor(null);
    setNotification(null);
    setMessage(null);
    setError(null);
  }, []);

  return {
    visitor,
    notification,
    message,
    loading,
    error,
    registerVisitor,
    reset,
  };
}