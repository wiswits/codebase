// src/modules/payroll/hooks/usePayslips.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/payroll.constants";
import { Payslip, PayslipListParams, Pagination } from "../types/payroll.types";

interface FiltersState {
  search: string;
  status: PayslipListParams["status"];
}

const initialFilters: FiltersState = { search: "", status: "" };

export function usePayslips() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<Payslip[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayslips({ ...filters, page, limit });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payslips.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

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
    refetch: fetchPayslips,
  };
}
