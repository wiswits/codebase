"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Pagination,
  Visitor,
  VisitorFilters,
  VisitorPass,
  VisitorService,
} from "@/services/visitor.service";

const defaultPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export function useVisitors(
  initialFilters: VisitorFilters = {}
) {
  const [visitors, setVisitors] =
    useState<Visitor[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>(
      defaultPagination
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadVisitors = useCallback(
    async (
      filters: VisitorFilters = {}
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.list(
            filters
          );

        setVisitors(response.data);

        setPagination(
          response.pagination
        );

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load visitors.";

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeVisitors() {
      try {
        const response =
          await VisitorService.list(
            initialFilters
          );

        if (cancelled) {
          return;
        }

        setVisitors(response.data);

        setPagination(
          response.pagination
        );

        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load visitors."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeVisitors();

    return () => {
      cancelled = true;
    };
  }, [initialFilters]);

  const getVisitor = useCallback(
    async (visitorId: number) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.get(
            visitorId
          );

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load visitor.";

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkoutVisitor = useCallback(
    async (visitorId: number) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.checkOut(
            visitorId
          );

        setVisitors((current) =>
          current.map((visitor) =>
            visitor.id === visitorId
              ? response.data
              : visitor
          )
        );

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

  const cancelVisitor = useCallback(
    async (visitorId: number) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.cancel(
            visitorId
          );

        setVisitors((current) =>
          current.map((visitor) =>
            visitor.id === visitorId
              ? response.data
              : visitor
          )
        );

        return response.data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to cancel visitor.";

        setError(message);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
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

        setVisitors((current) =>
          current.map((visitor) =>
            visitor.id === visitorId
              ? {
                  ...visitor,
                  pass: response.data,
                }
              : visitor
          )
        );

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

  const clearError = useCallback(
    () => {
      setError(null);
    },
    []
  );

  return {
    visitors,
    pagination,
    loading,
    error,

    loadVisitors,
    getVisitor,
    checkoutVisitor,
    cancelVisitor,
    generatePass,
    clearError,
  };
}