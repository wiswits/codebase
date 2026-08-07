// src/modules/utilization/hooks/useBench.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/utilization.constants";
import {
  BenchListParams,
  BenchRecord,
  BenchRecordInput,
  Pagination,
} from "../types/utilization.types";

interface FiltersState {
  search: string;
  status: BenchListParams["status"];
  departmentId: BenchListParams["departmentId"];
}

const initialFilters: FiltersState = { search: "", status: "", departmentId: "" };

export function useBench() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<BenchRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchBench = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getBenchRecords({ ...filters, page, limit });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bench records.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchBench();
  }, [fetchBench]);

  const updateFilters = (next: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(DEFAULT_PAGE);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(DEFAULT_PAGE);
  };

  const addRecord = async (input: BenchRecordInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await utilizationApi.addBenchRecord(input);
      await fetchBench();
      return created;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to add this bench record.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const closeRecord = async (benchId: number) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await utilizationApi.closeBenchRecord(benchId);
      await fetchBench();
      return updated;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to close this bench record.");
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
    addRecord,
    closeRecord,
    refetch: fetchBench,
  };
}
