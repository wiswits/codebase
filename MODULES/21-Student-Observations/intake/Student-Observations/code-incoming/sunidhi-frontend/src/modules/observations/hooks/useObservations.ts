// src/modules/observations/hooks/useObservations.ts
//
// Sunidhi's hook (Section 17 primary files).
// Data flow: Component -> Hook -> observationsApi -> Mock (today) / Real API (integration).

"use client";

import { useCallback, useEffect, useState } from "react";
import { observationsApi } from "../services/observationsApi";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../constants/observation.constants";
import {
  Observation,
  ObservationListParams,
  Pagination,
} from "../types/observation.types";

interface ObservationFiltersState {
  search: string;
  observationType: ObservationListParams["observationType"];
}

const initialFilters: ObservationFiltersState = {
  search: "",
  observationType: "",
};

export function useObservations() {
  const [filters, setFilters] = useState<ObservationFiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<Observation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await observationsApi.getObservations({
        ...filters,
        page,
        limit,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load observations."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  const updateFilters = (next: Partial<ObservationFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(DEFAULT_PAGE); // reset to first page whenever a filter changes
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(DEFAULT_PAGE);
  };

  return {
    items,
    pagination,
    loading,
    error,
    filters,
    page,
    setPage,
    updateFilters,
    resetFilters,
    refetch: fetchObservations,
  };
}
