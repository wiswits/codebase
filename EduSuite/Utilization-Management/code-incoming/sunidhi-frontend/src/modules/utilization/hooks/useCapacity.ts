// src/modules/utilization/hooks/useCapacity.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/utilization.constants";
import {
  CapacityListParams,
  CapacityPlan,
  CapacityPlanInput,
  Pagination,
} from "../types/utilization.types";

interface FiltersState {
  search: string;
  period: CapacityListParams["period"];
}

const initialFilters: FiltersState = { search: "", period: "" };

export function useCapacity() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<CapacityPlan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchCapacity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getCapacityPlans({ ...filters, page, limit });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load capacity plans.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchCapacity();
  }, [fetchCapacity]);

  const updateFilters = (next: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(DEFAULT_PAGE);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(DEFAULT_PAGE);
  };

  const savePlan = async (input: CapacityPlanInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const saved = await utilizationApi.saveCapacityPlan(input);
      await fetchCapacity();
      return saved;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save this capacity plan.");
      return null;
    } finally {
      setSubmitting(false);
    }
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
    submitting,
    submitError,
    savePlan,
    refetch: fetchCapacity,
  };
}
