"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  fetchAlumni
} from "../services/alumniApi";

import type {
  Alumni,
  AlumniQuery,
  Pagination
} from "../types/alumni.types";

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

export function useAlumni(
  query: AlumniQuery
) {
  const [items, setItems] =
    useState<Alumni[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>(
      EMPTY_PAGINATION
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await fetchAlumni(query);

        setItems(result.items);
        setPagination(
          result.pagination
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load alumni."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      query.search,
      query.batch,
      query.graduationYear,
      query.course,
      query.page,
      query.limit
    ]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    pagination,
    loading,
    error,
    refresh: load
  };
}