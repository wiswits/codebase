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
  VisitorService,
} from "@/services/visitor.service";

const initialPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export function useVisitorList(
  initialFilters: VisitorFilters = {}
) {
  const [visitors, setVisitors] =
    useState<Visitor[]>([]);

  const [filters, setFilters] =
    useState<VisitorFilters>(() => ({
      page: 1,
      limit: 20,
      ...initialFilters,
    }));

  const [pagination, setPagination] =
    useState<Pagination>(initialPagination);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadVisitors = useCallback(
    async (nextFilters: VisitorFilters) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.list(
            nextFilters
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

    async function fetchVisitors() {
      try {
        const response =
          await VisitorService.list(
            filters
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

    void fetchVisitors();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilters = useCallback(
    (
      updates: Partial<VisitorFilters>
    ) => {
      setLoading(true);

      setFilters((current) => ({
        ...current,
        ...updates,
      }));
    },
    []
  );

  const setSearch = useCallback(
    (search: string) => {
      setLoading(true);

      setFilters((current) => ({
        ...current,
        search,
        page: 1,
      }));
    },
    []
  );

  const setPage = useCallback(
    (page: number) => {
      setLoading(true);

      setFilters((current) => ({
        ...current,
        page,
      }));
    },
    []
  );

  const resetFilters = useCallback(
    () => {
      setLoading(true);

      setFilters({
        page: 1,
        limit:
          initialFilters.limit ?? 20,
        ...initialFilters,
      });
    },
    [initialFilters]
  );

  const refresh = useCallback(
    async () => {
      return loadVisitors(filters);
    },
    [filters, loadVisitors]
  );

  return {
    visitors,
    filters,
    pagination,
    loading,
    error,

    setFilters,
    updateFilters,
    setSearch,
    setPage,
    resetFilters,
    refresh,
  };
}