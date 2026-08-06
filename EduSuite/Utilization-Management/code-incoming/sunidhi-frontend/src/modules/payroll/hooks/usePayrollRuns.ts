// src/modules/payroll/hooks/usePayrollRuns.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/payroll.constants";
import { PayrollRun, PayrollRunListParams, Pagination } from "../types/payroll.types";

interface FiltersState {
  search: string;
  status: PayrollRunListParams["status"];
}

const initialFilters: FiltersState = { search: "", status: "" };

export function usePayrollRuns() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<PayrollRun[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getRuns({ ...filters, page, limit });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payroll runs.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const updateFilters = (next: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(DEFAULT_PAGE);
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
    refetch: fetchRuns,
  };
}
