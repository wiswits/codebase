"use client";

import { useCallback, useState } from "react";

export interface HostNotificationState {
  visitorId?: number;
  hostId?: number;
  hostName?: string | null;
  notification?: unknown;
}

export function useHostNotification() {
  const [notification, setNotification] =
    useState<HostNotificationState | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const setHostNotification = useCallback(
    (data: HostNotificationState) => {
      setError(null);
      setNotification(data);
    },
    []
  );

  const notifyHost = useCallback(
    async (
      data: HostNotificationState
    ): Promise<HostNotificationState> => {
      setLoading(true);
      setError(null);

      try {
        setNotification(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to process host notification.";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
    setError(null);
  }, []);

  return {
    notification,
    loading,
    error,
    notifyHost,
    setHostNotification,
    clearNotification,
  };
}